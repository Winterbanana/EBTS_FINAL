import React, { useState } from 'react';
import {
  Database, Search, Download, Users, Package, FileText,
  AlertTriangle, Eye, EyeOff, Shield
} from 'lucide-react';
import { Equipment, BorrowRequest, EquipmentAuditLog, User } from '../types';

interface DatabasePageProps {
  equipment: Equipment[];
  requests: BorrowRequest[];
  users: User[];
  equipmentAuditLogs: EquipmentAuditLog[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
  onUpdateRequests: (requests: BorrowRequest[]) => void;
  onUpdateUsers: (users: User[]) => void;
}

type SectionId =
  | 'user-data'
  | 'student-credentials'
  | 'admin-credentials'
  | 'staff-credentials'
  | 'equipment-data'
  | 'transactions'
  | 'transaction-logs'
  | 'penalty-records';

interface Section {
  id: SectionId;
  label: string;
  icon: typeof Database;
  color: string;
  headerColor: string;
}

type PenaltyViewRecord = BorrowRequest & {
  recordType: 'Overdue Return' | 'Missing Item';
  recordAmount: number;
  recordPaid: boolean;
  recordMethod?: string;
  recordPaymentDate?: string;
  recordReturnDate?: string;
};

const SECTIONS: Section[] = [
  { id: 'user-data', label: 'Store User Data', icon: Users, color: 'text-blue-600', headerColor: 'bg-blue-700' },
  { id: 'student-credentials', label: 'Student Credentials', icon: Users, color: 'text-green-600', headerColor: 'bg-green-700' },
  { id: 'admin-credentials', label: 'Admin Credentials', icon: Shield, color: 'text-purple-600', headerColor: 'bg-purple-700' },
  { id: 'staff-credentials', label: 'Staff Credentials', icon: Shield, color: 'text-orange-600', headerColor: 'bg-orange-700' },
  { id: 'equipment-data', label: 'Store Equipment Data', icon: Package, color: 'text-cyan-600', headerColor: 'bg-cyan-700' },
  { id: 'transactions', label: 'Store Transactions', icon: FileText, color: 'text-yellow-600', headerColor: 'bg-yellow-700' },
  { id: 'transaction-logs', label: 'Maintain Transaction Logs', icon: Database, color: 'text-gray-600', headerColor: 'bg-gray-700' },
  { id: 'penalty-records', label: 'Store Penalty Records', icon: AlertTriangle, color: 'text-red-600', headerColor: 'bg-red-700' },
];

function esc(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${str}'`;
}

export function DatabasePage({ equipment, requests, users, equipmentAuditLogs, onUpdateEquipment, onUpdateRequests, onUpdateUsers }: DatabasePageProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('user-data');
  const [search, setSearch] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const students = users.filter(u => u.role === 'student');
  const admins = users.filter(u => u.role === 'admin');
  const staff = users.filter(u => u.role === 'staff');

  const penalties = requests.flatMap((request): PenaltyViewRecord[] => {
    const records: PenaltyViewRecord[] = [];
    if ((request.penalty || 0) > 0) records.push({
      ...request,
      recordType: 'Overdue Return',
      recordAmount: request.penalty || 0,
      recordPaid: !!request.penaltyPaid,
      recordMethod: request.penaltyPaymentMethod,
      recordPaymentDate: request.penaltyPaymentDate,
      recordReturnDate: request.returnDate,
    });
    if (request.reportedMissing && !request.missingItemReturned) records.push({
      ...request,
      recordType: 'Missing Item',
      recordAmount: 200,
      recordPaid: !!request.missingItemPaid,
      recordMethod: request.missingItemPaid ? 'Staff verified' : undefined,
      recordPaymentDate: request.missingItemPaymentDate,
      recordReturnDate: request.missingItemReturnDate || request.returnDate,
    });
    return records;
  });

  const requestLogs = requests.flatMap(r => {
    const logs = [];
    if (r.requestDate) logs.push({ reqId: r.id, event: 'Request Submitted', actor: r.studentName, date: r.requestDate, detail: `Equipment: ${r.equipmentName}` });
    if (r.status === 'Approved' && r.approvedDate) logs.push({ reqId: r.id, event: 'Request Approved', actor: r.approvedBy || 'Admin', date: r.approvedDate, detail: `Approved for ${r.studentName}` });
    if (r.status === 'Rejected' && r.approvedDate) logs.push({ reqId: r.id, event: 'Request Rejected', actor: r.approvedBy || 'Admin', date: r.approvedDate, detail: `Rejected for ${r.studentName}` });
    if ((r.status === 'Returned' || r.status === 'Missing') && r.returnDate) logs.push({ reqId: r.id, event: r.status === 'Missing' ? 'Reported Missing' : r.missingItemReturned ? 'Missing Item Returned' : 'Item Returned', actor: r.missingItemResolvedBy || r.approvedBy || r.studentName, date: r.missingItemReturnDate || r.returnDate, detail: r.conditionAfter ? `Condition: ${r.conditionAfter}` : '' });
    if (r.missingItemPaid && r.missingItemPaymentDate) logs.push({ reqId: r.id, event: 'Missing Item Fee Paid', actor: r.missingItemResolvedBy || 'Admin', date: r.missingItemPaymentDate, detail: '₱200 replacement fee' });
    if (r.penaltyPaid && r.penaltyPaymentDate) logs.push({ reqId: r.id, event: 'Penalty Paid', actor: r.studentName, date: r.penaltyPaymentDate, detail: `₱${r.penalty} via ${r.penaltyPaymentMethod}` });
    return logs;
  });
  const transactionLogs = [
    ...requestLogs,
    ...equipmentAuditLogs.map(log => ({
      reqId: log.equipmentId,
      event: log.event,
      actor: log.actor,
      date: log.date,
      detail: log.detail,
    })),
  ];

  const filterStr = search.toLowerCase();

  const filteredUsers = users.filter(u =>
    u.id.toLowerCase().includes(filterStr) ||
    u.name.toLowerCase().includes(filterStr) ||
    u.role.includes(filterStr) ||
    (u.email || '').toLowerCase().includes(filterStr)
  );
  const filteredStudents = students.filter(u => u.id.toLowerCase().includes(filterStr) || u.name.toLowerCase().includes(filterStr));
  const filteredAdmins = admins.filter(u => u.id.toLowerCase().includes(filterStr) || u.name.toLowerCase().includes(filterStr));
  const filteredStaff = staff.filter(u => u.id.toLowerCase().includes(filterStr) || u.name.toLowerCase().includes(filterStr));
  const filteredEquipment = equipment.filter(e =>
    e.id.toLowerCase().includes(filterStr) || e.name.toLowerCase().includes(filterStr) || e.category.toLowerCase().includes(filterStr)
  );
  const filteredRequests = requests.filter(r =>
    r.id.toLowerCase().includes(filterStr) || r.studentName.toLowerCase().includes(filterStr) || r.equipmentName.toLowerCase().includes(filterStr)
  );
  const filteredLogs = transactionLogs.filter(l =>
    l.reqId.toLowerCase().includes(filterStr) || l.event.toLowerCase().includes(filterStr) || l.actor.toLowerCase().includes(filterStr)
  );
  const filteredPenalties = penalties.filter(r =>
    r.id.toLowerCase().includes(filterStr) || r.studentName.toLowerCase().includes(filterStr) || r.equipmentName.toLowerCase().includes(filterStr)
  );

  // ── SQL Export ────────────────────────────────────────────────────────────
  const exportSQL = () => {
    const lines: string[] = [];
    const ts = new Date().toLocaleString();

    lines.push(`-- WCC Equipment Borrowing and Tracking Return System`);
    lines.push(`-- SQL Export generated: ${ts}`);
    lines.push(`-- Import via phpMyAdmin or MySQL CLI: mysql -u root -p < export.sql`);
    lines.push('');
    lines.push(`CREATE DATABASE IF NOT EXISTS \`wcc_equipment_system\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    lines.push(`USE \`wcc_equipment_system\`;`);
    lines.push('');

    // Users table
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`-- Table: wcc_users`);
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS \`wcc_users\` (`);
    lines.push(`  \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,`);
    lines.push(`  \`password\` VARCHAR(255) NOT NULL,`);
    lines.push(`  \`role\` ENUM('student','admin','staff') NOT NULL,`);
    lines.push(`  \`name\` VARCHAR(150) NOT NULL,`);
    lines.push(`  \`email\` VARCHAR(150) DEFAULT NULL,`);
    lines.push(`  \`course\` VARCHAR(50) DEFAULT NULL,`);
    lines.push(`  \`section\` VARCHAR(20) DEFAULT NULL,`);
    lines.push(`  \`contact\` VARCHAR(30) DEFAULT NULL,`);
    lines.push(`  \`can_borrow\` TINYINT(1) DEFAULT 1,`);
    lines.push(`  \`missing_item_debt\` DECIMAL(10,2) DEFAULT 0.00,`);
    lines.push(`  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    lines.push('');
    for (const u of users) {
      lines.push(`INSERT IGNORE INTO \`wcc_users\` (\`id\`, \`password\`, \`role\`, \`name\`, \`email\`, \`course\`, \`section\`, \`contact\`, \`can_borrow\`, \`missing_item_debt\`) VALUES (`);
      lines.push(`  ${esc(u.id)}, ${esc(u.password)}, ${esc(u.role)}, ${esc(u.name)}, ${esc(u.email)}, ${esc(u.course)}, ${esc(u.section)}, ${esc(u.contact)}, ${u.canBorrow === false ? 0 : 1}, ${u.missingItemDebt || 0}`);
      lines.push(`);`);
    }
    lines.push('');

    // Equipment table
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`-- Table: wcc_equipment`);
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS \`wcc_equipment\` (`);
    lines.push(`  \`id\` VARCHAR(20) NOT NULL PRIMARY KEY,`);
    lines.push(`  \`name\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`brand\` VARCHAR(100) NOT NULL DEFAULT 'WCC',`);
    lines.push(`  \`category\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`program\` VARCHAR(120) NOT NULL DEFAULT '',`);
    lines.push(`  \`qrcode\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`photo_url\` VARCHAR(255) DEFAULT NULL,`);
    lines.push(`  \`total_stock\` INT DEFAULT 1,`);
    lines.push(`  \`available_stock\` INT DEFAULT 1,`);
    lines.push(`  \`borrowed_stock\` INT DEFAULT 0,`);
    lines.push(`  \`status\` ENUM('Available','Borrowed','Missing') DEFAULT 'Available',`);
    lines.push(`  \`borrowed_by\` VARCHAR(200) DEFAULT NULL,`);
    lines.push(`  \`borrow_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`due_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`quality_condition\` ENUM('Excellent','Good','Fair','Poor','Damaged') DEFAULT 'Excellent',`);
    lines.push(`  \`last_condition_update\` DATE DEFAULT NULL,`);
    lines.push(`  \`condition_notes\` TEXT DEFAULT NULL,`);
    lines.push(`  \`last_borrowed_by\` VARCHAR(200) DEFAULT NULL`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    lines.push('');
    for (const e of equipment) {
      lines.push(`INSERT IGNORE INTO \`wcc_equipment\` (\`id\`,\`name\`,\`brand\`,\`category\`,\`program\`,\`qrcode\`,\`photo_url\`,\`total_stock\`,\`available_stock\`,\`borrowed_stock\`,\`status\`,\`borrowed_by\`,\`borrow_date\`,\`due_date\`,\`quality_condition\`,\`last_condition_update\`,\`condition_notes\`,\`last_borrowed_by\`) VALUES (`);
      lines.push(`  ${esc(e.id)},${esc(e.name)},${esc(e.brand || 'WCC')},${esc(e.category)},${esc(e.program || '')},${esc(e.qrcode)},${esc(e.photoUrl)},${e.totalStock},${e.availableStock},${e.borrowedStock},${esc(e.status)},${esc(e.borrowedBy)},${esc(e.borrowDate)},${esc(e.dueDate)},${esc(e.qualityCondition)},${esc(e.lastConditionUpdate)},${esc(e.conditionNotes)},${esc(e.lastBorrowedBy)}`);
      lines.push(`);`);
    }
    lines.push('');

    // Transactions table
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`-- Table: wcc_transactions`);
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS \`wcc_transactions\` (`);
    lines.push(`  \`id\` VARCHAR(20) NOT NULL PRIMARY KEY,`);
    lines.push(`  \`student_id\` VARCHAR(50) NOT NULL,`);
    lines.push(`  \`student_name\` VARCHAR(150) NOT NULL,`);
    lines.push(`  \`student_course\` VARCHAR(50) DEFAULT NULL,`);
    lines.push(`  \`student_contact\` VARCHAR(30) DEFAULT NULL,`);
    lines.push(`  \`equipment_id\` VARCHAR(20) NOT NULL,`);
    lines.push(`  \`equipment_name\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`equipment_brand\` VARCHAR(100) DEFAULT NULL,`);
    lines.push(`  \`equipment_program\` VARCHAR(120) DEFAULT NULL,`);
    lines.push(`  \`request_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`due_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`borrow_time\` VARCHAR(10) DEFAULT NULL,`);
    lines.push(`  \`due_time\` VARCHAR(10) DEFAULT NULL,`);
    lines.push(`  \`return_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`return_time\` VARCHAR(10) DEFAULT NULL,`);
    lines.push(`  \`status\` ENUM('Pending','Approved','Rejected','Returned','Missing') DEFAULT 'Pending',`);
    lines.push(`  \`approved_by\` VARCHAR(100) DEFAULT NULL,`);
    lines.push(`  \`approved_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`condition_before\` VARCHAR(20) DEFAULT NULL,`);
    lines.push(`  \`condition_after\` VARCHAR(20) DEFAULT NULL,`);
    lines.push(`  \`condition_notes\` TEXT DEFAULT NULL,`);
    lines.push(`  \`resolution_status\` VARCHAR(20) DEFAULT NULL,`);
    lines.push(`  \`metadata_json\` LONGTEXT DEFAULT NULL`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    lines.push('');
    for (const r of requests) {
      lines.push(`INSERT IGNORE INTO \`wcc_transactions\` (\`id\`,\`student_id\`,\`student_name\`,\`student_course\`,\`student_contact\`,\`equipment_id\`,\`equipment_name\`,\`request_date\`,\`due_date\`,\`borrow_time\`,\`due_time\`,\`return_date\`,\`return_time\`,\`status\`,\`approved_by\`,\`approved_date\`,\`condition_before\`,\`condition_after\`,\`condition_notes\`,\`resolution_status\`,\`metadata_json\`) VALUES (`);
      lines.push(`  ${esc(r.id)},${esc(r.studentId)},${esc(r.studentName)},${esc(r.studentCourse)},${esc(r.studentContact)},${esc(r.equipmentId)},${esc(r.equipmentName)},${esc(r.requestDate)},${esc(r.dueDate)},${esc(r.borrowTime)},${esc(r.dueTime)},${esc(r.returnDate)},${esc(r.returnTime)},${esc(r.status)},${esc(r.approvedBy)},${esc(r.approvedDate)},${esc(r.conditionBefore)},${esc(r.conditionAfter)},${esc(r.conditionNotes)},${esc(r.missingItemReturned ? 'Returned' : r.missingItemPaid ? 'Paid' : null)},${esc(JSON.stringify(r))}`);
      lines.push(`);`);
    }
    lines.push('');

    // Transaction logs table
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`-- Table: wcc_transaction_logs`);
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS \`wcc_transaction_logs\` (`);
    lines.push(`  \`log_id\` INT AUTO_INCREMENT PRIMARY KEY,`);
    lines.push(`  \`transaction_id\` VARCHAR(20) NOT NULL,`);
    lines.push(`  \`event\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`actor\` VARCHAR(150) NOT NULL,`);
    lines.push(`  \`event_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`detail\` TEXT DEFAULT NULL,`);
    lines.push(`  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    lines.push('');
    for (const log of transactionLogs) {
      lines.push(`INSERT INTO \`wcc_transaction_logs\` (\`transaction_id\`,\`event\`,\`actor\`,\`event_date\`,\`detail\`) VALUES (${esc(log.reqId)},${esc(log.event)},${esc(log.actor)},${esc(log.date)},${esc(log.detail)});`);
    }
    lines.push('');

    // Penalty records table
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`-- Table: wcc_penalty_records`);
    lines.push(`-- --------------------------------------------------------`);
    lines.push(`CREATE TABLE IF NOT EXISTS \`wcc_penalty_records\` (`);
    lines.push(`  \`id\` INT AUTO_INCREMENT PRIMARY KEY,`);
    lines.push(`  \`transaction_id\` VARCHAR(20) NOT NULL,`);
    lines.push(`  \`student_id\` VARCHAR(50) NOT NULL,`);
    lines.push(`  \`student_name\` VARCHAR(150) NOT NULL,`);
    lines.push(`  \`equipment_name\` VARCHAR(100) NOT NULL,`);
    lines.push(`  \`penalty_type\` VARCHAR(50) NOT NULL,`);
    lines.push(`  \`amount\` DECIMAL(10,2) NOT NULL DEFAULT 0.00,`);
    lines.push(`  \`overdue_hours\` INT DEFAULT 0,`);
    lines.push(`  \`overdue_days\` INT DEFAULT 0,`);
    lines.push(`  \`penalty_paid\` TINYINT(1) DEFAULT 0,`);
    lines.push(`  \`payment_method\` VARCHAR(50) DEFAULT NULL,`);
    lines.push(`  \`payment_date\` DATE DEFAULT NULL,`);
    lines.push(`  \`return_date\` DATE DEFAULT NULL`);
    lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
    lines.push('');
    for (const r of penalties) {
      lines.push(`INSERT INTO \`wcc_penalty_records\` (\`transaction_id\`,\`student_id\`,\`student_name\`,\`equipment_name\`,\`penalty_type\`,\`amount\`,\`overdue_hours\`,\`overdue_days\`,\`penalty_paid\`,\`payment_method\`,\`payment_date\`,\`return_date\`) VALUES (`);
      lines.push(`  ${esc(r.id)},${esc(r.studentId)},${esc(r.studentName)},${esc(r.equipmentName)},${esc(r.recordType)},${r.recordAmount},${r.recordType === 'Overdue Return' ? r.overdueHours || 0 : 0},${r.recordType === 'Overdue Return' ? r.overdueDays || 0 : 0},${r.recordPaid ? 1 : 0},${esc(r.recordMethod)},${esc(r.recordPaymentDate)},${esc(r.recordReturnDate)}`);
      lines.push(`);`);
    }
    lines.push('');
    lines.push(`-- End of WCC Equipment System SQL Export`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wcc_equipment_system_${Date.now()}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = (data: string[][], filename: string) => {
    const csv = data.map(row => row.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Available: 'bg-green-100 text-green-700',
      Borrowed: 'bg-blue-100 text-blue-700',
      Missing: 'bg-red-100 text-red-700',
      Approved: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Rejected: 'bg-red-100 text-red-700',
      Returned: 'bg-gray-100 text-gray-700',
      student: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
      staff: 'bg-orange-100 text-orange-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${map[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>
    );
  };

  const currentSection = SECTIONS.find(s => s.id === activeSection)!;
  const Icon = currentSection.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-900" />
          <h2 className="text-2xl text-gray-900">Database Management</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportSQL}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow text-sm"
          >
            <Download className="w-4 h-4" />
            Export SQL (XAMPP)
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SECTIONS.map(sec => {
          const SIcon = sec.icon;
          const active = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-left transition-all text-sm ${
                active
                  ? `border-blue-900 bg-blue-900 text-white shadow-md`
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <SIcon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : sec.color}`} />
              <span className="leading-tight">{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section header */}
        <div className={`${currentSection.headerColor} text-white px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <h3 className="text-base">{currentSection.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            {(activeSection === 'student-credentials' || activeSection === 'admin-credentials' || activeSection === 'staff-credentials' || activeSection === 'user-data') && (
              <button
                onClick={() => setShowPasswords(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
              </button>
            )}
            <button
              onClick={() => {
                if (activeSection === 'user-data') exportCSV([['ID','Role','Name','Email','Course','Section','Contact'],...filteredUsers.map(u=>[u.id,u.role,u.name,u.email||'',u.course||'',u.section||'',u.contact||''])],'users.csv');
                else if (activeSection === 'student-credentials') exportCSV([['ID','Name','Email','Course','Section','Contact'],...filteredStudents.map(u=>[u.id,u.name,u.email||'',u.course||'',u.section||'',u.contact||''])],'students.csv');
                else if (activeSection === 'admin-credentials') exportCSV([['ID','Name','Email'],...filteredAdmins.map(u=>[u.id,u.name,u.email||''])],'admins.csv');
                else if (activeSection === 'staff-credentials') exportCSV([['ID','Name','Email'],...filteredStaff.map(u=>[u.id,u.name,u.email||''])],'staff.csv');
                else if (activeSection === 'equipment-data') exportCSV([['ID','Name','Category','Status','Total','Available','Borrowed','Condition'],...filteredEquipment.map(e=>[e.id,e.name,e.category,e.status,String(e.totalStock),String(e.availableStock),String(e.borrowedStock),e.qualityCondition])],'equipment.csv');
                else if (activeSection === 'transactions') exportCSV([['ID','Student','Equipment','Date','Due','Status','Approved By'],...filteredRequests.map(r=>[r.id,r.studentName,r.equipmentName,r.requestDate,r.dueDate,r.status,r.approvedBy||''])],'transactions.csv');
                else if (activeSection === 'transaction-logs') exportCSV([['Transaction ID','Event','Actor','Date','Detail'],...filteredLogs.map(l=>[l.reqId,l.event,l.actor,l.date,l.detail])],'transaction-logs.csv');
                else if (activeSection === 'penalty-records') exportCSV([['Transaction ID','Student','Equipment','Type','Amount','Overdue Days','Resolution','Method','Resolution Date'],...filteredPenalties.map(r=>[r.id,r.studentName,r.equipmentName,r.recordType,String(r.recordAmount),String(r.overdueDays||0),r.recordPaid?'Paid':'Unpaid',r.recordMethod||'',r.recordPaymentDate||''])],'penalties.csv');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search this section..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          {/* ── 1. Store User Data ── */}
          {activeSection === 'user-data' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User ID','Role','Full Name','Email','Course','Section','Contact'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{u.id}</td>
                    <td className="py-3 px-4">{statusBadge(u.role)}</td>
                    <td className="py-3 px-4 text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.course || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.section || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.contact || '—'}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">No users found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 2. Student Credentials ── */}
          {activeSection === 'student-credentials' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Student ID','Full Name','Password','Email','Course','Section','Contact'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{u.id}</td>
                    <td className="py-3 px-4 text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {showPasswords ? u.password : '••••••••'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.course || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.section || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{u.contact || '—'}</td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">No students found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 3. Admin Credentials ── */}
          {activeSection === 'admin-credentials' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Admin ID','Full Name','Password','Email'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{u.id}</td>
                    <td className="py-3 px-4 text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {showPasswords ? u.password : '••••••••'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email || '—'}</td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-gray-400">No admins found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 4. Staff Credentials ── */}
          {activeSection === 'staff-credentials' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Staff ID','Full Name','Password','Email'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(u => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{u.id}</td>
                    <td className="py-3 px-4 text-gray-900">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {showPasswords ? u.password : '••••••••'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email || '—'}</td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-gray-400">No staff found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 5. Equipment Data ── */}
          {activeSection === 'equipment-data' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Equipment ID','Name','Category','Status','Total','Available','Borrowed','Condition','Due Date'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map(e => (
                  <React.Fragment key={e.id}>
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === e.id ? null : e.id)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-gray-700">{e.id}</td>
                      <td className="py-3 px-4 text-gray-900">{e.name}</td>
                      <td className="py-3 px-4 text-gray-600">{e.category}</td>
                      <td className="py-3 px-4">{statusBadge(e.status)}</td>
                      <td className="py-3 px-4 text-gray-700">{e.totalStock}</td>
                      <td className="py-3 px-4 text-green-700">{e.availableStock}</td>
                      <td className="py-3 px-4 text-blue-700">{e.borrowedStock}</td>
                      <td className="py-3 px-4">{statusBadge(e.qualityCondition)}</td>
                      <td className="py-3 px-4 text-gray-600">{e.dueDate || '—'}</td>
                    </tr>
                    {expandedRow === e.id && (
                      <tr key={`${e.id}-exp`} className="bg-blue-50">
                        <td colSpan={9} className="px-6 py-3 text-xs text-gray-700 space-y-1">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div><span className="text-gray-500">QR Code:</span> {e.qrcode}</div>
                            <div><span className="text-gray-500">Borrowed By:</span> {e.borrowedBy || '—'}</div>
                            <div><span className="text-gray-500">Last Borrowed By:</span> {e.lastBorrowedBy || '—'}</div>
                            <div><span className="text-gray-500">Condition Updated:</span> {e.lastConditionUpdate || '—'}</div>
                            {e.conditionNotes && <div className="col-span-2"><span className="text-gray-500">Notes:</span> {e.conditionNotes}</div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredEquipment.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-gray-400">No equipment found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 6. Transactions ── */}
          {activeSection === 'transactions' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Request ID','Student','Student ID','Equipment','Request Date','Due Date','Return Date','Status','Approved By'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{r.id}</td>
                    <td className="py-3 px-4 text-gray-900">{r.studentName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{r.studentId}</td>
                    <td className="py-3 px-4 text-gray-700">{r.equipmentName}</td>
                    <td className="py-3 px-4 text-gray-600">{r.requestDate}</td>
                    <td className="py-3 px-4 text-gray-600">{r.dueDate}</td>
                    <td className="py-3 px-4 text-gray-600">{r.returnDate || '—'}</td>
                    <td className="py-3 px-4">{statusBadge(r.missingItemReturned ? 'Returned' : r.missingItemPaid ? 'Paid' : r.status)}</td>
                    <td className="py-3 px-4 text-gray-600">{r.approvedBy || '—'}</td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-gray-400">No transactions found</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 7. Transaction Logs ── */}
          {activeSection === 'transaction-logs' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#','Transaction ID','Event','Actor','Date','Detail'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, i) => (
                  <tr key={`${l.reqId}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{l.reqId}</td>
                    <td className="py-3 px-4 text-gray-900">{l.event}</td>
                    <td className="py-3 px-4 text-gray-700">{l.actor}</td>
                    <td className="py-3 px-4 text-gray-600">{l.date}</td>
                    <td className="py-3 px-4 text-gray-600">{l.detail || '—'}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">No transaction logs</td></tr>}
              </tbody>
            </table>
          )}

          {/* ── 8. Penalty Records ── */}
          {activeSection === 'penalty-records' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Transaction ID','Student','Equipment','Type','Amount','Overdue Days','Resolution','Method','Resolution Date','Return Date'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPenalties.map(r => (
                  <tr key={`${r.id}-${r.recordType}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{r.id}</td>
                    <td className="py-3 px-4 text-gray-900">{r.studentName}</td>
                    <td className="py-3 px-4 text-gray-700">{r.equipmentName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${r.recordType === 'Missing Item' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.recordType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-red-700">₱{r.recordAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-700">{r.recordType === 'Overdue Return' ? r.overdueDays || '—' : '—'}</td>
                    <td className="py-3 px-4">
                      {r.recordPaid
                        ? <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Paid</span>
                        : <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Unpaid</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600">{r.recordMethod || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{r.recordPaymentDate || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{r.recordReturnDate || '—'}</td>
                  </tr>
                ))}
                {filteredPenalties.length === 0 && <tr><td colSpan={10} className="py-10 text-center text-gray-400">No penalty records</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer row count */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          {activeSection === 'user-data' && `${filteredUsers.length} records`}
          {activeSection === 'student-credentials' && `${filteredStudents.length} students`}
          {activeSection === 'admin-credentials' && `${filteredAdmins.length} admins`}
          {activeSection === 'staff-credentials' && `${filteredStaff.length} staff`}
          {activeSection === 'equipment-data' && `${filteredEquipment.length} items`}
          {activeSection === 'transactions' && `${filteredRequests.length} transactions`}
          {activeSection === 'transaction-logs' && `${filteredLogs.length} log entries`}
          {activeSection === 'penalty-records' && `${filteredPenalties.length} penalty records`}
        </div>
      </div>
    </div>
  );
}
