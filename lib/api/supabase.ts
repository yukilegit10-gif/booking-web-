'use client';

import type { Listing, Message, PendingVerification, Profile, Review, Ticket } from '../types';
import { compressImage } from '../image-compression';
import { getBrowserSupabase } from '../supabase/client';
import type { SomApi } from './types';

const PROFILE_LITE = 'id, full_name, faculty, karma_points, is_verified';
const LISTING_SELECT = `*, profiles(${PROFILE_LITE})`;
const TICKET_SELECT = `*, listing:listings(id, title, type, price, image_urls, category),
  buyer:profiles!connection_tickets_buyer_id_fkey(${PROFILE_LITE}),
  seller:profiles!connection_tickets_seller_id_fkey(${PROFILE_LITE})`;

const sb = () => getBrowserSupabase();

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

async function requireUid(): Promise<string> {
  const { data } = await sb().auth.getUser();
  if (!data.user) throw new Error('Vui lòng đăng nhập');
  return data.user.id;
}

export const supabaseApi: SomApi = {
  mode: 'supabase',

  async getCurrentUser() {
    const { data } = await sb().auth.getUser();
    if (!data.user) return null;
    const res = await sb().from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return (res.data as Profile | null) ?? null;
  },

  async signIn(email, password) {
    const { error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Sai email hoặc mật khẩu' : error.message);
  },

  async signUp({ email, password, full_name, faculty }) {
    const { data, error } = await sb().auth.signUp({
      email,
      password,
      options: { data: { full_name, faculty }, emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw new Error(error.message);
    return { needsEmailConfirm: !data.session };
  },

  async signOut() {
    await sb().auth.signOut();
  },

  onAuthChange(cb) {
    const { data } = sb().auth.onAuthStateChange(() => cb());
    return () => data.subscription.unsubscribe();
  },

  async updateMyProfile(patch) {
    const id = await requireUid();
    check(await sb().from('profiles').update(patch).eq('id', id));
  },

  async listListings({ type, category, zone, q }) {
    let query = sb().from('listings').select(LISTING_SELECT).eq('type', type).eq('status', 'active');
    if (category && category !== 'all') query = query.eq('category', category);
    if (zone && zone !== 'all') query = query.eq('safe_meetup_location', zone);
    const term = q?.trim().replace(/[%,()]/g, ' ');
    if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    return check(await query.order('created_at', { ascending: false }).limit(60)) as Listing[];
  },

  async listUrgent() {
    return check(
      await sb().from('listings').select(LISTING_SELECT).eq('status', 'active').eq('is_urgent', true).order('created_at', { ascending: false }).limit(8),
    ) as Listing[];
  },

  async getListing(id) {
    const res = await sb().from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle();
    return (res.data as Listing | null) ?? null;
  },

  async listUserListings(userId, includeInactive) {
    let query = sb().from('listings').select(LISTING_SELECT).eq('user_id', userId);
    if (!includeInactive) query = query.eq('status', 'active');
    return check(await query.order('created_at', { ascending: false })) as Listing[];
  },

  async createListing(input, images) {
    const uid = await requireUid();
    const urls: string[] = [];
    for (const f of images.slice(0, 4)) {
      const file = await compressImage(f);
      const path = `${uid}/${crypto.randomUUID()}.webp`;
      check(await sb().storage.from('listing-images').upload(path, file, { contentType: file.type || 'image/webp' }));
      urls.push(sb().storage.from('listing-images').getPublicUrl(path).data.publicUrl);
    }
    const row = check(
      await sb().from('listings').insert({ ...input, user_id: uid, image_urls: urls }).select('id').single(),
    ) as { id: string };
    return row.id;
  },

  async updateListingStatus(id, status) {
    check(await sb().from('listings').update({ status }).eq('id', id));
  },

  async getProfile(id) {
    const res = await sb().from('profiles').select('*').eq('id', id).maybeSingle();
    return (res.data as Profile | null) ?? null;
  },

  async listReviewsFor(userId) {
    return check(
      await sb()
        .from('handshake_reviews')
        .select(`*, reviewer:profiles!handshake_reviews_reviewer_id_fkey(${PROFILE_LITE})`)
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false }),
    ) as Review[];
  },

  async openTicket(listingId) {
    const uid = await requireUid();
    const existing = await sb().from('connection_tickets').select('id').eq('listing_id', listingId).eq('buyer_id', uid).maybeSingle();
    if (existing.data) return (existing.data as { id: string }).id;
    const listing = check(await sb().from('listings').select('user_id').eq('id', listingId).single()) as { user_id: string };
    if (listing.user_id === uid) throw new Error('Đây là tin của bạn');
    const row = check(
      await sb().from('connection_tickets').insert({ listing_id: listingId, buyer_id: uid, seller_id: listing.user_id }).select('id').single(),
    ) as { id: string };
    return row.id;
  },

  async listMyTickets() {
    const uid = await requireUid();
    return check(
      await sb()
        .from('connection_tickets')
        .select(TICKET_SELECT)
        .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
        .order('created_at', { ascending: false }),
    ) as Ticket[];
  },

  async getTicket(id) {
    const res = await sb().from('connection_tickets').select(TICKET_SELECT).eq('id', id).maybeSingle();
    return (res.data as Ticket | null) ?? null;
  },

  async listMessages(ticketId) {
    return check(
      await sb().from('messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }).limit(500),
    ) as Message[];
  },

  async sendMessage(ticketId, content) {
    const uid = await requireUid();
    check(await sb().from('messages').insert({ ticket_id: ticketId, sender_id: uid, content: content.slice(0, 2000) }));
  },

  subscribeTicket(ticketId, onChange) {
    const channel = sb()
      .channel(`ticket-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${ticketId}` }, onChange)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'connection_tickets', filter: `id=eq.${ticketId}` }, onChange)
      .subscribe();
    return () => {
      sb().removeChannel(channel);
    };
  },

  async confirmHandshake(ticketId) {
    check(await sb().rpc('confirm_handshake', { p_ticket: ticketId }));
  },

  async getMyReview(ticketId) {
    const uid = await requireUid();
    const res = await sb().from('handshake_reviews').select('*').eq('ticket_id', ticketId).eq('reviewer_id', uid).maybeSingle();
    return (res.data as Review | null) ?? null;
  },

  async submitReview(ticketId, rating, comment) {
    const uid = await requireUid();
    const t = check(await sb().from('connection_tickets').select('buyer_id, seller_id').eq('id', ticketId).single()) as {
      buyer_id: string;
      seller_id: string;
    };
    const reviewee = uid === t.buyer_id ? t.seller_id : t.buyer_id;
    check(
      await sb().from('handshake_reviews').insert({ ticket_id: ticketId, reviewer_id: uid, reviewee_id: reviewee, rating, comment: comment || null }),
    );
  },

  async submitVerification(mssv, faculty, card) {
    const uid = await requireUid();
    const file = await compressImage(card);
    const path = `${uid}/card-${Date.now()}.webp`;
    check(await sb().storage.from('student-cards').upload(path, file, { contentType: file.type || 'image/webp', upsert: true }));
    const res = await fetch('/api/verify-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mssv, faculty, cardPath: path }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? 'Gửi yêu cầu thất bại');
  },

  async listPendingVerifications() {
    const res = await fetch('/api/admin/verifications');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Không tải được danh sách');
    return json.items as PendingVerification[];
  },

  async reviewVerification(userId, approve) {
    const res = await fetch('/api/admin/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, approve }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Thao tác thất bại');
  },
};
