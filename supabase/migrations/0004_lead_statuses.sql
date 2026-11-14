-- Lead pipeline becomes Warm -> Hot -> Visited -> Booked, with Cold and Lost as exits.
alter table public.leads drop constraint leads_stage_check;

update public.leads set stage = case stage
  when 'new' then 'warm'
  when 'contacted' then 'warm'
  when 'negotiation' then 'hot'
  when 'site_visit' then 'visited'
  when 'closed' then 'booked'
  else stage end;

alter table public.leads alter column stage set default 'warm';
alter table public.leads add constraint leads_stage_check
  check (stage in ('warm', 'hot', 'visited', 'booked', 'cold', 'lost'));
