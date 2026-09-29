-- ============================================================
-- Biziirise · 0006 · Lead qualifiers for the /get-started form
--
-- The Facebook ad for the Website + POS + tablet + printer system sends
-- people to /get-started. Those leads need more than a name and a phone:
-- what kind of business, where, how many branches, whether they already
-- sell online — the things that decide what you quote.
--
-- These are columns on the EXISTING `leads` table, not a second table.
-- One pipeline, one inbox: a WhatsApp lead, a website lead and an ad lead
-- all land in the same place in the CRM and are worked the same way.
-- ============================================================

alter table leads
  add column if not exists business_name text,
  add column if not exists business_type text,
  add column if not exists location      text,
  add column if not exists branches      text,
  add column if not exists sells_online  boolean,
  add column if not exists utm_source    text,
  add column if not exists utm_campaign  text;

comment on column leads.business_type is 'Shop, Minimart/Supermarket, Pharmacy, Boutique, Hardware, Restaurant/Cafe, Salon/Barber, Other';
comment on column leads.branches     is '1, 2-3 or 4+ — kept as text because it is a bracket, not a count';
comment on column leads.utm_source   is 'Which ad or channel sent them, straight from the URL';

-- Find the ad leads fast when a campaign is running.
create index if not exists leads_utm_idx on leads (utm_source, created_at desc);

-- ------------------------------------------------------------
-- Row Level Security stays exactly as it was: admin only, for
-- everything. The public form does NOT insert from the browser.
--
-- Anyone who can read the page can read the anon key, so a public
-- insert policy is a public write endpoint: a bot could fill the
-- pipeline with rubbish, and rows would arrive unvalidated. The form
-- posts to a server action instead, which checks the honeypot,
-- validates every field, normalises the phone number and only then
-- writes with the service-role key — server-side, where the key
-- never reaches a browser.
--
-- Same outcome as "public can insert, never read", with the
-- validation kept and the open endpoint removed.
-- ------------------------------------------------------------
