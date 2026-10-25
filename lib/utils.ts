export function formatPrice(price: number | null, unit = 'đ'): string {
  if (price === null || price === undefined) return 'Thỏa thuận';
  if (price === 0) return 'Tặng miễn phí';
  return `${Number(price).toLocaleString('vi-VN')}${unit}`;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function initials(name?: string | null): string {
  if (!name) return 'H';
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] ?? 'H').toUpperCase();
}

export function karmaTier(points: number): { label: string; className: string } {
  if (points >= 200) return { label: 'Huyền thoại', className: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (points >= 100) return { label: 'Uy tín cao', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (points >= 30) return { label: 'Đáng tin', className: 'bg-blue-100 text-blue-800 border-blue-300' };
  return { label: 'Thành viên mới', className: 'bg-slate-100 text-slate-700 border-slate-300' };
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return 'Đã có lỗi xảy ra';
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
