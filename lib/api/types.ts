import type {
  Listing,
  ListingFilters,
  ListingStatus,
  Message,
  NewListingInput,
  PendingVerification,
  Profile,
  Review,
  Ticket,
} from '../types';

export interface SignUpInput {
  email: string;
  password: string;
  full_name: string;
  faculty: string;
}

/** Lớp truy cập dữ liệu chung cho cả chế độ Demo (localStorage) và Supabase. */
export interface SomApi {
  mode: 'demo' | 'supabase';

  // ---- Auth ----
  getCurrentUser(): Promise<Profile | null>;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: SignUpInput): Promise<{ needsEmailConfirm: boolean }>;
  signOut(): Promise<void>;
  onAuthChange(cb: () => void): () => void;
  updateMyProfile(patch: Pick<Profile, 'full_name' | 'faculty'>): Promise<void>;

  // ---- Listings ----
  listListings(filters: ListingFilters): Promise<Listing[]>;
  listUrgent(): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  listUserListings(userId: string, includeInactive: boolean): Promise<Listing[]>;
  createListing(input: NewListingInput, images: File[]): Promise<string>;
  updateListingStatus(id: string, status: ListingStatus): Promise<void>;

  // ---- Profiles & reviews ----
  getProfile(id: string): Promise<Profile | null>;
  listReviewsFor(userId: string): Promise<Review[]>;

  // ---- Tickets / chat / handshake ----
  openTicket(listingId: string): Promise<string>;
  listMyTickets(): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket | null>;
  listMessages(ticketId: string): Promise<Message[]>;
  sendMessage(ticketId: string, content: string): Promise<void>;
  subscribeTicket(ticketId: string, onChange: () => void): () => void;
  confirmHandshake(ticketId: string): Promise<void>;
  getMyReview(ticketId: string): Promise<Review | null>;
  submitReview(ticketId: string, rating: number, comment: string): Promise<void>;

  // ---- Xác thực MSSV ----
  submitVerification(mssv: string, faculty: string, card: File): Promise<void>;

  // ---- Admin ----
  listPendingVerifications(): Promise<PendingVerification[]>;
  reviewVerification(userId: string, approve: boolean): Promise<void>;
}
