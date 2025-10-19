-- Activer pg_cron si absent
create extension if not exists pg_cron;

-- Job toutes les 30 min : met INACTIVE si past_due et grâce expirée
select cron.schedule(
  'deactivate_expired_grace',
  '*/30 * * * *',
  $$
    update public.workspaces
       set plan_status = 'inactive'
     where plan_status = 'past_due'
       and grace_until is not null
       and grace_until < now();
  $$
);
