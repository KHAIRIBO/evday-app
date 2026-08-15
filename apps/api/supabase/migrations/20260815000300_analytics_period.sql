-- Adds period support (week/month/year) to user_analytics_summary, so the
-- Week/Month/Year segmented control on the home screen actually changes
-- the data instead of just the selected pill. Field names in the returned
-- jsonb stay filesThisWeek/filesDelta/etc. regardless of period — that's
-- inherited from AnalyticsSummary in packages/shared/schema.ts ("this
-- period's count"), not a bug.
drop function if exists user_analytics_summary(uuid);

create or replace function user_analytics_summary(p_user uuid, p_period text default 'week')
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
  v_window interval;
  v_bucket_count int;
  v_bucket_unit text;
  v_files_this_period int;
  v_files_prev_period int;
  v_ai_queries int;
  v_ai_prev_queries int;
  v_activity jsonb;
begin
  if p_period not in ('week', 'month', 'year') then
    p_period := 'week';
  end if;

  if p_period = 'week' then
    v_window := interval '7 days';
    v_bucket_count := 7;
    v_bucket_unit := 'day';
  elsif p_period = 'month' then
    v_window := interval '30 days';
    v_bucket_count := 30;
    v_bucket_unit := 'day';
  else
    v_window := interval '365 days';
    v_bucket_count := 12;
    v_bucket_unit := 'month';
  end if;

  select id, storage_quota into v_profile_id, v_storage_quota
  from public.profiles where user_id = p_user;

  if v_profile_id is null then
    return jsonb_build_object(
      'storageUsed', 0, 'storageQuota', 16106127360, 'breakdown', '[]'::jsonb,
      'filesThisWeek', 0, 'filesDelta', 0, 'aiQueries', 0, 'aiDelta', 0, 'activity', '[]'::jsonb
    );
  end if;

  select coalesce(sum(size), 0) into v_storage_used
  from public.workspace_files where user_id = v_profile_id and is_deleted = false;

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

  select count(*) into v_files_this_period
  from public.workspace_files
  where user_id = v_profile_id and created_at >= now() - v_window;

  select count(*) into v_files_prev_period
  from public.workspace_files
  where user_id = v_profile_id
    and created_at >= now() - (v_window * 2)
    and created_at < now() - v_window;

  select count(*) into v_ai_queries
  from public.ai_messages m
  join public.ai_conversations c on c.id = m.conversation_id
  where c.user_id = v_profile_id and m.role = 'user' and m.created_at >= now() - v_window;

  select count(*) into v_ai_prev_queries
  from public.ai_messages m
  join public.ai_conversations c on c.id = m.conversation_id
  where c.user_id = v_profile_id and m.role = 'user'
    and m.created_at >= now() - (v_window * 2) and m.created_at < now() - v_window;

  if v_bucket_unit = 'day' then
    select coalesce(
      jsonb_agg(jsonb_build_object('date', to_char(d.bucket, 'YYYY-MM-DD'), 'count', coalesce(a.cnt, 0)) order by d.bucket),
      '[]'::jsonb
    ) into v_activity
    from generate_series(current_date - (v_bucket_count - 1) * interval '1 day', current_date, interval '1 day') as d(bucket)
    left join (
      select date_trunc('day', created_at) as bucket, count(*) as cnt
      from public.activity_logs
      where user_id = v_profile_id and created_at >= now() - v_window
      group by 1
    ) a on a.bucket = d.bucket;
  else
    select coalesce(
      jsonb_agg(jsonb_build_object('date', to_char(d.bucket, 'YYYY-MM'), 'count', coalesce(a.cnt, 0)) order by d.bucket),
      '[]'::jsonb
    ) into v_activity
    from generate_series(date_trunc('month', current_date) - (v_bucket_count - 1) * interval '1 month', date_trunc('month', current_date), interval '1 month') as d(bucket)
    left join (
      select date_trunc('month', created_at) as bucket, count(*) as cnt
      from public.activity_logs
      where user_id = v_profile_id and created_at >= now() - v_window
      group by 1
    ) a on a.bucket = d.bucket;
  end if;

  return jsonb_build_object(
    'storageUsed', v_storage_used,
    'storageQuota', v_storage_quota,
    'breakdown', v_breakdown,
    'filesThisWeek', v_files_this_period,
    'filesDelta', v_files_this_period - v_files_prev_period,
    'aiQueries', v_ai_queries,
    'aiDelta', v_ai_queries - v_ai_prev_queries,
    'activity', v_activity
  );
end;
$$;

grant execute on function user_analytics_summary(uuid, text) to service_role;
