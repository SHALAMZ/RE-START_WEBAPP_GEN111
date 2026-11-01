create extension if not exists pg_cron with schema pg_catalog;

create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint cycles_expiry_after_start check (expires_at > started_at)
);

create function public.set_cycle_expiry()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.expires_at := new.started_at + interval '48 hours';
  return new;
end;
$function$;

create trigger cycles_set_expiry
before insert or update of started_at, expires_at on public.cycles
for each row execute function public.set_cycle_expiry();

insert into public.cycles (started_at)
values (clock_timestamp());

create table public.cycle_control (
  singleton boolean primary key default true check (singleton),
  active_cycle_id uuid not null references public.cycles(id) on delete restrict,
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.cycle_control (singleton, active_cycle_id)
select true, id from public.cycles order by created_at desc limit 1;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 1 and 20),
  avatar_key text not null check (avatar_key in (
    'avatar1', 'avatar2', 'avatar3', 'avatar4',
    'avatar5', 'avatar6', 'avatar7', 'avatar8'
  )),
  is_current boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, cycle_id)
);

create unique index profiles_one_current_per_owner_cycle
  on public.profiles (cycle_id, owner_uid)
  where is_current;
create index profiles_cycle_nickname_idx on public.profiles (cycle_id, nickname);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  author_profile_id uuid not null,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, cycle_id),
  constraint posts_author_profile_cycle_fk
    foreign key (author_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade
);

create index posts_cycle_created_idx on public.posts (cycle_id, created_at desc);
create index posts_author_created_idx on public.posts (author_profile_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  post_id uuid not null,
  parent_comment_id uuid,
  author_profile_id uuid not null,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default clock_timestamp(),
  unique (id, post_id),
  constraint comments_post_cycle_fk
    foreign key (post_id, cycle_id)
    references public.posts(id, cycle_id) on delete cascade,
  constraint comments_author_profile_cycle_fk
    foreign key (author_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint comments_parent_same_post_fk
    foreign key (parent_comment_id, post_id)
    references public.comments(id, post_id) on delete cascade
);

create index comments_post_created_idx on public.comments (post_id, created_at);
create index comments_parent_idx on public.comments (parent_comment_id) where parent_comment_id is not null;
create index comments_author_created_idx on public.comments (author_profile_id, created_at desc);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  post_id uuid not null,
  profile_id uuid not null,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('❤️', '🌱', '✨', '🤍')),
  created_at timestamptz not null default clock_timestamp(),
  constraint reactions_post_cycle_fk
    foreign key (post_id, cycle_id)
    references public.posts(id, cycle_id) on delete cascade,
  constraint reactions_profile_cycle_fk
    foreign key (profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint reactions_one_type_per_owner_post unique (post_id, owner_uid, type)
);

create index reactions_post_idx on public.reactions (post_id);
create index reactions_profile_idx on public.reactions (profile_id, cycle_id);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  participant_a_profile_id uuid not null,
  participant_b_profile_id uuid not null,
  updated_at timestamptz not null default clock_timestamp(),
  constraint chats_participants_are_canonical
    check (participant_a_profile_id < participant_b_profile_id),
  constraint chats_participant_a_cycle_fk
    foreign key (participant_a_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint chats_participant_b_cycle_fk
    foreign key (participant_b_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint chats_id_cycle_unique unique (id, cycle_id),
  constraint chats_one_pair_per_cycle
    unique (cycle_id, participant_a_profile_id, participant_b_profile_id)
);

create index chats_cycle_updated_idx on public.chats (cycle_id, updated_at desc);
create index chats_participant_a_idx on public.chats (participant_a_profile_id, updated_at desc);
create index chats_participant_b_idx on public.chats (participant_b_profile_id, updated_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  chat_id uuid not null,
  sender_profile_id uuid not null,
  owner_uid uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  constraint chat_messages_chat_cycle_fk
    foreign key (chat_id, cycle_id)
    references public.chats(id, cycle_id) on delete cascade,
  constraint chat_messages_sender_cycle_fk
    foreign key (sender_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade
);

create index chat_messages_chat_created_idx on public.chat_messages (chat_id, created_at);
create index chat_messages_sender_created_idx on public.chat_messages (sender_profile_id, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id) on delete cascade,
  reporter_profile_id uuid not null,
  reporter_uid uuid not null references auth.users(id) on delete cascade,
  target_post_id uuid,
  target_profile_id uuid,
  target_chat_id uuid,
  target_type text generated always as (
    case
      when target_post_id is not null then 'post'
      when target_profile_id is not null then 'profile'
      when target_chat_id is not null then 'chat'
    end
  ) stored,
  target_id uuid generated always as (
    coalesce(target_post_id, target_profile_id, target_chat_id)
  ) stored,
  category text not null check (category in ('harassment', 'spam', 'personal_info', 'other')),
  reason text not null check (char_length(btrim(reason)) between 1 and 1000),
  created_at timestamptz not null default clock_timestamp(),
  constraint reports_one_target check (
    num_nonnulls(target_post_id, target_profile_id, target_chat_id) = 1
  ),
  constraint reports_reporter_cycle_fk
    foreign key (reporter_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint reports_post_cycle_fk
    foreign key (target_post_id, cycle_id)
    references public.posts(id, cycle_id) on delete cascade,
  constraint reports_profile_cycle_fk
    foreign key (target_profile_id, cycle_id)
    references public.profiles(id, cycle_id) on delete cascade,
  constraint reports_chat_cycle_fk
    foreign key (target_chat_id, cycle_id)
    references public.chats(id, cycle_id) on delete cascade
);

create unique index reports_prevent_duplicate_submission
  on public.reports (cycle_id, reporter_uid, target_type, target_id, category);
create index reports_cycle_created_idx on public.reports (cycle_id, created_at desc);

create function public.ensure_active_cycle()
returns table (id uuid, started_at timestamptz, expires_at timestamptz, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_new_cycle_id uuid;
  v_now timestamptz;
begin
  select cc.active_cycle_id
    into v_cycle_id
    from public.cycle_control as cc
   where cc.singleton
   for update;

  if not found then
    raise exception 'Cycle control is not initialized' using errcode = '55000';
  end if;

  v_now := clock_timestamp();
  if not exists (
    select 1 from public.cycles as c
     where c.id = v_cycle_id and c.expires_at > v_now
  ) then
    insert into public.cycles (started_at) values (v_now)
      returning public.cycles.id into v_new_cycle_id;

    update public.cycle_control
       set active_cycle_id = v_new_cycle_id,
           updated_at = v_now
     where singleton;

    delete from public.cycles where public.cycles.id = v_cycle_id;
    v_cycle_id := v_new_cycle_id;
  end if;

  return query
    select c.id, c.started_at, c.expires_at, c.created_at
      from public.cycles as c
     where c.id = v_cycle_id;
end;
$function$;

create function public.is_active_cycle(p_cycle_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $function$
  select exists (
    select 1
      from public.cycle_control as cc
      join public.cycles as c on c.id = cc.active_cycle_id
     where cc.singleton
       and c.id = p_cycle_id
       and c.expires_at > clock_timestamp()
  );
$function$;

create function public.get_active_cycle()
returns table (
  id uuid,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  server_now timestamptz
)
language sql
volatile
security definer
set search_path = ''
as $function$
  select active.id, active.started_at, active.expires_at, active.created_at, clock_timestamp()
    from public.ensure_active_cycle() as active;
$function$;

create function public.current_profile()
returns table (
  id uuid,
  cycle_id uuid,
  nickname text,
  avatar_key text,
  is_current boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  return query
    select p.id, p.cycle_id, p.nickname, p.avatar_key, p.is_current, p.created_at, p.updated_at
      from public.profiles as p
     where p.owner_uid = auth.uid()
       and p.cycle_id = v_cycle_id
       and p.is_current
     limit 1;
end;
$function$;

create function public.create_or_reset_profile(p_nickname text, p_avatar_key text)
returns table (
  id uuid,
  cycle_id uuid,
  nickname text,
  avatar_key text,
  is_current boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise exception 'Anonymous authentication required' using errcode = '28000';
  end if;
  if p_nickname is null or char_length(btrim(p_nickname)) not between 1 and 20 then
    raise exception 'Nickname must be between 1 and 20 characters' using errcode = '22023';
  end if;
  if p_avatar_key is null or p_avatar_key not in ('avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8') then
    raise exception 'Invalid avatar key' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  update public.profiles as p
     set is_current = false, updated_at = clock_timestamp()
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;

  insert into public.profiles (cycle_id, owner_uid, nickname, avatar_key)
  values (v_cycle_id, auth.uid(), btrim(p_nickname), p_avatar_key)
  returning * into v_profile;

  return query select v_profile.id, v_profile.cycle_id, v_profile.nickname,
                      v_profile.avatar_key, v_profile.is_current,
                      v_profile.created_at, v_profile.updated_at;
end;
$function$;

create function public.reset_current_profile()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text, 0));
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  update public.profiles
     set is_current = false, updated_at = clock_timestamp()
   where owner_uid = auth.uid() and cycle_id = v_cycle_id and is_current;
end;
$function$;

create function public.create_post(p_content text)
returns table (id uuid, cycle_id uuid, author_profile_id uuid, content text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_profile_id uuid;
  v_post_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_content is null or char_length(btrim(p_content)) not between 1 and 2000 then
    raise exception 'Post must be between 1 and 2000 characters' using errcode = '22023';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_profile_id from public.profiles as p
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;
  if v_profile_id is null then
    raise exception 'Create a profile before posting' using errcode = '42501';
  end if;

  insert into public.posts (cycle_id, author_profile_id, owner_uid, content)
  values (v_cycle_id, v_profile_id, auth.uid(), btrim(p_content))
  returning public.posts.id into v_post_id;
  return query select p.id, p.cycle_id, p.author_profile_id, p.content, p.created_at
    from public.posts as p where p.id = v_post_id;
end;
$function$;

create function public.delete_post(p_post_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  delete from public.posts as p
   where p.id = p_post_id and p.cycle_id = v_cycle_id and p.owner_uid = auth.uid();
  if not found then
    raise exception 'Post not found or not owned by the current user' using errcode = '42501';
  end if;
end;
$function$;

create function public.create_comment(p_post_id uuid, p_content text, p_parent_comment_id uuid default null)
returns table (id uuid, cycle_id uuid, post_id uuid, parent_comment_id uuid, author_profile_id uuid, content text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_profile_id uuid;
  v_comment_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_content is null or char_length(btrim(p_content)) not between 1 and 1000 then
    raise exception 'Comment must be between 1 and 1000 characters' using errcode = '22023';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_profile_id from public.profiles as p
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;
  if v_profile_id is null then
    raise exception 'Create a profile before commenting' using errcode = '42501';
  end if;
  if not exists (select 1 from public.posts p where p.id = p_post_id and p.cycle_id = v_cycle_id) then
    raise exception 'Post is unavailable' using errcode = 'P0002';
  end if;
  if p_parent_comment_id is not null and not exists (
    select 1 from public.comments c
     where c.id = p_parent_comment_id and c.post_id = p_post_id and c.cycle_id = v_cycle_id
  ) then
    raise exception 'Parent comment does not belong to this post' using errcode = '23503';
  end if;

  insert into public.comments (cycle_id, post_id, parent_comment_id, author_profile_id, owner_uid, content)
  values (v_cycle_id, p_post_id, p_parent_comment_id, v_profile_id, auth.uid(), btrim(p_content))
  returning public.comments.id into v_comment_id;
  return query select c.id, c.cycle_id, c.post_id, c.parent_comment_id,
                      c.author_profile_id, c.content, c.created_at
    from public.comments c where c.id = v_comment_id;
end;
$function$;

create function public.delete_comment(p_comment_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  delete from public.comments c
   where c.id = p_comment_id and c.cycle_id = v_cycle_id and c.owner_uid = auth.uid();
  if not found then
    raise exception 'Comment not found or not owned by the current user' using errcode = '42501';
  end if;
end;
$function$;

create function public.toggle_reaction(p_post_id uuid, p_type text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_profile_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_type is null or p_type not in ('❤️', '🌱', '✨', '🤍') then
    raise exception 'Invalid reaction type' using errcode = '22023';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_profile_id from public.profiles p
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;
  if v_profile_id is null then
    raise exception 'Create a profile before reacting' using errcode = '42501';
  end if;
  if not exists (select 1 from public.posts p where p.id = p_post_id and p.cycle_id = v_cycle_id) then
    raise exception 'Post is unavailable' using errcode = 'P0002';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(auth.uid()::text || ':' || p_post_id::text || ':' || p_type, 0)
  );
  delete from public.reactions r
   where r.post_id = p_post_id and r.owner_uid = auth.uid() and r.type = p_type;
  if found then
    return false;
  end if;
  insert into public.reactions (cycle_id, post_id, profile_id, owner_uid, type)
  values (v_cycle_id, p_post_id, v_profile_id, auth.uid(), p_type);
  return true;
end;
$function$;

create function public.create_or_get_chat(p_target_profile_id uuid)
returns table (id uuid, cycle_id uuid, participant_a_profile_id uuid, participant_b_profile_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_my_profile_id uuid;
  v_low_profile_id uuid;
  v_high_profile_id uuid;
  v_chat_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_my_profile_id from public.profiles p
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;
  if v_my_profile_id is null then
    raise exception 'Create a profile before starting a chat' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = p_target_profile_id and p.cycle_id = v_cycle_id) then
    raise exception 'Profile is unavailable' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.profiles p where p.id = p_target_profile_id and p.owner_uid = auth.uid()) then
    raise exception 'Cannot start a chat with yourself' using errcode = '22023';
  end if;
  v_low_profile_id := least(v_my_profile_id, p_target_profile_id);
  v_high_profile_id := greatest(v_my_profile_id, p_target_profile_id);

  insert into public.chats (cycle_id, participant_a_profile_id, participant_b_profile_id)
  values (v_cycle_id, v_low_profile_id, v_high_profile_id)
  on conflict on constraint chats_one_pair_per_cycle do nothing
  returning public.chats.id into v_chat_id;
  if v_chat_id is null then
    select c.id into v_chat_id from public.chats c
     where c.cycle_id = v_cycle_id
       and c.participant_a_profile_id = v_low_profile_id
       and c.participant_b_profile_id = v_high_profile_id;
  end if;
  return query select c.id, c.cycle_id, c.participant_a_profile_id,
                      c.participant_b_profile_id, c.updated_at
    from public.chats c where c.id = v_chat_id;
end;
$function$;

create function public.is_chat_participant(p_chat_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $function$
  select auth.uid() is not null and exists (
    select 1
      from public.chats c
      join public.profiles p
        on p.id in (c.participant_a_profile_id, c.participant_b_profile_id)
       and p.cycle_id = c.cycle_id
     where c.id = p_chat_id
       and p.owner_uid = auth.uid()
       and public.is_active_cycle(c.cycle_id)
  );
$function$;

create function public.send_chat_message(p_chat_id uuid, p_content text)
returns table (id uuid, cycle_id uuid, chat_id uuid, sender_profile_id uuid, content text, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_sender_profile_id uuid;
  v_message_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_content is null or char_length(btrim(p_content)) not between 1 and 2000 then
    raise exception 'Message must be between 1 and 2000 characters' using errcode = '22023';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_sender_profile_id
    from public.chats c
    join public.profiles p
      on p.id in (c.participant_a_profile_id, c.participant_b_profile_id)
     and p.cycle_id = c.cycle_id
   where c.id = p_chat_id and c.cycle_id = v_cycle_id and p.owner_uid = auth.uid()
   limit 1;
  if v_sender_profile_id is null then
    raise exception 'Chat not found or user is not a participant' using errcode = '42501';
  end if;
  insert into public.chat_messages (cycle_id, chat_id, sender_profile_id, owner_uid, content)
  values (v_cycle_id, p_chat_id, v_sender_profile_id, auth.uid(), btrim(p_content))
  returning public.chat_messages.id into v_message_id;
  update public.chats as c
     set updated_at = clock_timestamp()
   where c.id = p_chat_id;
  return query select m.id, m.cycle_id, m.chat_id, m.sender_profile_id, m.content, m.created_at
    from public.chat_messages m where m.id = v_message_id;
end;
$function$;

create function public.end_chat(p_chat_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  delete from public.chats c
   where c.id = p_chat_id and c.cycle_id = v_cycle_id
     and exists (
       select 1 from public.profiles p
        where p.id in (c.participant_a_profile_id, c.participant_b_profile_id)
          and p.cycle_id = c.cycle_id and p.owner_uid = auth.uid()
     );
  if not found then
    raise exception 'Chat not found or user is not a participant' using errcode = '42501';
  end if;
end;
$function$;

create function public.submit_report(
  p_target_type text,
  p_target_id uuid,
  p_category text,
  p_reason text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $function$
declare
  v_cycle_id uuid;
  v_profile_id uuid;
  v_report_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_target_type is null or p_target_type not in ('post', 'profile', 'chat')
     or p_category is null or p_category not in ('harassment', 'spam', 'personal_info', 'other')
     or p_reason is null or char_length(btrim(p_reason)) not between 1 and 1000 then
    raise exception 'Invalid report details' using errcode = '22023';
  end if;
  select active.id into v_cycle_id from public.ensure_active_cycle() as active;
  select p.id into v_profile_id from public.profiles p
   where p.owner_uid = auth.uid() and p.cycle_id = v_cycle_id and p.is_current;
  if v_profile_id is null then
    raise exception 'Create a profile before reporting' using errcode = '42501';
  end if;

  if p_target_type = 'post' and not exists (
    select 1 from public.posts p where p.id = p_target_id and p.cycle_id = v_cycle_id
  ) then
    raise exception 'Post is unavailable' using errcode = 'P0002';
  elsif p_target_type = 'profile' and not exists (
    select 1 from public.profiles p where p.id = p_target_id and p.cycle_id = v_cycle_id and p.owner_uid <> auth.uid()
  ) then
    raise exception 'Profile is unavailable' using errcode = 'P0002';
  elsif p_target_type = 'chat' and not exists (
    select 1 from public.chats c where c.id = p_target_id and c.cycle_id = v_cycle_id
      and public.is_chat_participant(c.id)
  ) then
    raise exception 'Chat is unavailable' using errcode = 'P0002';
  end if;

  insert into public.reports (
    cycle_id, reporter_profile_id, reporter_uid,
    target_post_id, target_profile_id, target_chat_id, category, reason
  )
  values (
    v_cycle_id, v_profile_id, auth.uid(),
    case when p_target_type = 'post' then p_target_id end,
    case when p_target_type = 'profile' then p_target_id end,
    case when p_target_type = 'chat' then p_target_id end,
    p_category, btrim(p_reason)
  )
  on conflict (cycle_id, reporter_uid, target_type, target_id, category) do nothing
  returning public.reports.id into v_report_id;

  if v_report_id is null then
    raise exception 'This report has already been submitted' using errcode = '23505';
  end if;
  return v_report_id;
end;
$function$;

create function public.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$function$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_profile_updated_at();

alter table public.cycles enable row level security;
alter table public.cycle_control enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reports enable row level security;

create policy cycles_read_active on public.cycles
  for select to authenticated using (public.is_active_cycle(id));

create policy profiles_read_active on public.profiles
  for select to authenticated using (public.is_active_cycle(cycle_id));
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (
    owner_uid = (select auth.uid())
    and exists (select 1 from public.ensure_active_cycle() c where c.id = cycle_id)
  );
create policy profiles_update_self on public.profiles
  for update to authenticated using (owner_uid = (select auth.uid()))
  with check (owner_uid = (select auth.uid()));

create policy posts_read_active on public.posts
  for select to authenticated using (public.is_active_cycle(cycle_id));
create policy posts_insert_self on public.posts
  for insert to authenticated with check (
    owner_uid = (select auth.uid())
    and exists (
      select 1 from public.profiles p
       where p.id = author_profile_id and p.cycle_id = posts.cycle_id
         and p.owner_uid = (select auth.uid()) and p.is_current
    )
    and public.is_active_cycle(cycle_id)
  );
create policy posts_delete_self on public.posts
  for delete to authenticated using (
    owner_uid = (select auth.uid()) and public.is_active_cycle(cycle_id)
  );

create policy comments_read_active on public.comments
  for select to authenticated using (public.is_active_cycle(cycle_id));
create policy comments_insert_self on public.comments
  for insert to authenticated with check (
    owner_uid = (select auth.uid())
    and exists (
      select 1 from public.profiles p
       where p.id = author_profile_id and p.cycle_id = comments.cycle_id
         and p.owner_uid = (select auth.uid()) and p.is_current
    )
    and public.is_active_cycle(cycle_id)
  );
create policy comments_delete_self on public.comments
  for delete to authenticated using (
    owner_uid = (select auth.uid()) and public.is_active_cycle(cycle_id)
  );

create policy reactions_read_active on public.reactions
  for select to authenticated using (public.is_active_cycle(cycle_id));
create policy reactions_insert_self on public.reactions
  for insert to authenticated with check (
    owner_uid = (select auth.uid())
    and exists (
      select 1 from public.profiles p
       where p.id = profile_id and p.cycle_id = reactions.cycle_id
         and p.owner_uid = (select auth.uid()) and p.is_current
    )
    and public.is_active_cycle(cycle_id)
  );
create policy reactions_delete_self on public.reactions
  for delete to authenticated using (
    owner_uid = (select auth.uid()) and public.is_active_cycle(cycle_id)
  );

create policy chats_read_participant on public.chats
  for select to authenticated using (
    public.is_active_cycle(cycle_id) and public.is_chat_participant(id)
  );
create policy chat_messages_read_participant on public.chat_messages
  for select to authenticated using (
    public.is_active_cycle(cycle_id) and public.is_chat_participant(chat_id)
  );
create policy chat_messages_insert_participant on public.chat_messages
  for insert to authenticated with check (
    owner_uid = (select auth.uid())
    and public.is_active_cycle(cycle_id)
    and public.is_chat_participant(chat_id)
  );

create policy reports_insert_self on public.reports
  for insert to authenticated with check (reporter_uid = (select auth.uid()));

revoke all on public.cycles, public.cycle_control, public.profiles, public.posts,
  public.comments, public.reactions, public.chats, public.chat_messages, public.reports
  from public, anon, authenticated;

grant select (id, started_at, expires_at, created_at) on public.cycles to authenticated;
grant select (id, cycle_id, nickname, avatar_key, is_current, created_at, updated_at)
  on public.profiles to authenticated;
grant select (id, cycle_id, author_profile_id, content, created_at)
  on public.posts to authenticated;
grant select (id, cycle_id, post_id, parent_comment_id, author_profile_id, content, created_at)
  on public.comments to authenticated;
grant select (id, cycle_id, post_id, profile_id, type, created_at)
  on public.reactions to authenticated;
grant select (id, cycle_id, participant_a_profile_id, participant_b_profile_id, updated_at)
  on public.chats to authenticated;
grant select (id, cycle_id, chat_id, sender_profile_id, content, created_at)
  on public.chat_messages to authenticated;

revoke all on function public.ensure_active_cycle() from public, anon;
revoke all on function public.is_active_cycle(uuid) from public, anon;
revoke all on function public.get_active_cycle() from public, anon;
revoke all on function public.current_profile() from public, anon;
revoke all on function public.create_or_reset_profile(text, text) from public, anon;
revoke all on function public.reset_current_profile() from public, anon;
revoke all on function public.create_post(text) from public, anon;
revoke all on function public.delete_post(uuid) from public, anon;
revoke all on function public.create_comment(uuid, text, uuid) from public, anon;
revoke all on function public.delete_comment(uuid) from public, anon;
revoke all on function public.toggle_reaction(uuid, text) from public, anon;
revoke all on function public.create_or_get_chat(uuid) from public, anon;
revoke all on function public.is_chat_participant(uuid) from public, anon;
revoke all on function public.send_chat_message(uuid, text) from public, anon;
revoke all on function public.end_chat(uuid) from public, anon;
revoke all on function public.submit_report(text, uuid, text, text) from public, anon;
revoke all on function public.touch_profile_updated_at() from public, anon, authenticated;
revoke all on function public.set_cycle_expiry() from public, anon, authenticated;

grant execute on function public.ensure_active_cycle() to authenticated;
grant execute on function public.is_active_cycle(uuid) to authenticated;
grant execute on function public.get_active_cycle() to authenticated;
grant execute on function public.current_profile() to authenticated;
grant execute on function public.create_or_reset_profile(text, text) to authenticated;
grant execute on function public.reset_current_profile() to authenticated;
grant execute on function public.create_post(text) to authenticated;
grant execute on function public.delete_post(uuid) to authenticated;
grant execute on function public.create_comment(uuid, text, uuid) to authenticated;
grant execute on function public.delete_comment(uuid) to authenticated;
grant execute on function public.toggle_reaction(uuid, text) to authenticated;
grant execute on function public.create_or_get_chat(uuid) to authenticated;
grant execute on function public.is_chat_participant(uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
grant execute on function public.end_chat(uuid) to authenticated;
grant execute on function public.submit_report(text, uuid, text, text) to authenticated;

do $migration$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'restart-cycle-cleanup'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
  perform cron.schedule(
    'restart-cycle-cleanup',
    '* * * * *',
    'select public.ensure_active_cycle();'
  );
end;
$migration$;
