'use client';

import type {
  Listing,
  ListingFilters,
  Message,
  Profile,
  ProfileLite,
  Review,
  Ticket,
} from '../types';
import { KARMA_RULES } from '../constants';
import { compressImage, fileToDataUrl } from '../image-compression';
import type { SomApi } from './types';

/* =====================================================================
 * CHẾ ĐỘ DEMO – toàn bộ dữ liệu nằm trong localStorage của trình duyệt.
 * - Người dùng hiện tại lưu trong sessionStorage → mỗi TAB có thể đăng nhập
 *   một tài khoản khác nhau để test chat 2 chiều & bắt tay.
 * - Đồng bộ "realtime" giữa các tab bằng sự kiện `storage`.
 * ===================================================================== */

const DB_KEY = 'som-demo-db-v1';
const USER_KEY = 'som-demo-user';
const CHANGE_EVENT = 'som-demo-change';
const AUTH_EVENT = 'som-demo-auth';
export const DEMO_PASSWORD = '123456';

interface DemoDb {
  profiles: Profile[];
  passwords: Record<string, { id: string; password: string }>;
  listings: Listing[];
  tickets: Ticket[];
  messages: Message[];
  reviews: Review[];
  cards: Record<string, string>;
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function cardPlaceholder(name: string, mssv: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" rx="24" fill="#0F3D6E"/><rect x="0" y="300" width="640" height="100" fill="#F26522"/><text x="40" y="70" font-family="Arial" font-size="30" font-weight="bold" fill="#fff">THẺ SINH VIÊN HUIT</text><rect x="40" y="110" width="140" height="170" rx="12" fill="#cbd5e1"/><text x="210" y="160" font-family="Arial" font-size="26" fill="#fff">${name}</text><text x="210" y="210" font-family="Arial" font-size="22" fill="#e2e8f0">MSSV: ${mssv}</text><text x="40" y="360" font-family="Arial" font-size="22" fill="#fff">Ảnh minh hoạ (demo)</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seed(): DemoDb {
  const p = (o: Partial<Profile> & Pick<Profile, 'id' | 'full_name' | 'faculty' | 'email'>): Profile => ({
    mssv: null,
    avatar_url: null,
    is_verified: false,
    verification_status: 'none',
    student_card_path: null,
    karma_points: 0,
    created_at: ago(60 * 24 * 30),
    ...o,
  });

  const profiles: Profile[] = [
    p({ id: 'u-admin', full_name: 'Ban Quản Trị SOM', faculty: 'Công nghệ Thông tin', email: 'admin@som.huit', is_verified: true, verification_status: 'approved', mssv: '0000000000', karma_points: 300 }),
    p({ id: 'u-an', full_name: 'Nguyễn Minh An', faculty: 'Công nghệ Thông tin', email: 'an@som.huit', is_verified: true, verification_status: 'approved', mssv: '2001210123', karma_points: 135 }),
    p({ id: 'u-binh', full_name: 'Trần Thu Bình', faculty: 'Công nghệ Thực phẩm', email: 'binh@som.huit', is_verified: true, verification_status: 'approved', mssv: '2005220456', karma_points: 48 }),
    p({ id: 'u-cuong', full_name: 'Lê Quốc Cường', faculty: 'Cơ khí', email: 'cuong@som.huit', karma_points: 5 }),
    p({ id: 'u-dung', full_name: 'Phạm Thị Dung', faculty: 'Quản trị Kinh doanh', email: 'dung@som.huit', verification_status: 'pending', mssv: '2013230789', student_card_path: 'demo', karma_points: 12 }),
  ];

  const passwords: DemoDb['passwords'] = {};
  profiles.forEach((u) => (passwords[u.email!] = { id: u.id, password: DEMO_PASSWORD }));

  const L = (o: Partial<Listing> & Pick<Listing, 'id' | 'user_id' | 'type' | 'title' | 'description' | 'category' | 'safe_meetup_location'>): Listing => ({
    price: null,
    price_unit: 'đ',
    condition_status: null,
    is_urgent: false,
    image_urls: [],
    status: 'active',
    created_at: ago(120),
    ...o,
  });

  const listings: Listing[] = [
    L({ id: 'l-1', user_id: 'u-an', type: 'goods', title: 'Giáo trình Cấu trúc dữ liệu & Giải thuật (bản mới)', description: 'Sách còn mới, có ghi chú bút chì vài trang chương 3. Phù hợp các bạn khoa CNTT năm 2.', category: 'Giáo trình & Sách', price: 45000, condition_status: 'Mới 99%', safe_meetup_location: 'Sảnh Thư viện HUIT (140 Lê Trọng Tấn)', created_at: ago(35) }),
    L({ id: 'l-2', user_id: 'u-binh', type: 'goods', title: 'Áo blouse trắng size M – khoa Thực phẩm', description: 'Mặc 1 học kỳ thực hành, đã giặt sạch, không ố vàng. Pass lại cho bạn khóa dưới.', category: 'Áo blouse & Đồng phục', price: 60000, condition_status: 'Đã qua sử dụng', safe_meetup_location: 'Căng-tin / Sân trường', created_at: ago(80) }),
    L({ id: 'l-3', user_id: 'u-cuong', type: 'goods', title: 'Quạt điện mini để bàn còn chạy êm', description: 'Chuyển trọ nên tặng lại, bạn nào cần thì nhắn mình nhé.', category: 'Đồ dùng phòng trọ', price: 0, condition_status: 'Cũ nhưng dùng tốt', safe_meetup_location: 'Khu trọ Tây Thạnh', created_at: ago(200) }),
    L({ id: 'l-4', user_id: 'u-an', type: 'goods', title: 'Máy tính Casio fx-580VN X', description: 'Dùng ổn định, đầy đủ chức năng, có nắp. Giá có thương lượng nhẹ.', category: 'Dụng cụ học tập', price: 350000, condition_status: 'Mới 99%', safe_meetup_location: 'Ký túc xá HUIT', created_at: ago(400) }),
    L({ id: 'l-5', user_id: 'u-dung', type: 'goods', title: 'Combo 5 cuốn sách Marketing căn bản', description: 'Sách tham khảo môn Marketing, Quản trị học. Bán cả combo hoặc lẻ.', category: 'Giáo trình & Sách', price: null, condition_status: 'Đã qua sử dụng', safe_meetup_location: 'Sảnh Thư viện HUIT (140 Lê Trọng Tấn)', created_at: ago(900) }),
    L({ id: 'l-6', user_id: 'u-binh', type: 'gigs', title: '[Cần gấp] Mượn áo blouse trắng size M ca chiều', description: 'Mình quên áo, cần mượn áo blouse size M cho ca thực hành 13h tại khu B. Hậu tạ 1 ly trà sữa!', category: 'Mượn đồ', price: null, safe_meetup_location: 'Căng-tin / Sân trường', is_urgent: true, created_at: ago(10) }),
    L({ id: 'l-7', user_id: 'u-cuong', type: 'gigs', title: 'Cần 1 bạn nam phụ khiêng tủ lạnh lúc 17h', description: 'Chuyển trọ ở đường Nguyễn Quý Anh, tầm 30 phút. Bao nước + 50k cảm ơn.', category: 'Chuyển trọ / Khiêng đồ', price: 50000, safe_meetup_location: 'Khu trọ Tây Thạnh', is_urgent: true, created_at: ago(25) }),
    L({ id: 'l-8', user_id: 'u-an', type: 'gigs', title: 'Kèm môn Lập trình C/C++ cho bạn năm nhất', description: 'Mình năm 3 CNTT, kèm 2 buổi/tuần tại thư viện. Hỗ trợ ôn thi giữa kỳ.', category: 'Gia sư / Kèm bài', price: 80000, price_unit: 'đ/buổi', safe_meetup_location: 'Sảnh Thư viện HUIT (140 Lê Trọng Tấn)', created_at: ago(300) }),
    L({ id: 'l-9', user_id: 'u-dung', type: 'gigs', title: 'Nhờ mua hộ cơm trưa từ căng-tin lên KTX', description: 'Trưa nay mình kẹt lab, ai tiện đường mua giúp 1 phần cơm gà, mình gửi lại tiền cơm + 10k.', category: 'Mua hộ / Ship hộ', price: 10000, safe_meetup_location: 'Ký túc xá HUIT', created_at: ago(60) }),
  ];

  const tickets: Ticket[] = [
    { id: 't-1', listing_id: 'l-1', buyer_id: 'u-binh', seller_id: 'u-an', buyer_confirmed: false, seller_confirmed: false, status: 'pending', created_at: ago(30) },
    { id: 't-2', listing_id: 'l-4', buyer_id: 'u-cuong', seller_id: 'u-an', buyer_confirmed: true, seller_confirmed: true, status: 'handshake_completed', created_at: ago(60 * 24 * 3) },
  ];

  const messages: Message[] = [
    { id: uid(), ticket_id: 't-1', sender_id: 'u-binh', content: 'Chào bạn, sách còn không ạ?', created_at: ago(29) },
    { id: uid(), ticket_id: 't-1', sender_id: 'u-an', content: 'Còn nha bạn, chiều nay 16h gặp ở sảnh thư viện được không?', created_at: ago(27) },
    { id: uid(), ticket_id: 't-1', sender_id: 'u-binh', content: 'Ok bạn, hẹn 16h nhé 👍', created_at: ago(26) },
    { id: uid(), ticket_id: 't-2', sender_id: 'u-cuong', content: 'Mình nhận máy rồi, cảm ơn bạn!', created_at: ago(60 * 24 * 3 - 30) },
  ];

  const reviews: Review[] = [
    { id: uid(), ticket_id: 't-2', reviewer_id: 'u-cuong', reviewee_id: 'u-an', rating: 5, comment: 'Bạn An đúng giờ, máy y như mô tả. Rất uy tín!', created_at: ago(60 * 24 * 3 - 20) },
  ];

  return {
    profiles,
    passwords,
    listings,
    tickets,
    messages,
    reviews,
    cards: { 'u-dung': cardPlaceholder('Phạm Thị Dung', '2013230789') },
  };
}

// ------------------------------------------------------------------ storage

function load(): DemoDb {
  if (typeof window === 'undefined') return seed();
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db = seed();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
  try {
    return JSON.parse(raw) as DemoDb;
  } catch {
    const db = seed();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }
}

function save(db: DemoDb) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw new Error('Bộ nhớ demo của trình duyệt đã đầy. Vào trang Admin → "Reset dữ liệu demo".');
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function currentId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(USER_KEY);
}

function setCurrentId(id: string | null) {
  if (id) sessionStorage.setItem(USER_KEY, id);
  else sessionStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function requireUser(db: DemoDb): Profile {
  const id = currentId();
  const user = db.profiles.find((u) => u.id === id);
  if (!user) throw new Error('Vui lòng đăng nhập');
  return user;
}

const lite = (u?: Profile): ProfileLite | null =>
  u ? { id: u.id, full_name: u.full_name, faculty: u.faculty, karma_points: u.karma_points, is_verified: u.is_verified } : null;

function withProfile(db: DemoDb, l: Listing): Listing {
  return { ...l, profiles: lite(db.profiles.find((u) => u.id === l.user_id)) };
}

function withJoins(db: DemoDb, t: Ticket): Ticket {
  const l = db.listings.find((x) => x.id === t.listing_id);
  return {
    ...t,
    listing: l ? { id: l.id, title: l.title, type: l.type, price: l.price, image_urls: l.image_urls, category: l.category } : null,
    buyer: lite(db.profiles.find((u) => u.id === t.buyer_id)),
    seller: lite(db.profiles.find((u) => u.id === t.seller_id)),
  };
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60));

function onAnyChange(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === DB_KEY) cb();
  };
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ------------------------------------------------------------------ demo-only helpers

export function listDemoUsers(): Profile[] {
  return load().profiles;
}

export function switchDemoUser(id: string | null) {
  setCurrentId(id);
}

export function resetDemo() {
  localStorage.removeItem(DB_KEY);
  load();
  window.dispatchEvent(new Event(CHANGE_EVENT));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribeDemoData(cb: () => void) {
  return onAnyChange(cb);
}

// ------------------------------------------------------------------ API

export const demoApi: SomApi = {
  mode: 'demo',

  async getCurrentUser() {
    const db = load();
    return delay(db.profiles.find((u) => u.id === currentId()) ?? null);
  },

  async signIn(email, password) {
    const db = load();
    const rec = db.passwords[email.trim().toLowerCase()];
    if (!rec || rec.password !== password) throw new Error('Sai email hoặc mật khẩu');
    setCurrentId(rec.id);
  },

  async signUp({ email, password, full_name, faculty }) {
    const db = load();
    const key = email.trim().toLowerCase();
    if (db.passwords[key]) throw new Error('Email đã được đăng ký');
    const id = uid();
    db.profiles.push({
      id,
      full_name,
      faculty,
      email: key,
      mssv: null,
      avatar_url: null,
      is_verified: false,
      verification_status: 'none',
      student_card_path: null,
      karma_points: 0,
      created_at: new Date().toISOString(),
    });
    db.passwords[key] = { id, password };
    save(db);
    setCurrentId(id);
    return { needsEmailConfirm: false };
  },

  async signOut() {
    setCurrentId(null);
  },

  onAuthChange(cb) {
    window.addEventListener(AUTH_EVENT, cb);
    const off = onAnyChange(cb); // karma / verified thay đổi cũng cần refresh
    return () => {
      window.removeEventListener(AUTH_EVENT, cb);
      off();
    };
  },

  async updateMyProfile(patch) {
    const db = load();
    const me = requireUser(db);
    Object.assign(me, { full_name: patch.full_name, faculty: patch.faculty });
    save(db);
  },

  async listListings({ type, category, zone, q }) {
    const db = load();
    const term = q?.trim().toLowerCase();
    const rows = db.listings
      .filter((l) => l.status === 'active' && l.type === type)
      .filter((l) => !category || category === 'all' || l.category === category)
      .filter((l) => !zone || zone === 'all' || l.safe_meetup_location === zone)
      .filter((l) => !term || l.title.toLowerCase().includes(term) || l.description.toLowerCase().includes(term))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((l) => withProfile(db, l));
    return delay(rows);
  },

  async listUrgent() {
    const db = load();
    return delay(
      db.listings
        .filter((l) => l.status === 'active' && l.is_urgent)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 8)
        .map((l) => withProfile(db, l)),
    );
  },

  async getListing(id) {
    const db = load();
    const l = db.listings.find((x) => x.id === id);
    if (!l) return null;
    if (l.status !== 'active' && l.user_id !== currentId()) return null;
    return delay(withProfile(db, l));
  },

  async listUserListings(userId, includeInactive) {
    const db = load();
    return delay(
      db.listings
        .filter((l) => l.user_id === userId && (includeInactive || l.status === 'active'))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((l) => withProfile(db, l)),
    );
  },

  async createListing(input, images) {
    const db = load();
    const me = requireUser(db);
    const urls: string[] = [];
    for (const f of images.slice(0, 4)) {
      urls.push(await fileToDataUrl(await compressImage(f)));
    }
    const id = uid();
    db.listings.push({
      id,
      user_id: me.id,
      ...input,
      price_unit: 'đ',
      image_urls: urls,
      status: 'active',
      created_at: new Date().toISOString(),
    });
    save(db);
    return id;
  },

  async updateListingStatus(id, status) {
    const db = load();
    const me = requireUser(db);
    const l = db.listings.find((x) => x.id === id);
    if (!l || l.user_id !== me.id) throw new Error('Bạn không sở hữu tin này');
    l.status = status;
    save(db);
  },

  async getProfile(id) {
    return delay(load().profiles.find((u) => u.id === id) ?? null);
  },

  async listReviewsFor(userId) {
    const db = load();
    return delay(
      db.reviews
        .filter((r) => r.reviewee_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => ({ ...r, reviewer: lite(db.profiles.find((u) => u.id === r.reviewer_id)) })),
    );
  },

  async openTicket(listingId) {
    const db = load();
    const me = requireUser(db);
    const l = db.listings.find((x) => x.id === listingId);
    if (!l || l.status !== 'active') throw new Error('Tin không còn hiển thị');
    if (l.user_id === me.id) throw new Error('Đây là tin của bạn');
    const existing = db.tickets.find((t) => t.listing_id === listingId && t.buyer_id === me.id);
    if (existing) return existing.id;
    const id = uid();
    db.tickets.push({
      id,
      listing_id: listingId,
      buyer_id: me.id,
      seller_id: l.user_id,
      buyer_confirmed: false,
      seller_confirmed: false,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    save(db);
    return id;
  },

  async listMyTickets() {
    const db = load();
    const me = requireUser(db);
    const lastAt = (t: Ticket) =>
      db.messages.filter((m) => m.ticket_id === t.id).reduce((acc, m) => (m.created_at > acc ? m.created_at : acc), t.created_at);
    return delay(
      db.tickets
        .filter((t) => t.buyer_id === me.id || t.seller_id === me.id)
        .sort((a, b) => lastAt(b).localeCompare(lastAt(a)))
        .map((t) => withJoins(db, t)),
    );
  },

  async getTicket(id) {
    const db = load();
    const me = requireUser(db);
    const t = db.tickets.find((x) => x.id === id);
    if (!t || (t.buyer_id !== me.id && t.seller_id !== me.id)) return null;
    return delay(withJoins(db, t));
  },

  async listMessages(ticketId) {
    const db = load();
    const me = requireUser(db);
    const t = db.tickets.find((x) => x.id === ticketId);
    if (!t || (t.buyer_id !== me.id && t.seller_id !== me.id)) return [];
    return db.messages.filter((m) => m.ticket_id === ticketId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async sendMessage(ticketId, content) {
    const db = load();
    const me = requireUser(db);
    const t = db.tickets.find((x) => x.id === ticketId);
    if (!t || (t.buyer_id !== me.id && t.seller_id !== me.id)) throw new Error('Không có quyền');
    db.messages.push({ id: uid(), ticket_id: ticketId, sender_id: me.id, content: content.slice(0, 2000), created_at: new Date().toISOString() });
    save(db);
  },

  subscribeTicket(_ticketId, onChange) {
    return onAnyChange(onChange);
  },

  async confirmHandshake(ticketId) {
    const db = load();
    const me = requireUser(db);
    const t = db.tickets.find((x) => x.id === ticketId);
    if (!t || (t.buyer_id !== me.id && t.seller_id !== me.id)) throw new Error('Không có quyền');
    if (t.status === 'handshake_completed') return;
    if (me.id === t.buyer_id) t.buyer_confirmed = true;
    else t.seller_confirmed = true;
    if (t.buyer_confirmed && t.seller_confirmed) {
      t.status = 'handshake_completed';
      db.profiles.forEach((u) => {
        if (u.id === t.buyer_id || u.id === t.seller_id) u.karma_points += KARMA_RULES.handshake;
      });
    }
    save(db);
  },

  async getMyReview(ticketId) {
    const db = load();
    const me = requireUser(db);
    return db.reviews.find((r) => r.ticket_id === ticketId && r.reviewer_id === me.id) ?? null;
  },

  async submitReview(ticketId, rating, comment) {
    const db = load();
    const me = requireUser(db);
    const t = db.tickets.find((x) => x.id === ticketId);
    if (!t || t.status !== 'handshake_completed') throw new Error('Chỉ đánh giá sau khi đã bắt tay');
    if (me.id !== t.buyer_id && me.id !== t.seller_id) throw new Error('Không có quyền');
    if (db.reviews.some((r) => r.ticket_id === ticketId && r.reviewer_id === me.id)) throw new Error('Bạn đã đánh giá rồi');
    const reviewee = me.id === t.buyer_id ? t.seller_id : t.buyer_id;
    db.reviews.push({ id: uid(), ticket_id: ticketId, reviewer_id: me.id, reviewee_id: reviewee, rating, comment: comment || null, created_at: new Date().toISOString() });
    const target = db.profiles.find((u) => u.id === reviewee);
    if (target) target.karma_points = Math.max(0, target.karma_points + (KARMA_RULES.review[rating] ?? 0));
    save(db);
  },

  async submitVerification(mssv, faculty, card) {
    const db = load();
    const me = requireUser(db);
    if (db.profiles.some((u) => u.id !== me.id && u.mssv === mssv)) throw new Error('MSSV này đã được dùng bởi tài khoản khác');
    db.cards[me.id] = await fileToDataUrl(await compressImage(card));
    Object.assign(me, { mssv, faculty, verification_status: 'pending', student_card_path: 'demo' });
    save(db);
  },

  async listPendingVerifications() {
    const db = load();
    return delay(
      db.profiles
        .filter((u) => u.verification_status === 'pending')
        .map((u) => ({ profile: u, card_url: db.cards[u.id] ?? null })),
    );
  },

  async reviewVerification(userId, approve) {
    const db = load();
    const u = db.profiles.find((x) => x.id === userId);
    if (!u) throw new Error('Không tìm thấy người dùng');
    u.verification_status = approve ? 'approved' : 'rejected';
    u.is_verified = approve;
    save(db);
  },
};
