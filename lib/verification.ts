import 'server-only';
import { getAdminSupabase } from './supabase/server';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function telegram(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json().catch(() => null);
}

/** Duyệt / từ chối MSSV (dùng chung cho Telegram webhook và trang Admin). */
export async function setVerification(userId: string, approve: boolean) {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from('profiles')
    .update({ is_verified: approve, verification_status: approve ? 'approved' : 'rejected' })
    .eq('id', userId)
    .select('full_name, mssv')
    .single();
  if (error) throw new Error(error.message);
  return data as { full_name: string; mssv: string | null };
}
