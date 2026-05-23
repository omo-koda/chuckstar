
-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'user');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are public readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- ============ CATEGORIES ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  image_url text,
  icon_key text,
  item_count text,
  gradient text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories are public" on public.categories for select using (true);
create policy "admins manage categories" on public.categories for all using (public.has_role(auth.uid(), 'admin'));

-- ============ COLLECTIBLES ============
create table public.collectibles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  price_cents int not null default 0,
  image_url text,
  badge text,
  badge_color text,
  views int not null default 0,
  likes int not null default 0,
  remaining int not null default 0,
  total int not null default 0,
  end_time timestamptz,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.collectibles enable row level security;
create policy "collectibles are public" on public.collectibles for select using (true);
create policy "admins manage collectibles" on public.collectibles for all using (public.has_role(auth.uid(), 'admin'));

-- ============ TESTIMONIALS ============
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  avatar_url text,
  quote text not null,
  rating int not null default 5,
  result text,
  approved boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create policy "approved testimonials are public" on public.testimonials for select using (approved = true);
create policy "admins manage testimonials" on public.testimonials for all using (public.has_role(auth.uid(), 'admin'));

-- ============ EVENTS ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date text not null,
  location text,
  attendees text,
  status text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create policy "events are public" on public.events for select using (true);
create policy "admins manage events" on public.events for all using (public.has_role(auth.uid(), 'admin'));

-- ============ CART ITEMS ============
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_id uuid not null references public.collectibles(id) on delete cascade,
  qty int not null default 1,
  created_at timestamptz not null default now(),
  unique (user_id, collectible_id)
);
alter table public.cart_items enable row level security;
create policy "users read own cart" on public.cart_items for select using (auth.uid() = user_id);
create policy "users insert own cart" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "users update own cart" on public.cart_items for update using (auth.uid() = user_id);
create policy "users delete own cart" on public.cart_items for delete using (auth.uid() = user_id);

-- ============ LIKES ============
create table public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  collectible_id uuid not null references public.collectibles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collectible_id)
);
alter table public.likes enable row level security;
create policy "users read own likes" on public.likes for select using (auth.uid() = user_id);
create policy "users insert own likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "users delete own likes" on public.likes for delete using (auth.uid() = user_id);

-- Trigger to keep collectibles.likes in sync
create or replace function public.bump_likes_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.collectibles set likes = likes + 1 where id = new.collectible_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.collectibles set likes = greatest(likes - 1, 0) where id = old.collectible_id;
    return old;
  end if;
  return null;
end; $$;
create trigger likes_count_trg after insert or delete on public.likes
  for each row execute function public.bump_likes_count();

-- ============ CONTACT MESSAGES ============
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "anyone submits contact" on public.contact_messages for insert with check (true);
create policy "admins read contact" on public.contact_messages for select using (public.has_role(auth.uid(), 'admin'));

-- ============ NEWSLETTER ============
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "anyone subscribes" on public.newsletter_subscribers for insert with check (true);
create policy "admins read subscribers" on public.newsletter_subscribers for select using (public.has_role(auth.uid(), 'admin'));

-- ============ PRESENCE (live count) ============
create table public.presence (
  session_id text primary key,
  last_seen timestamptz not null default now()
);
alter table public.presence enable row level security;
create policy "anyone upserts presence" on public.presence for insert with check (true);
create policy "anyone updates presence" on public.presence for update using (true);
create policy "presence is readable" on public.presence for select using (true);

-- ============ SEED DATA ============
insert into public.categories (slug, title, subtitle, image_url, icon_key, item_count, gradient, sort_order) values
  ('tcg', 'Trading Card Games', 'Pokémon, Yu-Gi-Oh! & More', '/cat-pokemon.jpg', 'flame', '15,000+ Cards', 'from-orange-500 to-red-600', 1),
  ('yugioh', 'Yu-Gi-Oh! Collection', 'Rares, Holos & First Editions', '/cat-yugioh.jpg', 'shield', '8,500+ Cards', 'from-blue-500 to-indigo-600', 2),
  ('tabletop', 'Tabletop & RPG', 'D&D, Warhammer & Miniatures', '/cat-dnd.jpg', 'gem', '3,200+ Items', 'from-purple-500 to-pink-600', 3),
  ('sports', 'Sports Memorabilia', 'Baseball, Basketball & Football', '/cat-sports.jpg', 'trophy', '12,000+ Items', 'from-cyan-500 to-blue-600', 4);

insert into public.collectibles (slug, name, category, price_cents, image_url, badge, badge_color, views, likes, remaining, total, end_time, is_featured) values
  ('golden-dragon-gx', 'Golden Dragon GX', 'Trading Cards', 129900, '/featured-1.jpg', 'Ultra Rare', 'bg-amber-500/20 text-amber-400 border-amber-500/30', 2400, 186, 3, 47, now() + interval '2 days 8 hours', true),
  ('blue-eyes-ultimate', 'Blue-Eyes Ultimate', 'Yu-Gi-Oh!', 89900, '/featured-2.jpg', 'Holo Rare', 'bg-blue-500/20 text-blue-400 border-blue-500/30', 1800, 142, 8, 25, now() + interval '5 days 14 hours', true),
  ('vintage-rookie-card', 'Vintage Rookie Card', 'Sports Cards', 249900, '/featured-3.jpg', 'PSA 10', 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 3100, 215, 1, 12, now() + interval '1 day 3 hours', true);

insert into public.testimonials (name, role, avatar_url, quote, rating, result, approved, sort_order) values
  ('Marcus Chen', 'Pokémon Collector', '/testimonial-1.jpg', 'I pulled a $1,200 Charizard from a pack I bought here and sold it the same week. The authentication process gave my buyer total confidence. Clicker Verse is now my only stop for sealed product.', 5, '$1,200 sale in 3 days', true, 1),
  ('Sarah Mitchell', 'Yu-Gi-Oh! Tournament Player', '/testimonial-2.jpg', 'The grading service saved me hundreds. I sent in 20 cards and 16 came back PSA 9 or 10. The turnaround was faster than going direct. Plus the community Discord helped me price everything right.', 5, '16/20 PSA 9+ grades', true, 2),
  ('David Park', 'Sports Card Investor', '/testimonial-3.jpg', 'I have been collecting for 15 years and the secure vault feature is a game changer. My high-end slabs are insured, climate-controlled, and I can list them for sale without ever shipping them myself.', 5, '$50K+ collection vaulted', true, 3);

insert into public.events (title, event_date, location, attendees, status, sort_order) values
  ('Spring Collectors Convention', 'June 15-17, 2026', 'Los Angeles Convention Center', '5,000+', 'Upcoming', 1),
  ('Yu-Gi-Oh! Championship', 'July 8, 2026', 'Online Tournament', '2,000+', 'Registration Open', 2),
  ('Sports Card Swap Meet', 'August 22, 2026', 'Chicago Trade Hall', '1,500+', 'Upcoming', 3);
