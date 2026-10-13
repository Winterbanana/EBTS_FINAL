import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { Equipment, BorrowRequest, EquipmentAuditLog, User } from './types';
import { USERS as INITIAL_USERS } from './data/mockData';
import { INITIAL_EQUIPMENT, INVENTORY_VERSION } from './data/equipmentCatalog';
import { loadAppState, saveAppState } from './api';
import { calculateOverduePenalty, getOverdueDays } from './penalties';
import { MAX_ACTIVE_BORROW_LIMIT, getBorrowingLimitMessage, getStudentActiveBorrowCount } from './borrowing';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}
function saveState<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export default function App() {
  // ── Persisted state: users, equipment, requests ───────────────────────────
  const [users, setUsersState] = useState<User[]>(() =>
    loadState('wcc_users', INITIAL_USERS)
  );
  const [equipment, setEquipmentState] = useState<Equipment[]>(() =>
    loadState('wcc_equipment', INITIAL_EQUIPMENT)
  );
  const [requests, setRequestsState] = useState<BorrowRequest[]>(() =>
    loadState('wcc_requests', [])
  );
  const [equipmentAuditLogs, setEquipmentAuditLogs] = useState<EquipmentAuditLog[]>(() =>
    loadState('wcc_equipment_audit_logs', [])
  );
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState('');
  const knownRevisionRef = useRef(0);
  const skipPersistenceSnapshotRef = useRef('');

  // Persist on every change
  const setUsers = (next: User[] | ((prev: User[]) => User[])) => {
    setUsersState(prev => {
      const result = typeof next === 'function' ? next(prev) : next;
      saveState('wcc_users', result);
      return result;
    });
  };
  const setEquipment = (next: Equipment[] | ((prev: Equipment[]) => Equipment[])) => {
    setEquipmentState(prev => {
      const result = typeof next === 'function' ? next(prev) : next;
      saveState('wcc_equipment', result);
      return result;
    });
  };
  const setRequests = (next: BorrowRequest[] | ((prev: BorrowRequest[]) => BorrowRequest[])) => {
    setRequestsState(prev => {
      const result = typeof next === 'function' ? next(prev) : next;
      saveState('wcc_requests', result);
      return result;
    });
  };

  useEffect(() => {
    let cancelled = false;
    loadAppState()
      .then(state => {
        if (cancelled) return;
        if (!state) {
          setDatabaseError('No existing database records were found. Local starter data will not be written to the database.');
          return;
        }
        knownRevisionRef.current = state.revision ?? 0;
        const savedUsers = state.users as User[];
        const savedEquipment = state.equipment as Equipment[];
        const savedRequests = state.requests as BorrowRequest[];
        const savedAuditLogs = (state.equipmentAuditLogs || []) as EquipmentAuditLog[];
        setEquipmentAuditLogs(savedAuditLogs);
        setUsersState(savedUsers);
        setEquipmentState(savedEquipment);
        setRequestsState(savedRequests);
        saveState('wcc_users', savedUsers);
        saveState('wcc_equipment', savedEquipment);
        saveState('wcc_requests', savedRequests);
        saveState('wcc_equipment_audit_logs', savedAuditLogs);
        setDatabaseError('');
        setDatabaseReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDatabaseError(error instanceof Error ? error.message : 'Database connection failed.');
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!databaseReady) return;
    let cancelled = false;
    const refreshIfChanged = () => {
      loadAppState()
        .then(state => {
          if (cancelled || !state || (state.revision ?? 0) <= knownRevisionRef.current) return;
          knownRevisionRef.current = state.revision ?? 0;
          const latestUsers = state.users as User[];
          const latestEquipment = state.equipment as Equipment[];
          const latestRequests = state.requests as BorrowRequest[];
          const latestAuditLogs = (state.equipmentAuditLogs || []) as EquipmentAuditLog[];
          skipPersistenceSnapshotRef.current = JSON.stringify({
            users: latestUsers,
            equipment: latestEquipment,
            requests: latestRequests,
            equipmentAuditLogs: latestAuditLogs,
            inventoryVersion: INVENTORY_VERSION,
          });
          setUsersState(latestUsers);
          setEquipmentState(latestEquipment);
          setRequestsState(latestRequests);
          setEquipmentAuditLogs(latestAuditLogs);
          saveState('wcc_users', latestUsers);
          saveState('wcc_equipment', latestEquipment);
          saveState('wcc_requests', latestRequests);
          saveState('wcc_equipment_audit_logs', latestAuditLogs);
          setDatabaseError('');
        })
        .catch((error: unknown) => {
          if (!cancelled) setDatabaseError(error instanceof Error ? error.message : 'Database refresh failed.');
        });
    };
    window.addEventListener('focus', refreshIfChanged);
    const refreshTimer = window.setInterval(refreshIfChanged, 15000);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshIfChanged);
      window.clearInterval(refreshTimer);
    };
  }, [databaseReady]);

  useEffect(() => {
    if (!databaseReady) return;
    const snapshot = JSON.stringify({ users, equipment, requests, equipmentAuditLogs, inventoryVersion: INVENTORY_VERSION });
    if (skipPersistenceSnapshotRef.current === snapshot) {
      skipPersistenceSnapshotRef.current = '';
      return;
    }
    saveAppState({ users, equipment, requests, equipmentAuditLogs, inventoryVersion: INVENTORY_VERSION })
      .then(revision => {
        knownRevisionRef.current = revision;
        setDatabaseError('');
      })
      .catch((error: unknown) => {
        setDatabaseError(error instanceof Error ? error.message : 'Database save failed.');
      });
  }, [databaseReady, users, equipment, requests, equipmentAuditLogs]);

  // ── Session state ─────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Inactivity timer ──────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    logoutTimerRef.current = null;
    warningTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startInactivityTimer = useCallback(() => {
    clearAllTimers();
    setInactivityWarning(false);
    warningTimerRef.current = setTimeout(() => {
      setInactivityWarning(true);
      setWarningCountdown(60);
      countdownRef.current = setInterval(() => {
        setWarningCountdown(s => (s > 0 ? s - 1 : 0));
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setInactivityWarning(false);
      setCurrentUser(null);
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearAllTimers]);

  useEffect(() => {
    if (!currentUser) { clearAllTimers(); setInactivityWarning(false); return; }
    startInactivityTimer();
    const EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const resetTimer = () => { setInactivityWarning(false); startInactivityTimer(); };
    EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    return () => { EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer)); clearAllTimers(); };
  }, [currentUser, startInactivityTimer, clearAllTimers]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = (user: User) => {
    // Always use the latest version from persisted users state
    const fresh = users.find(u => u.id === user.id) || user;
    setCurrentUser(fresh);
  };

  const handleRegister = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleLogout = () => {
    clearAllTimers();
    setInactivityWarning(false);
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser: User) => {
    // Only update the active session when the edited account is logged in.
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  // ── Equipment / request handlers ──────────────────────────────────────────
  const handleAddRequest = (request: BorrowRequest) => {
    if (getStudentActiveBorrowCount(request.studentId, requests) >= MAX_ACTIVE_BORROW_LIMIT) {
      alert(getBorrowingLimitMessage());
      return;
    }
    setRequests(prev => [...prev, request]);
  };
  const handleUpdateRequests = (updatedRequests: BorrowRequest[]) => {
    const countsByStudent: Record<string, number> = {};
    updatedRequests.forEach(req => {
      if (req.status === 'Approved') {
        countsByStudent[req.studentId] = (countsByStudent[req.studentId] ?? 0) + 1;
      }
    });
    const violation = Object.entries(countsByStudent).find(([, count]) => count > MAX_ACTIVE_BORROW_LIMIT);
    if (violation) {
      alert(getBorrowingLimitMessage());
      return;
    }
    setRequests(updatedRequests);
  };
  const handleUpdateEquipment = (updatedEquipment: Equipment[]) => {
    setEquipment(updatedEquipment);
  };
  const handleRemoveEquipment = (equipmentId: string) => {
    const item = equipment.find(candidate => candidate.id === equipmentId);
    if (!item || currentUser?.role !== 'admin') return;
    const hasOpenRequest = requests.some(request =>
      request.equipmentId === equipmentId && (
        request.status === 'Pending' ||
        request.status === 'Approved' ||
        (request.status === 'Missing' && !request.missingItemPaid && !request.missingItemReturned)
      )
    );
    if (hasOpenRequest) {
      alert('This equipment has an open request or unresolved loan and cannot be removed yet.');
      return;
    }

    const log: EquipmentAuditLog = {
      id: `AUD-${Date.now()}`,
      equipmentId: item.id,
      event: 'Equipment Removed',
      actor: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      detail: `${item.name} (${item.brand || 'WCC'}) removed from ${item.category} inventory. Historical requests retained.`,
    };
    setEquipment(prev => prev.filter(candidate => candidate.id !== equipmentId));
    setEquipmentAuditLogs(prev => {
      const updated = [...prev, log];
      saveState('wcc_equipment_audit_logs', updated);
      return updated;
    });
  };
  const handlePaymentComplete = (requestId: string, paymentMethod: string) => {
    const request = requests.find(candidate => candidate.id === requestId);
    if (
      !request ||
      request.penaltyPaid ||
      request.penaltyPaymentStatus === 'Paid' ||
      request.penaltyPaymentStatus === 'Pending' ||
      !['Approved', 'Returned', 'Missing'].includes(request.status)
    ) return;

    const penaltyDate = request.returnDate
      ? new Date(`${request.returnDate}T00:00:00`)
      : new Date();
    const overdueDays = request.overdueDays ?? getOverdueDays(request.dueDate, penaltyDate);
    const penalty = request.penalty ?? calculateOverduePenalty(request.dueDate, penaltyDate);
    if (penalty <= 0) return;

    setRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      penalty,
      overdueDays,
      penaltyPaid: false,
      penaltyPaymentStatus: 'Pending',
      penaltyPaymentMethod: paymentMethod,
      penaltyPaymentSubmittedDate: new Date().toISOString().split('T')[0],
      penaltyPaymentDate: undefined,
      penaltyVerifiedBy: undefined,
    } : r));
  };

  const handleConfirmPenaltyPayment = (requestId: string) => {
    const request = requests.find(candidate => candidate.id === requestId);
    if (!request || request.penaltyPaymentStatus !== 'Pending') return;
    const paymentDate = new Date().toISOString().split('T')[0];
    setRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      penaltyPaid: true,
      penaltyPaymentStatus: 'Paid',
      penaltyPaymentDate: paymentDate,
      penaltyVerifiedBy: currentUser?.name ?? 'Staff',
    } : r));
  };

  const handleReturnItem = (requestId: string, returnData?: {
    conditionAfter: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
    conditionNotes?: string;
    returnPhotoUrl?: string;
    reportedMissing: boolean;
    missingNotes?: string;
  }) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    const overdueDays = getOverdueDays(request.dueDate);
    const penalty = calculateOverduePenalty(request.dueDate);
    const penaltyPaid = request.penaltyPaid || request.penaltyPaymentStatus === 'Paid';
    if (request.penaltyPaymentStatus === 'Pending' || (penalty > 0 && !penaltyPaid)) {
      alert('Please wait for staff to verify the penalty payment before returning this item.');
      return;
    }

    setRequests(prev => prev.map(r => r.id === requestId ? {
      ...r,
      status: (returnData?.reportedMissing ? 'Missing' : 'Returned') as const,
      returnDate: new Date().toISOString().split('T')[0],
      returnTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      penalty, overdueDays,
      overdueHours: overdueDays * 24,
      conditionAfter: returnData?.conditionAfter,
      conditionNotes: returnData?.conditionNotes,
      returnPhotoUrl: returnData?.returnPhotoUrl,
      reportedMissing: returnData?.reportedMissing,
      missingNotes: returnData?.missingNotes,
    } : r));

    setEquipment(prev => prev.map(e => e.id === request.equipmentId ? {
      ...e,
      availableStock: returnData?.reportedMissing ? e.availableStock : Math.min(e.totalStock, e.availableStock + 1),
      borrowedStock: Math.max(0, e.borrowedStock - 1),
      status: (returnData?.reportedMissing
        ? (e.availableStock > 0 ? 'Available' : 'Missing')
        : (Math.min(e.totalStock, e.availableStock + 1) > 0 ? 'Available' : 'Borrowed')) as const,
      borrowedBy: undefined, borrowDate: undefined, dueDate: undefined,
      lastBorrowedBy: returnData?.reportedMissing ? request.studentName : e.lastBorrowedBy,
      markedMissingDate: returnData?.reportedMissing ? new Date().toISOString().split('T')[0] : e.markedMissingDate,
      markedMissingBy: returnData?.reportedMissing ? 'Student Report' : e.markedMissingBy,
      qualityCondition: returnData?.conditionAfter || e.qualityCondition,
      lastConditionUpdate: new Date().toISOString().split('T')[0],
      conditionNotes: returnData?.conditionNotes || e.conditionNotes,
    } : e));
  };

  return (
    <BrowserRouter>
      {databaseError && (
        <div role="alert" className="fixed bottom-4 left-4 right-4 z-[10000] mx-auto max-w-2xl rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
          Database synchronization issue: {databaseError}. Changes are not confirmed in MySQL.
        </div>
      )}
      {/* Inactivity Warning Modal */}
      {inactivityWarning && currentUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center border-2 border-orange-400">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <span className="text-3xl">⏰</span>
            </div>
            <h2 className="text-xl text-gray-900 mb-2">Session Expiring Soon</h2>
            <p className="text-gray-600 text-sm mb-4">
              You have been inactive. Your session will automatically end in:
            </p>
            <div className="text-5xl text-orange-600 mb-6" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {warningCountdown}s
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { startInactivityTimer(); setInactivityWarning(false); }}
                className="flex-1 py-3 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow-md"
              >
                Stay Logged In
              </button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={currentUser ? (
            <Navigate to={currentUser.role === 'student' ? '/student' : currentUser.role === 'staff' ? '/staff' : '/admin'} replace />
          ) : (
            <LoginPage onLogin={handleLogin} users={users} />
          )}
        />
        <Route path="/register" element={<RegisterPage onRegister={handleRegister} users={users} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage users={users} onUpdateUser={handleUpdateUser} />} />
        <Route
          path="/student"
          element={currentUser?.role === 'student' ? (
            <StudentDashboard
              user={currentUser} equipment={equipment} requests={requests}
              onAddRequest={handleAddRequest} onReturnItem={handleReturnItem}
              onPaymentComplete={handlePaymentComplete} onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          ) : <Navigate to="/" replace />}
        />
        <Route
          path="/staff"
          element={currentUser?.role === 'staff' ? (
            <StaffDashboard
              user={currentUser} equipment={equipment} requests={requests}
              onUpdateEquipment={handleUpdateEquipment} onUpdateRequests={handleUpdateRequests}
              onConfirmPenaltyPayment={handleConfirmPenaltyPayment}
              onLogout={handleLogout} onUpdateUser={handleUpdateUser}
              staffName={currentUser.name}
            />
          ) : <Navigate to="/" replace />}
        />
        <Route
          path="/admin"
          element={currentUser?.role === 'admin' ? (
            <AdminDashboard
              user={currentUser} equipment={equipment} requests={requests} users={users}
              equipmentAuditLogs={equipmentAuditLogs}
              onUpdateEquipment={handleUpdateEquipment} onUpdateRequests={handleUpdateRequests}
              onRemoveEquipment={handleRemoveEquipment}
              onConfirmPenaltyPayment={handleConfirmPenaltyPayment}
              onUpdateUsers={(u) => setUsers(u)} onLogout={handleLogout} onUpdateUser={handleUpdateUser}
            />
          ) : <Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
