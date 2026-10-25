import type { ListingType } from './types';

export const SLOGAN = 'Việc khó có chợ sinh viên lo';

export const FACULTIES = [
  'Công nghệ Thông tin',
  'Công nghệ Thực phẩm',
  'Công nghệ Hóa học',
  'Công nghệ Sinh học',
  'Cơ khí',
  'Điện – Điện tử',
  'Quản trị Kinh doanh',
  'Tài chính – Kế toán',
  'Du lịch & Ẩm thực',
  'Môi trường & Tài nguyên',
  'May – Thời trang',
  'Ngoại ngữ',
  'Luật',
  'Khác',
];

export const CATEGORIES: Record<ListingType, { value: string; emoji: string }[]> = {
  goods: [
    { value: 'Giáo trình & Sách', emoji: '📚' },
    { value: 'Áo blouse & Đồng phục', emoji: '🥼' },
    { value: 'Đồ điện tử', emoji: '💻' },
    { value: 'Đồ dùng phòng trọ', emoji: '🛏️' },
    { value: 'Dụng cụ học tập', emoji: '📐' },
    { value: 'Thời trang', emoji: '👕' },
    { value: 'Khác', emoji: '📦' },
  ],
  gigs: [
    { value: 'Mượn đồ', emoji: '🤝' },
    { value: 'Chuyển trọ / Khiêng đồ', emoji: '🚚' },
    { value: 'Gia sư / Kèm bài', emoji: '🧑‍🏫' },
    { value: 'Mua hộ / Ship hộ', emoji: '🛵' },
    { value: 'Thiết kế / IT', emoji: '🖥️' },
    { value: 'Xếp hàng / Giữ chỗ', emoji: '⏳' },
    { value: 'Khác', emoji: '✨' },
  ],
};

export const SAFE_ZONES = [
  'Sảnh Thư viện HUIT (140 Lê Trọng Tấn)',
  'Căng-tin / Sân trường',
  'Ký túc xá HUIT',
  'Khu trọ Tây Thạnh',
];

export const CONDITIONS = ['Mới 100%', 'Mới 99%', 'Đã qua sử dụng', 'Cũ nhưng dùng tốt'];

export const KARMA_RULES = {
  handshake: 10,
  review: { 5: 5, 4: 3, 3: 0, 2: -2, 1: -5 } as Record<number, number>,
};

export function categoryEmoji(type: ListingType, category: string): string {
  return CATEGORIES[type].find((c) => c.value === category)?.emoji ?? '📦';
}

export const ALLOWED_EMAIL_DOMAIN = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? '').trim();
