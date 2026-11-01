create function public.broadcast_app_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_row jsonb;
  v_record jsonb;
  v_cycle_id uuid;
  v_chat_id uuid;
  v_topic text;
  v_message jsonb;
  v_participant_uid uuid;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_cycle_id := (v_row ->> 'cycle_id')::uuid;

  if tg_table_name = 'posts' then
    v_topic := 'cycle:' || v_cycle_id::text;
    v_record := jsonb_build_object(
      'id', v_row -> 'id', 'cycle_id', v_row -> 'cycle_id',
      'author_profile_id', v_row -> 'author_profile_id',
      'content', v_row -> 'content', 'created_at', v_row -> 'created_at'
    );
  elsif tg_table_name = 'comments' then
    v_topic := 'cycle:' || v_cycle_id::text;
    v_record := jsonb_build_object(
      'id', v_row -> 'id', 'cycle_id', v_row -> 'cycle_id',
      'post_id', v_row -> 'post_id', 'parent_comment_id', v_row -> 'parent_comment_id',
      'author_profile_id', v_row -> 'author_profile_id',
      'content', v_row -> 'content', 'created_at', v_row -> 'created_at'
    );
  elsif tg_table_name = 'reactions' then
    v_topic := 'cycle:' || v_cycle_id::text;
    v_record := jsonb_build_object(
      'id', v_row -> 'id', 'cycle_id', v_row -> 'cycle_id',
      'post_id', v_row -> 'post_id', 'profile_id', v_row -> 'profile_id',
      'type', v_row -> 'type', 'created_at', v_row -> 'created_at'
    );
  elsif tg_table_name = 'chats' then
    v_chat_id := (v_row ->> 'id')::uuid;
    v_topic := 'chat:' || v_chat_id::text;
    v_record := jsonb_build_object(
      'id', v_row -> 'id', 'cycle_id', v_row -> 'cycle_id',
      'participant_a_profile_id', v_row -> 'participant_a_profile_id',
      'participant_b_profile_id', v_row -> 'participant_b_profile_id',
      'updated_at', v_row -> 'updated_at'
    );
  elsif tg_table_name = 'chat_messages' then
    v_chat_id := (v_row ->> 'chat_id')::uuid;
    v_topic := 'chat:' || v_chat_id::text;
    v_record := jsonb_build_object(
      'id', v_row -> 'id', 'cycle_id', v_row -> 'cycle_id',
      'chat_id', v_row -> 'chat_id', 'sender_profile_id', v_row -> 'sender_profile_id',
      'content', v_row -> 'content', 'created_at', v_row -> 'created_at'
    );
  else
    raise exception 'Unsupported Realtime table: %', tg_table_name using errcode = '22023';
  end if;

  v_message := jsonb_build_object(
    'table', tg_table_name,
    'operation', tg_op,
    'record', case when tg_op = 'DELETE' then null else v_record end,
    'old_record', case when tg_op = 'DELETE' then v_record else null end
  );
  perform realtime.send(v_message, 'change', v_topic, true);

  if tg_table_name in ('chats', 'chat_messages') then
    if tg_table_name = 'chats' then
      for v_participant_uid in
        select distinct p.owner_uid
          from public.profiles p
         where p.id in (
           (v_row ->> 'participant_a_profile_id')::uuid,
           (v_row ->> 'participant_b_profile_id')::uuid
         )
           and p.cycle_id = v_cycle_id
      loop
        perform realtime.send(v_message, 'change', 'inbox:' || v_participant_uid::text, true);
      end loop;
    elsif tg_op <> 'DELETE' then
      for v_participant_uid in
        select distinct p.owner_uid
          from public.chats c
          join public.profiles p
            on p.id in (c.participant_a_profile_id, c.participant_b_profile_id)
           and p.cycle_id = c.cycle_id
         where c.id = v_chat_id
      loop
        perform realtime.send(v_message, 'change', 'inbox:' || v_participant_uid::text, true);
      end loop;
    end if;
  end if;

  return null;
end;
$function$;

create trigger posts_broadcast_change
after insert or update or delete on public.posts
for each row execute function public.broadcast_app_change();
create trigger comments_broadcast_change
after insert or update or delete on public.comments
for each row execute function public.broadcast_app_change();
create trigger reactions_broadcast_change
after insert or update or delete on public.reactions
for each row execute function public.broadcast_app_change();
create trigger chats_broadcast_change
after insert or update or delete on public.chats
for each row execute function public.broadcast_app_change();
create trigger chat_messages_broadcast_change
after insert or update or delete on public.chat_messages
for each row execute function public.broadcast_app_change();

create policy restart_active_cycle_broadcast_read
on realtime.messages
for select
to authenticated
using (
  realtime.topic() = 'cycle:' || (
    select cycle.id::text from public.get_active_cycle() as cycle
  )
);

create policy restart_chat_broadcast_read
on realtime.messages
for select
to authenticated
using (
  case
    when realtime.topic() ~ '^chat:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      public.is_chat_participant(substring(realtime.topic() from 6)::uuid)
    else false
  end
);

create policy restart_own_inbox_broadcast_read
on realtime.messages
for select
to authenticated
using (realtime.topic() = 'inbox:' || (select auth.uid())::text);

revoke all on function public.broadcast_app_change() from public, anon, authenticated;
