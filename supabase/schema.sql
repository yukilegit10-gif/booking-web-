-- =====================================================================
--  SOM HUIT – Student • Order • Market
--  "Việc khó có chợ sinh viên lo"
--  Chạy toàn bộ file này trong Supabase Dashboard → SQL Editor.
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PROFILES – thông tin sinh viên & điểm uy tín Karma
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  mssv text unique,
  faculty text not null,                         -- Khoa CNTT, Thực phẩm, Cơ khí...
  email text,
  avatar_url text,
  is_verified boolean default false,
  verification_status text not null default 'none'
    check (verification_status in ('none', 'pending', 'approved', 'rejected')),
  student_card_path text,                        -- đường dẫn trong bucket private "student-cards"
  karma_points integer default 0,                -- thay cho tiền: cày điểm để đẩy tin
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---------------------------------------------------------------------
-- 2. LISTINGS – tin đăng Chợ đồ cũ & Việc vặt
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('goods', 'gigs')) not null,
  title text not null,
  description text not null,
  category text not null,
  price numeric,                                 -- null = Thỏa thuận / Tặng miễn phí
  price_unit text default 'đ',
  condition_status text,
  safe_meetup_location text not null,
  is_urgent boolean default false,               -- nhãn SOS / Việc gấp
  image_urls text[],
  status text check (status in ('active', 'completed', 'hidden')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists listings_feed_idx on public.listings (type, status, created_at desc);

-- ---------------------------------------------------------------------
-- 3. CONNECTION TICKETS – mở khi người dùng bấm "Nhắn tin"
-- ---------------------------------------------------------------------
create table if not exists public.connection_tickets (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  buyer_confirmed boolean not null default false,   -- 2 bên cùng bấm "Bắt tay" mới hoàn tất
  seller_confirmed boolean not null default false,
  status text check (status in ('pending', 'handshake_completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);

-- ---------------------------------------------------------------------
-- 4. MESSAGES – chat thời gian thực
-- ---------------------------------------------------------------------
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.connection_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists messages_ticket_idx on public.messages (ticket_id, created_at);

-- ---------------------------------------------------------------------
-- 5. HANDSHAKE REVIEWS – đánh giá uy tín 2 chiều
--    (mỗi bên được đánh giá 1 lần / ticket → unique(ticket_id, reviewer_id))
-- ---------------------------------------------------------------------
create table if not exists public.handshake_reviews (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.connection_tickets(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  reviewee_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (ticket_id, reviewer_id)
);

-- =====================================================================
--  HELPER FUNCTIONS
-- =====================================================================

-- Kiểm tra user hiện tại có thuộc ticket không (dùng trong RLS)
create or replace function public.is_ticket_party(p_ticket uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.connection_tickets t
    where t.id = p_ticket and auth.uid() in (t.buyer_id, t.seller_id)
  );
$$;

-- Tự tạo profile khi user đăng ký (đọc full_name, faculty từ metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, faculty, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'faculty', ''), 'Chưa cập nhật'),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Chặn người dùng tự sửa các cột nhạy cảm (is_verified, karma, mssv...).
-- Chỉ service_role (API server) hoặc hàm SECURITY DEFINER mới sửa được.
-- LƯU Ý: hàm trigger này KHÔNG được là security definer.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.id                  := old.id;
    new.mssv                := old.mssv;
    new.email               := old.email;
    new.is_verified         := old.is_verified;
    new.verification_status := old.verification_status;
    new.student_card_path   := old.student_card_path;
    new.karma_points        := old.karma_points;
    new.created_at          := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Không cho đổi chủ tin / ngày tạo
create or replace function public.protect_listing_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.user_id    := old.user_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_listing_columns on public.listings;
create trigger protect_listing_columns
  before update on public.listings
  for each row execute function public.protect_listing_columns();


-- =====================================================================
--  KARMA HANDSHAKE
-- =====================================================================

-- Mỗi bên bấm "Bắt tay". Khi cả 2 cùng xác nhận → hoàn tất, +10 Karma mỗi bên.
create or replace function public.confirm_handshake(p_ticket uuid)
returns public.connection_tickets
language plpgsql security definer set search_path = public
as $$
declare
  t public.connection_tickets;
begin
  select * into t from public.connection_tickets where id = p_ticket for update;
  if not found then
    raise exception 'Không tìm thấy cuộc trò chuyện';
  end if;
  if auth.uid() is null or auth.uid() not in (t.buyer_id, t.seller_id) then
    raise exception 'Bạn không thuộc cuộc trò chuyện này';
  end if;
  if t.status = 'handshake_completed' then
    return t;
  end if;

  if auth.uid() = t.buyer_id then
    update public.connection_tickets set buyer_confirmed = true where id = p_ticket returning * into t;
  else
    update public.connection_tickets set seller_confirmed = true where id = p_ticket returning * into t;
  end if;

  if t.buyer_confirmed and t.seller_confirmed then
    update public.connection_tickets set status = 'handshake_completed' where id = p_ticket returning * into t;
    update public.profiles set karma_points = coalesce(karma_points, 0) + 10
      where id in (t.buyer_id, t.seller_id);
  end if;

  return t;
end;
$$;

-- Sau khi được đánh giá: 5★ +5 | 4★ +3 | 3★ 0 | 2★ -2 | 1★ -5
create or replace function public.apply_review_karma()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  delta integer;
begin
  delta := case new.rating when 5 then 5 when 4 then 3 when 3 then 0 when 2 then -2 else -5 end;
  update public.profiles
    set karma_points = greatest(0, coalesce(karma_points, 0) + delta)
    where id = new.reviewee_id;
  return new;
end;
$$;

drop trigger if exists apply_review_karma on public.handshake_reviews;
create trigger apply_review_karma
  after insert on public.handshake_reviews
  for each row execute function public.apply_review_karma();

-- =====================================================================
--  ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.listings           enable row level security;
alter table public.connection_tickets enable row level security;
alter table public.messages           enable row level security;
alter table public.handshake_reviews  enable row level security;

-- PROFILES
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- LISTINGS (chủ tin xem được cả tin đã ẩn / hoàn tất)
drop policy if exists "Listings are viewable by everyone" on public.listings;
create policy "Listings are viewable by everyone" on public.listings
  for select using (status = 'active' or auth.uid() = user_id);
drop policy if exists "Authenticated users can create listings" on public.listings;
create policy "Authenticated users can create listings" on public.listings
  for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own listings" on public.listings;
create policy "Users can update own listings" on public.listings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own listings" on public.listings;
create policy "Users can delete own listings" on public.listings
  for delete using (auth.uid() = user_id);

-- CONNECTION TICKETS
drop policy if exists "View tickets" on public.connection_tickets;
create policy "View tickets" on public.connection_tickets
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
drop policy if exists "Create tickets" on public.connection_tickets;
create policy "Create tickets" on public.connection_tickets
  for insert with check (
    auth.uid() = buyer_id
    and status = 'pending'
    and buyer_confirmed = false
    and seller_confirmed = false
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.user_id = seller_id and l.status = 'active'
    )
  );
-- (Không có policy UPDATE: trạng thái chỉ đổi qua hàm confirm_handshake)

-- MESSAGES – CHỈ 2 bên trong ticket mới đọc / gửi được
drop policy if exists "View messages" on public.messages;
create policy "View messages" on public.messages
  for select using (public.is_ticket_party(ticket_id));
drop policy if exists "Send messages" on public.messages;
create policy "Send messages" on public.messages
  for insert with check (auth.uid() = sender_id and public.is_ticket_party(ticket_id));

-- HANDSHAKE REVIEWS – chỉ đánh giá khi đã bắt tay xong, và chỉ đánh giá bên kia
drop policy if exists "View reviews" on public.handshake_reviews;
create policy "View reviews" on public.handshake_reviews
  for select using (true);
drop policy if exists "Create review" on public.handshake_reviews;
create policy "Create review" on public.handshake_reviews
  for insert with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.connection_tickets t
      where t.id = ticket_id
        and t.status = 'handshake_completed'
        and (
          (t.buyer_id = reviewer_id and t.seller_id = reviewee_id) or
          (t.seller_id = reviewer_id and t.buyer_id = reviewee_id)
        )
    )
  );

-- =====================================================================
--  REALTIME
-- =====================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.connection_tickets;
  exception when duplicate_object then null;
  end;
end $$;

-- =====================================================================
--  STORAGE
--  listing-images: public  | student-cards: PRIVATE (chỉ chủ & server đọc)
--  Quy ước đường dẫn: <user_id>/<tên-file>
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true),
       ('student-cards', 'student-cards', false)
on conflict (id) do nothing;

drop policy if exists "Listing images are public" on storage.objects;
create policy "Listing images are public" on storage.objects
  for select using (bucket_id = 'listing-images');

drop policy if exists "Users upload own listing images" on storage.objects;
create policy "Users upload own listing images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own listing images" on storage.objects;
create policy "Users delete own listing images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own student card" on storage.objects;
create policy "Users upload own student card" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'student-cards' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users read own student card" on storage.objects;
create policy "Users read own student card" on storage.objects
  for select to authenticated
  using (bucket_id = 'student-cards' and (storage.foldername(name))[1] = auth.uid()::text);
