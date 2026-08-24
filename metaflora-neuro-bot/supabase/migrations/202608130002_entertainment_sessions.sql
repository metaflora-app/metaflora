create table if not exists neuro.entertainment_sessions (
  telegram_user_id text not null check (telegram_user_id ~ '^[1-9][0-9]{0,19}$'),
  session_id text not null check (session_id ~ '^[a-z0-9][a-z0-9:_-]{0,127}$'),
  scenario_id text not null check (scenario_id ~ '^ent_[a-z0-9_]{1,120}$'),
  version integer not null default 1 check (version between 1 and 1000),
  step integer not null default 0 check (step between 0 and 10000),
  status text not null default 'active' check (status in ('active','completed','cancelled','expired')),
  charged boolean not null default false,
  cost integer not null default 0 check (cost between 0 and 1000000),
  media_counts jsonb not null default '{"image":0,"video":0,"audio":0}'::jsonb,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 100000),
  last_transition_key text,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (telegram_user_id, session_id)
);

create index if not exists entertainment_sessions_active_user_idx
  on neuro.entertainment_sessions (telegram_user_id, updated_at desc)
  where status = 'active';
create index if not exists entertainment_sessions_expiry_idx
  on neuro.entertainment_sessions (expires_at);

alter table neuro.entertainment_sessions enable row level security;
revoke all on neuro.entertainment_sessions from anon, authenticated;
grant select, insert, update, delete on neuro.entertainment_sessions to service_role;

create or replace function neuro.save_entertainment_session(
  p_telegram_user_id text, p_session_id text, p_scenario_id text, p_version integer,
  p_step integer, p_status text, p_charged boolean, p_cost integer,
  p_media_counts jsonb, p_state jsonb, p_transition_key text default null,
  p_expected_revision integer default null, p_expires_at timestamptz default null
) returns neuro.entertainment_sessions
language plpgsql security definer set search_path = neuro, pg_temp as $$
declare current_row neuro.entertainment_sessions; saved neuro.entertainment_sessions;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select * into current_row from neuro.entertainment_sessions
    where telegram_user_id = p_telegram_user_id and session_id = p_session_id for update;
  if found and p_transition_key is not null and current_row.last_transition_key = p_transition_key then return current_row; end if;
  if p_expected_revision is not null and p_expected_revision <> coalesce(current_row.revision, 0) then
    raise exception 'entertainment session revision conflict' using errcode = '40001';
  end if;
  insert into neuro.entertainment_sessions as sessions
    (telegram_user_id,session_id,scenario_id,version,step,status,charged,cost,media_counts,state,last_transition_key,revision,updated_at,expires_at)
  values (p_telegram_user_id,p_session_id,p_scenario_id,p_version,p_step,p_status,p_charged,p_cost,p_media_counts,p_state,p_transition_key,1,now(),coalesce(p_expires_at,now()+interval '24 hours'))
  on conflict (telegram_user_id,session_id) do update set
    scenario_id=excluded.scenario_id, version=excluded.version, step=excluded.step,
    status=excluded.status, charged=excluded.charged, cost=excluded.cost,
    media_counts=excluded.media_counts, state=excluded.state,
    last_transition_key=excluded.last_transition_key, revision=sessions.revision+1,
    updated_at=now(), expires_at=excluded.expires_at
  returning * into saved;
  return saved;
end $$;
revoke all on function neuro.save_entertainment_session(text,text,text,integer,integer,text,boolean,integer,jsonb,jsonb,text,integer,timestamptz) from public, anon, authenticated;
grant execute on function neuro.save_entertainment_session(text,text,text,integer,integer,text,boolean,integer,jsonb,jsonb,text,integer,timestamptz) to service_role;
