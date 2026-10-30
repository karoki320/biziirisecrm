-- ============================================================
-- Biziirise · 0011 · Bizi, the portal guide
--
-- Remembers which guided tours and tips a client has already seen, so the
-- welcome tour shows once — on whichever phone or computer they use first.
-- ============================================================

alter table profiles
  add column if not exists guide_seen text[] not null default '{}';
