-- ============================================================
-- Biziirise · 0004 · the five starting sequences
-- Copy here is a starting point — it is meant to be edited from the
-- admin panel, not from this file.
-- ============================================================

insert into sequences (key, name, description, trigger_event) values
  ('lead_welcome',      'New lead welcome',        'First touch after someone messages us.',            'lead.created'),
  ('proposal_followup', 'Proposal follow-up',      'Nudges after a proposal has gone out.',             'lead.proposal_sent'),
  ('client_onboarding', 'Client onboarding',       'What happens once they sign.',                      'client.onboarded'),
  ('project_status',    'Project status update',   'Fires whenever a project moves stage.',             'project.status_changed'),
  ('reengagement',      'Cold lead re-engagement', 'Back-of-the-queue leads, checked in on monthly.',   'lead.went_cold')
on conflict (key) do nothing;

insert into sequence_steps (sequence_id, step_order, delay_minutes, channel, subject, body_template, whatsapp_template_name)
select s.id, v.step_order, v.delay_minutes, v.channel::sequence_channel, v.subject, v.body, v.wa_template
from sequences s
join (values
  ('lead_welcome', 1, 0, 'email',
   'Thanks for reaching out to Biziirise',
   E'Hi {{first_name}},\n\nThanks for getting in touch. I have your message and I will come back to you personally today with some honest thoughts on what would actually help.\n\nIf it is easier, just reply on WhatsApp — that is where I am fastest.\n\nEugene\nBiziirise',
   null),
  ('lead_welcome', 2, 2880, 'whatsapp',
   null,
   'Quick check-in on {{first_name}}''s enquiry.',
   'lead_followup_48h'),
  ('proposal_followup', 1, 4320, 'email',
   'Any questions on the proposal?',
   E'Hi {{first_name}},\n\nJust checking whether anything in the proposal needs clarifying. Happy to walk through the scope or adjust it — no pressure either way.\n\nEugene\nBiziirise',
   null),
  ('client_onboarding', 1, 0, 'email',
   'Welcome aboard — here is what happens next',
   E'Hi {{first_name}},\n\nGreat to have you on board. Your client portal is set up: you can upload documents, track the build stage and settle invoices by M-Pesa there.\n\nI will be in touch as soon as we hit the first milestone.\n\nEugene\nBiziirise',
   null),
  ('project_status', 1, 0, 'whatsapp',
   null,
   '{{project_name}} is now at {{status}}.',
   'project_status_update'),
  ('reengagement', 1, 0, 'email',
   'Still thinking about it?',
   E'Hi {{first_name}},\n\nWe spoke a while back about a project. No pressure at all — I just wanted to leave the door open in case the timing is better now.\n\nEugene\nBiziirise',
   null)
) as v(seq_key, step_order, delay_minutes, channel, subject, body, wa_template)
  on v.seq_key = s.key
on conflict (sequence_id, step_order) do nothing;
