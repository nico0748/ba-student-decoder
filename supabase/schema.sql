-- =====================================================================
-- シャーレ暗号解読 ランキング用スキーマ（Supabase / Postgres）
-- Supabase SQL Editor に貼り付けて実行してください。
-- =====================================================================

-- スコア本体
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  name        text    not null check (char_length(name) between 1 and 12),
  time_ms     integer not null check (time_ms between 100 and 3600000),
  difficulty  text    not null check (difficulty in ('easy','normal','hard')),
  count       integer not null check (count in (1,5,10)),
  client_id   uuid,
  created_at  timestamptz not null default now()
);
create index if not exists scores_board_idx on public.scores (difficulty, count, time_ms);
create index if not exists scores_client_idx on public.scores (client_id, created_at);

-- 使い捨てトークン（リプレイ防止）。start-game の nonce を submit 時に1回だけ消費。
create table if not exists public.used_tokens (
  nonce      uuid primary key,
  used_at    timestamptz not null default now()
);

-- 送信ログ（レート制限・監査用。生IPは保存せずハッシュのみ）
create table if not exists public.submit_log (
  id         bigint generated always as identity primary key,
  client_id  uuid,
  ip_hash    text,
  created_at timestamptz not null default now()
);
create index if not exists submit_log_client_idx on public.submit_log (client_id, created_at);
create index if not exists submit_log_ip_idx on public.submit_log (ip_hash, created_at);

-- =====================================================================
-- RLS（行レベルセキュリティ）
--  ・anon（公開鍵）は scores の SELECT のみ許可
--  ・INSERT/UPDATE/DELETE は一切許可しない（書き込みは Edge Function の
--    service_role 経由のみ。service_role は RLS をバイパスする）
--  ・used_tokens / submit_log は anon から読めない
-- =====================================================================
alter table public.scores      enable row level security;
alter table public.used_tokens enable row level security;
alter table public.submit_log  enable row level security;

drop policy if exists "scores public read" on public.scores;
create policy "scores public read" on public.scores
  for select to anon, authenticated using (true);
-- INSERT/UPDATE/DELETE ポリシーは作らない → anon からは不可

-- =====================================================================
-- ランキング取得 RPC（名前ごとのベストのみ・上位N件）
-- anon から呼べるが SELECT のみ・SECURITY INVOKER（RLSに従う）
-- =====================================================================
create or replace function public.get_leaderboard(p_difficulty text, p_count integer, p_limit integer default 10)
returns table (name text, time_ms integer, created_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (name) name, time_ms, created_at
  from public.scores
  where difficulty = p_difficulty and count = p_count
  order by name, time_ms asc
$$;

-- ↑ DISTINCT ON で名前ごとのベストを出し、外側で時間順に並べ替え＋件数制限
create or replace function public.get_leaderboard(p_difficulty text, p_count integer, p_limit integer default 10)
returns table (name text, time_ms integer, created_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select name, time_ms, created_at
  from (
    select distinct on (name) name, time_ms, created_at
    from public.scores
    where difficulty = p_difficulty and count = p_count
    order by name, time_ms asc
  ) b
  order by time_ms asc
  limit greatest(1, least(p_limit, 100))
$$;

grant execute on function public.get_leaderboard(text, integer, integer) to anon, authenticated;

-- 自己ベスト取得（任意）
create or replace function public.get_best(p_difficulty text, p_count integer, p_name text)
returns integer
language sql stable security invoker set search_path = public
as $$
  select min(time_ms) from public.scores
  where difficulty = p_difficulty and count = p_count and name = p_name
$$;
grant execute on function public.get_best(text, integer, text) to anon, authenticated;
