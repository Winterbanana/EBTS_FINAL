import { useState, useEffect } from 'react';
import { User, Shield, AlertCircle, UserPlus, Eye, EyeOff, Lock, Clock } from 'lucide-react';
import { User as UserType } from '../types';
import { useNavigate } from 'react-router';
import wccLogo from '../../imports/image.png';

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  users: UserType[];
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getLockoutState(userId: string): { attempts: number; lockedUntil: number } {
  try {
    const raw = localStorage.getItem(`lockout_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempts: 0, lockedUntil: 0 };
}

function setLockoutState(userId: string, state: { attempts: number; lockedUntil: number }) {
  localStorage.setItem(`lockout_${userId}`, JSON.stringify(state));
}

function clearLockoutState(userId: string) {
  localStorage.removeItem(`lockout_${userId}`);
}

export function LoginPage({ onLogin, users }: LoginPageProps) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin' | 'staff'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          setError('');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check lockout state
    const lockState = getLockoutState(userId);
    const now = Date.now();

    if (lockState.lockedUntil > now) {
      const secs = Math.ceil((lockState.lockedUntil - now) / 1000);
      setLockoutSeconds(secs);
      setError(`Account locked. Too many failed attempts.`);
      return;
    }

    // If lockout expired, reset
    if (lockState.lockedUntil > 0 && lockState.lockedUntil <= now) {
      clearLockoutState(userId);
    }

    setLoading(true);

    setTimeout(() => {
      const user = users.find(
        (u) => u.id === userId && u.password === password && u.role === selectedRole
      );

      if (user) {
        clearLockoutState(userId);
        setAttemptsLeft(null);
        onLogin(user);
      } else {
        // Failed attempt
        const current = getLockoutState(userId);
        const newAttempts = current.attempts + 1;
        const remaining = MAX_ATTEMPTS - newAttempts;

        if (newAttempts >= MAX_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
          setLockoutState(userId, { attempts: newAttempts, lockedUntil });
          const secs = Math.ceil(LOCKOUT_DURATION_MS / 1000);
          setLockoutSeconds(secs);
          setAttemptsLeft(0);
          setError(`Account locked for 15 minutes after ${MAX_ATTEMPTS} failed attempts.`);
        } else {
          setLockoutState(userId, { attempts: newAttempts, lockedUntil: 0 });
          setAttemptsLeft(remaining);
          setError(
            `Invalid credentials for ${selectedRole} account.`
          );
        }
      }
      setLoading(false);
    }, 500);
  };

  const isLocked = lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-4 shadow-lg p-2">
            <img src={wccLogo} alt="WCC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-black mb-2">
            Equipment Borrowing and Tracking Return System
          </h1>
          <p className="text-blue-900">WCC - Tracking &amp; Return Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl text-center mb-6 text-gray-800">Sign In to Your Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block mb-2 text-sm text-gray-700">Login As</label>
              <div className="grid grid-cols-3 gap-3">
                {(['student', 'staff', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setSelectedRole(role); setError(''); setAttemptsLeft(null); }}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      selectedRole === role
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-blue-300 bg-white text-blue-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="capitalize">{role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ID Field */}
            <div>
              <label htmlFor="userId" className="block mb-2 text-sm text-gray-700">
                {selectedRole === 'student' ? 'Student ID' : selectedRole === 'admin' ? 'Admin ID' : 'Staff ID'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setError(''); setAttemptsLeft(null); }}
                  placeholder={
                    selectedRole === 'student' ? '2024-07-001234'
                    : selectedRole === 'admin' ? 'ADM2024'
                    : '2024-07-00123'
                  }
                  className="w-full pl-11 pr-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-blue-50 disabled:opacity-60"
                  required
                  disabled={isLocked}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); setAttemptsLeft(null); }}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-blue-50 disabled:opacity-60"
                  required
                  disabled={isLocked}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Lockout Message */}
            {isLocked && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
                <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-semibold mb-1">Account Temporarily Locked</p>
                  <p className="text-red-700 text-xs mb-2">
                    {MAX_ATTEMPTS} consecutive failed login attempts detected. For security, this account is locked.
                  </p>
                  <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 text-sm font-mono font-bold">{formatCountdown(lockoutSeconds)}</span>
                    <span className="text-red-700 text-xs">remaining</span>
                  </div>
                  <p className="text-red-600 text-xs mt-2">
                    If you believe this is an error, contact the administrator.
                  </p>
                </div>
              </div>
            )}

            {!isLocked && error && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                {attemptsLeft !== null && attemptsLeft > 0 && (
                  <p className="text-xs text-orange-600 pl-1">
                    ⚠ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before account lockout.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : isLocked ? 'Account Locked' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline"
            >
              <UserPlus className="w-4 h-4" />
              Create New Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-blue-900">
          <p>© 2026 Equipment Borrowing and Tracking Return System</p>
          <p className="text-xs text-blue-700 mt-1">Version 2.2.0 - WCC Stock Management System</p>
        </div>
      </div>
    </div>
  );
}
