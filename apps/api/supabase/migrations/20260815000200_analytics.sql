-- user_analytics_summary(p_user uuid) — powers GET /api/analytics/summary.
-- p_user is auth.users.id (the JWT `sub`, i.e. requireUser(req).id), same
-- as every other RPC/query in this app. Returns jsonb shaped exactly like
-- packages/shared/schema.ts's AnalyticsSummary so the route can
-- AnalyticsSummary.parse(data) directly against it.
create or replace function user_analytics_summary(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_storage_used bigint;
  v_storage_quota bigint;
  v_breakdown jsonb;
  v_files_this_week int;
  v_files_prev_week int;
  v_ai_queries int;
  v_ai_prev_queries int;
  v_activity jsonb;
begin
  select id, storage_quota into v_profile_id, v_storage_quota
  from public.profiles where user_id = p_user;

  if v_profile_id is null then
    return jsonb_build_object(
      'storageUsed', 0, 'storageQuota', 16106127360, 'breakdown', '[]'::jsonb,
      'filesThisWeek', 0, 'filesDelta', 0, 'aiQueries', 0, 'aiDelta', 0, 'activity', '[]'::jsonb
    );
  end if;

  select coalesce(sum(size), 0) into v_storage_used
  from public.workspace_files
  where user_id = v_profile_id and is_deleted = false;

  select coalesce(jsonb_agg(jsonb_build_object('kind', kind, 'bytes', bytes)), '[]'::jsonb) into v_breakdown
  from (
    select
      case
        when mime_type like 'image/%' then 'image'
        when mime_type like 'video/%' then 'video'
        when mime_type = 'application/pdf'
             or mime_type like 'application/vnd.%'
             or mime_type in ('text/plain', 'application/msword') then 'document'
        else 'other'
      end as kind,
      sum(size) as bytes
    from public.workspace_files
    where user_id = v_profile_id and is_deleted = false
    group by 1
  ) b;

  select count(*) into v_files_this_week
  from public.workspace_files
  where user_id = v_profile_id and created_at >= now() - interval '7 days';

  select count(*) into v_files_prev_week
  from public.workspace_files
  where user_id = v_profile_id
    and created_at >= now() - interval '14 days'
    and created_at < now() - interval '7 days';

  select count(*) into v_ai_queries
  from public.ai_messages m
  join public.ai_conversations c on c.id = m.conversation_id
  where c.user_id = v_profile_id and m.role = 'user' and m.created_at >= now() - interval '7 days';

  select count(*) into v_ai_prev_queries
  from public.ai_messages m
  join public.ai_conversations c on c.id = m.conversation_id
  where c.user_id = v_profile_id and m.role = 'user'
    and m.created_at >= now() - interval '14 days' and m.created_at < now() - interval '7 days';

  select coalesce(
    jsonb_agg(jsonb_build_object('date', to_char(d.day, 'YYYY-MM-DD'), 'count', coalesce(a.cnt, 0)) order by d.day),
    '[]'::jsonb
  ) into v_activity
  from generate_series(current_date - interval '6 days', current_date, interval '1 day') as d(day)
  left join (
    select date_trunc('day', created_at) as day, count(*) as cnt
    from public.activity_logs
    where user_id = v_profile_id and created_at >= now() - interval '7 days'
    group by 1
  ) a on a.day = d.day;

  return jsonb_build_object(
    'storageUsed', v_storage_used,
    'storageQuota', v_storage_quota,
    'breakdown', v_breakdown,
    'filesThisWeek', v_files_this_week,
    'filesDelta', v_files_this_week - v_files_prev_week,
    'aiQueries', v_ai_queries,
    'aiDelta', v_ai_queries - v_ai_prev_queries,
    'activity', v_activity
  );
end;
$$;

grant execute on function user_analytics_summary(uuid) to service_role;
