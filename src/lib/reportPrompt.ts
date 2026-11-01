import type { ReportCategory } from '../services/reportService';

const CATEGORIES: ReportCategory[] = ['harassment', 'spam', 'personal_info', 'other'];

export interface ReportDetails {
  category: ReportCategory;
  reason: string;
}

export const promptForReportDetails = (): ReportDetails | null => {
  const category = window.prompt(
    'เลือกหมวดหมู่: harassment, spam, personal_info หรือ other',
    'other',
  );
  if (category === null) return null;
  if (!CATEGORIES.includes(category as ReportCategory)) {
    throw new Error('หมวดหมู่ไม่ถูกต้อง กรุณาเลือก harassment, spam, personal_info หรือ other');
  }

  const reason = window.prompt('อธิบายเหตุผลในการรายงาน (ไม่เกิน 1,000 ตัวอักษร)');
  if (reason === null) return null;
  if (!reason.trim() || reason.trim().length > 1000) {
    throw new Error('กรุณาระบุเหตุผล 1–1,000 ตัวอักษร');
  }

  return { category: category as ReportCategory, reason: reason.trim() };
};
