import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const PLATFORMS = ['TikTok', 'Facebook', 'Instagram', 'Shopee', 'YouTube']
export const POST_TYPES = ['Reel/Video', 'Bài viết', 'Story', 'Poster', 'Live']
export const POST_STATUSES = ['draft', 'pending', 'scheduled', 'published', 'archived']
export const CAMP_STATUSES = ['draft', 'scheduled', 'active', 'done']
export const KOC_STATUSES = ['prospect', 'contacted', 'seeding', 'done']
export const B2B_STAGES = ['new', 'qualified', 'proposal', 'won', 'lost']

export const PLATFORM_COLORS = {
  TikTok: { bg: '#E8F5E3', text: '#2D6A1F', class: 'badge-tt' },
  Facebook: { bg: '#E3EEF8', text: '#1A4A7A', class: 'badge-fb' },
  Instagram: { bg: '#F8E8F0', text: '#7A1A4A', class: 'badge-ig' },
  Shopee: { bg: '#FDF3E0', text: '#7A4E00', class: 'badge-sh' },
  YouTube: { bg: '#FDE8E8', text: '#7A1A1A', class: 'badge-yt' },
}

export const STATUS_LABELS = {
  draft: 'Nháp', pending: 'Chờ duyệt', scheduled: 'Đã lên lịch',
  published: 'Đã đăng', archived: 'Lưu trữ',
  prospect: 'Tiềm năng', contacted: 'Đã liên hệ', seeding: 'Đang seeding', done: 'Hoàn thành',
  new: 'Mới', qualified: 'Đủ điều kiện', proposal: 'Đề xuất', won: 'Chốt', lost: 'Mất',
  active: 'Đang chạy',
}

/*
====== SUPABASE SCHEMA V2 — paste vào SQL Editor ======

-- Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text, role text default 'member',
  avatar_url text, created_at timestamptz default now()
);

-- Posts (content)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null, caption text, script text,
  platform text not null, post_type text default 'Reel/Video',
  scheduled_at timestamptz, status text default 'draft',
  hashtags text[], image_url text,
  content_score integer,
  created_by uuid references profiles(id),
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Campaigns
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null, objective text,
  start_date date, end_date date,
  budget numeric default 0, spent numeric default 0,
  status text default 'draft', platforms text[],
  key_visual_url text, notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Campaign KPIs
create table if not exists campaign_kpis (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  reach integer default 0, engagement integer default 0,
  clicks integer default 0, orders integer default 0,
  revenue numeric default 0,
  recorded_at date default current_date
);

-- KOC Leads
create table if not exists koc_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null, platform text, followers integer,
  contact text, status text default 'prospect',
  notes text, gifting_sent boolean default false,
  gifting_date date, gifting_items text,
  views integer, orders_from_koc integer default 0,
  revenue_from_koc numeric default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- B2B Leads
create table if not exists b2b_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null, contact_name text, contact_email text,
  deal_size numeric, quantity integer,
  stage text default 'new', notes text,
  follow_up_date date, last_contact date,
  products text[],
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- AI Generate history
create table if not exists ai_history (
  id uuid primary key default gen_random_uuid(),
  platform text, sku text, objective text,
  result_caption text, result_script text,
  result_hashtags text, result_cta text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Shopee daily stats
create table if not exists shopee_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  revenue numeric default 0,
  orders integer default 0,
  visitors integer default 0,
  created_by uuid references profiles(id)
);

-- Enable RLS
alter table profiles enable row level security;
alter table posts enable row level security;
alter table campaigns enable row level security;
alter table campaign_kpis enable row level security;
alter table koc_leads enable row level security;
alter table b2b_leads enable row level security;
alter table ai_history enable row level security;
alter table shopee_stats enable row level security;

-- Policies
create policy "auth" on profiles for select using (auth.role()='authenticated');
create policy "auth" on posts for all using (auth.role()='authenticated');
create policy "auth" on campaigns for all using (auth.role()='authenticated');
create policy "auth" on campaign_kpis for all using (auth.role()='authenticated');
create policy "auth" on koc_leads for all using (auth.role()='authenticated');
create policy "auth" on b2b_leads for all using (auth.role()='authenticated');
create policy "auth" on ai_history for all using (auth.role()='authenticated');
create policy "auth" on shopee_stats for all using (auth.role()='authenticated');

-- Storage bucket for images
insert into storage.buckets (id, name, public) values ('content-images', 'content-images', true);
create policy "Public read" on storage.objects for select using (bucket_id = 'content-images');
create policy "Auth upload" on storage.objects for insert with check (bucket_id = 'content-images' and auth.role() = 'authenticated');
create policy "Auth delete" on storage.objects for delete using (bucket_id = 'content-images' and auth.role() = 'authenticated');

*/
