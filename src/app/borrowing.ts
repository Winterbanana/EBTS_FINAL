import { BorrowRequest } from './types';

export const MAX_ACTIVE_BORROW_LIMIT = 3;

export function getStudentActiveBorrowCount(studentId: string, requests: BorrowRequest[] = []): number {
  return requests.filter((request) => request.studentId === studentId && request.status === 'Approved').length;
}

export function getBorrowingLimitMessage(): string {
  return 'Borrowing limit reached. Each student may borrow a maximum of 3 items at a time. Please return an item before borrowing another.';
}

export function getStudentBorrowingSummary(studentId: string, requests: BorrowRequest[] = []) {
  const count = getStudentActiveBorrowCount(studentId, requests);
  return {
    count,
    limit: MAX_ACTIVE_BORROW_LIMIT,
    reachedLimit: count >= MAX_ACTIVE_BORROW_LIMIT,
    remaining: Math.max(0, MAX_ACTIVE_BORROW_LIMIT - count),
  };
}

export function canStudentBorrowMore(studentId: string, requests: BorrowRequest[] = []): boolean {
  return getStudentActiveBorrowCount(studentId, requests) < MAX_ACTIVE_BORROW_LIMIT;
}
