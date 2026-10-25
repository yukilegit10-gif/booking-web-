export type ListingType = 'goods' | 'gigs';
export type ListingStatus = 'active' | 'completed' | 'hidden';
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type TicketStatus = 'pending' | 'handshake_completed';

export interface Profile {
  id: string;
  full_name: string;
  mssv: string | null;
  faculty: string;
  email: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  verification_status: VerificationStatus;
  student_card_path: string | null;
  karma_points: number;
  created_at: string;
}

export type ProfileLite = Pick<Profile, 'id' | 'full_name' | 'faculty' | 'karma_points' | 'is_verified'>;

export interface Listing {
  id: string;
  user_id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  price: number | null;
  price_unit: string;
  condition_status: string | null;
  safe_meetup_location: string;
  is_urgent: boolean;
  image_urls: string[] | null;
  status: ListingStatus;
  created_at: string;
  profiles?: ProfileLite | null;
}

export interface NewListingInput {
  type: ListingType;
  title: string;
  description: string;
  category: string;
  price: number | null;
  condition_status: string | null;
  safe_meetup_location: string;
  is_urgent: boolean;
}

export interface Ticket {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  status: TicketStatus;
  created_at: string;
  listing?: Pick<Listing, 'id' | 'title' | 'type' | 'price' | 'image_urls' | 'category'> | null;
  buyer?: ProfileLite | null;
  seller?: ProfileLite | null;
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Review {
  id: string;
  ticket_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: ProfileLite | null;
}

export interface PendingVerification {
  profile: Profile;
  card_url: string | null;
}

export interface ListingFilters {
  type: ListingType;
  category?: string;
  zone?: string;
  q?: string;
}
