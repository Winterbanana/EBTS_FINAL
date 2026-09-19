export interface User {
  id: string;
  password: string;
  role: 'student' | 'admin' | 'staff';
  name: string;
  email?: string; // School email address for password recovery
  course?: string;
  section?: string;
  contact?: string;
  photoUrl?: string; // Base64 data URL of uploaded profile photo
  canBorrow?: boolean; // Student can borrow items (false if they have unreturned/unpaid missing items)
  missingItemDebt?: number; // Amount owed for missing items (₱200 per item)
}

export interface Equipment {
  id: string;
  name: string;
  category: 'Screwdriver Set' | 'LAN Cable Set' | 'Cable Pliers' | 'Wires' | 'RJ45' | 'LAN Cables' | 'Cooking Tool Set' | 'Projectors' | 'HDMI Cables' | 'First Aid Kits';
  qrcode: string;
  photoUrl?: string; // Photo of the equipment item
  totalStock: number; // Total quantity available (max 5)
  availableStock: number; // Currently available for borrowing
  borrowedStock: number; // Currently borrowed
  status: 'Available' | 'Borrowed' | 'Missing';
  borrowedBy?: string;
  borrowDate?: string;
  dueDate?: string;
  qualityCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  lastConditionUpdate?: string;
  conditionNotes?: string;
  lastBorrowedBy?: string; // Track last student who borrowed (for missing items)
  markedMissingDate?: string;
  markedMissingBy?: string; // Admin who marked it missing
}

export interface BorrowRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentCourse: string;
  studentContact: string;
  equipmentId: string;
  equipmentName: string;
  equipmentQRCode: string;
  requestDate: string;
  dueDate: string;
  borrowTime?: string; // Time equipment was borrowed (HH:MM format)
  dueTime?: string; // Due time (8 hours after borrow time)
  returnTime?: string; // Time equipment was returned
  hoursBorrowed?: number; // Total hours borrowed
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Missing';
  approvedBy?: string;
  approvedDate?: string;
  returnDate?: string;
  penalty?: number;
  penaltyPaid?: boolean; // Whether penalty has been paid
  penaltyPaymentMethod?: string; // GCash, Maya, or Cash Payment Form Downloaded
  penaltyPaymentDate?: string; // Date when penalty was paid
  conditionBefore?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  conditionAfter?: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  conditionNotes?: string;
  overdueHours?: number; // Hours overdue beyond 8-hour limit
  returnPhotoUrl?: string; // URL to uploaded return photo
  reportedMissing?: boolean; // Student reported item as missing
  missingNotes?: string; // Notes about missing item
  missingItemPaid?: boolean; // Student paid ₱200 for missing item
  missingItemReturned?: boolean; // Student returned the missing item
  missingItemPaymentDate?: string; // Date when payment was made
  missingItemReturnDate?: string; // Date when missing item was returned
}