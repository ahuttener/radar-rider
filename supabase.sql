-- RADAR RIDER: execute no SQL Editor de um projeto Supabase novo.
create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text not null default 'Rider' check(char_length(display_name)<=40),role text not null default 'user' check(role in('user','moderator','admin')),reputation_score integer not null default 0,created_at timestamptz not null default now());
create table if not exists public.alerts(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,category text not null check(category in('intimidacao','roubo','grupo_hostil','via_perigosa','acidente','outro')),description text not null check(char_length(description) between 10 and 500),occurred_at timestamptz not null,is_ongoing boolean not null default false,latitude_private double precision not null check(latitude_private between -90 and 90),longitude_private double precision not null check(longitude_private between -180 and 180),latitude_public double precision not null check(latitude_public between -90 and 90),longitude_public double precision not null check(longitude_public between -180 and 180),status text not null default 'active' check(status in('active','hidden','removed','expired')),confirmations_count integer not null default 0 check(confirmations_count>=0),expires_at timestamptz not null,created_at timestamptz not null default now());
create table if not exists public.alert_confirmations(id uuid primary key default gen_random_uuid(),alert_id uuid not null references public.alerts(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,distance_metres integer not null check(distance_metres between 0 and 2000),created_at timestamptz not null default now(),unique(alert_id,user_id));
create table if not exists public.alert_reports(id uuid primary key default gen_random_uuid(),alert_id uuid not null references public.alerts(id) on delete cascade,reported_by uuid not null references public.profiles(id) on delete cascade,reason text not null check(reason in('identificacao','falso','odio','privacidade','outro')),details text check(char_length(details)<=300),status text not null default 'open' check(status in('open','reviewing','resolved','dismissed')),created_at timestamptz not null default now(),unique(alert_id,reported_by));
create table if not exists public.moderation_actions(id uuid primary key default gen_random_uuid(),alert_id uuid references public.alerts(id) on delete set null,moderator_id uuid not null references public.profiles(id),action text not null,notes text check(char_length(notes)<=500),created_at timestamptz not null default now());
create table if not exists public.account_deletion_requests(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,email text not null,status text not null default 'open' check(status in('open','completed','cancelled')),created_at timestamptz not null default now(),unique(user_id,status));
create index if not exists alerts_active_location_idx on public.alerts(status,expires_at,latitude_public,longitude_public);
create index if not exists reports_status_idx on public.alert_reports(status,created_at desc);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1))) on conflict(id) do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.increment_confirmation() returns trigger language plpgsql security definer set search_path=public as $$ begin update public.alerts set confirmations_count=confirmations_count+1 where id=new.alert_id; update public.profiles set reputation_score=reputation_score+1 where id=new.user_id; return new; end $$;
drop trigger if exists on_confirmation_created on public.alert_confirmations;create trigger on_confirmation_created after insert on public.alert_confirmations for each row execute procedure public.increment_confirmation();
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in('moderator','admin')) $$;

alter table public.profiles enable row level security;alter table public.alerts enable row level security;alter table public.alert_confirmations enable row level security;alter table public.alert_reports enable row level security;alter table public.moderation_actions enable row level security;alter table public.account_deletion_requests enable row level security;
create policy "profiles public safe read" on public.profiles for select using(true);create policy "profile own update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=(select role from public.profiles p where p.id=auth.uid()));
create policy "active alerts public read" on public.alerts for select using((status='active' and expires_at>now()) or user_id=auth.uid() or public.is_staff());create policy "authenticated create alert" on public.alerts for insert to authenticated with check(user_id=auth.uid());create policy "owner update alert" on public.alerts for update to authenticated using(user_id=auth.uid() or public.is_staff()) with check(user_id=auth.uid() or public.is_staff());create policy "staff delete alert" on public.alerts for delete to authenticated using(public.is_staff());
create policy "confirmations readable" on public.alert_confirmations for select using(true);create policy "nearby user confirms" on public.alert_confirmations for insert to authenticated with check(user_id=auth.uid() and distance_metres<=2000);
create policy "own reports or staff read" on public.alert_reports for select to authenticated using(reported_by=auth.uid() or public.is_staff());create policy "authenticated report" on public.alert_reports for insert to authenticated with check(reported_by=auth.uid());create policy "staff update reports" on public.alert_reports for update to authenticated using(public.is_staff()) with check(public.is_staff());
create policy "staff moderation read" on public.moderation_actions for select to authenticated using(public.is_staff());create policy "staff moderation insert" on public.moderation_actions for insert to authenticated with check(public.is_staff() and moderator_id=auth.uid());
create policy "own deletion request" on public.account_deletion_requests for insert to authenticated with check(user_id=auth.uid());create policy "own or staff deletion read" on public.account_deletion_requests for select to authenticated using(user_id=auth.uid() or public.is_staff());create policy "staff deletion update" on public.account_deletion_requests for update to authenticated using(public.is_staff()) with check(public.is_staff());

grant usage on schema public to anon,authenticated;grant select on public.profiles,public.alerts,public.alert_confirmations to anon,authenticated;grant insert,update on public.alerts to authenticated;grant insert on public.alert_confirmations,public.alert_reports,public.account_deletion_requests to authenticated;grant select,update on public.alert_reports,public.account_deletion_requests to authenticated;grant select,insert on public.moderation_actions to authenticated;
alter publication supabase_realtime add table public.alerts;
-- Depois do primeiro cadastro, torne sua conta admin substituindo o e-mail:
-- update public.profiles set role='admin' where id=(select id from auth.users where email='SEU_EMAIL');

-- =========================================================
-- PATCH DE SEGURANÇA (Radar Rider) — executar junto do script
-- =========================================================
-- 1) Privacidade em nível de coluna: ninguém lê coordenada exata nem autor via API
revoke select on public.alerts from anon, authenticated;
grant select (id,category,description,occurred_at,is_ongoing,latitude_public,longitude_public,status,confirmations_count,expires_at,created_at)
  on public.alerts to anon, authenticated;

revoke select on public.alert_confirmations from anon, authenticated;
grant select (id,alert_id,created_at) on public.alert_confirmations to anon, authenticated;

-- Moderação: staff acessa a coordenada exata só por função auditável
create or replace function public.staff_alert_location(aid uuid)
returns table(latitude_private double precision, longitude_private double precision)
language sql stable security definer set search_path=public as $$
  select latitude_private, longitude_private from public.alerts
  where id = aid and public.is_staff()
$$;

-- 2) Limite de criação: máx. 3 alertas por usuário a cada 10 minutos
create or replace function public.limit_alert_rate() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from public.alerts
      where user_id = new.user_id and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'Limite de alertas atingido. Aguarde alguns minutos antes de publicar novamente.';
  end if;
  return new;
end $$;
drop trigger if exists on_alert_rate_limit on public.alerts;
create trigger on_alert_rate_limit before insert on public.alerts
  for each row execute procedure public.limit_alert_rate();

-- 3) Teto de expiração no banco (não confiar só no front): máx. 24h
alter table public.alerts drop constraint if exists alerts_expiry_window;
alter table public.alerts add constraint alerts_expiry_window
  check (expires_at > created_at and expires_at <= created_at + interval '24 hours');

-- =========================================================
-- PATCH 2 — Irlanda + Reino Unido, e faxina automática
-- =========================================================
-- NOTA SOBRE PERMISSÃO DE ADMIN
-- Este projeto NÃO usa uma coluna is_admin. Quem é staff é definido por
-- profiles.role ('user' | 'moderator' | 'admin') e lido pela função is_staff(),
-- que é de onde TODAS as políticas de RLS acima tiram a decisão.
-- Criar um is_admin separado abriria uma segunda fonte de verdade: o painel
-- acharia que a pessoa é admin e o banco continuaria negando (ou pior, o contrário).
-- Para promover alguém:
--   update public.profiles set role='admin' where id=(select id from auth.users where email='SEU_EMAIL');

-- 1) País do alerta, para separar Irlanda e Reino Unido no painel e nas unidades
alter table public.alerts add column if not exists country_code text not null default 'IE'
  check (country_code in ('IE','GB'));
create index if not exists alerts_country_idx on public.alerts(country_code,status,created_at desc);

-- O país vem do app (bounding box das coordenadas). É aproximado de propósito:
-- serve para agrupar no painel e escolher km/milhas, não para valer como jurisdição.
grant select (country_code) on public.alerts to anon, authenticated;

-- 2) Faxina: marca como expirado o que já passou do prazo que o AUTOR escolheu.
-- Deliberadamente NÃO é um prazo fixo de 3 horas: o autor escolhe entre 1h e 12h
-- na hora de publicar, e o banco já limita o teto em 24h. Derrubar tudo em 3h
-- apagaria alertas que a pessoa publicou para durar mais.
create or replace function public.auto_expire_alerts() returns integer
language plpgsql security definer set search_path=public as $$
declare affected integer;
begin
  update public.alerts set status='expired'
    where status='active' and expires_at <= now();
  get diagnostics affected = row_count;
  return affected;
end $$;

revoke execute on function public.auto_expire_alerts() from anon, authenticated;

-- Agende no painel do Supabase (Database > Cron) para rodar de 10 em 10 minutos:
--   select cron.schedule('expirar-alertas','*/10 * * * *',$$select public.auto_expire_alerts()$$);
-- Mesmo sem o cron o app continua correto: a RLS já esconde alerta com
-- expires_at vencido. O cron serve para o status no painel bater com a realidade.

-- 2b) Permissão de apagar alerta no painel.
-- A política de RLS "staff delete alert" já existia, mas sem este grant o
-- DELETE morria antes dela, com "permission denied for table alerts".
-- Continua valendo a RLS: quem não é staff segue sem conseguir apagar nada.
grant delete on public.alerts to authenticated;

-- 3) "Meus alertas", para a aba Histórico do app.
-- Precisa ser função porque o patch de segurança tirou alerts.user_id da API:
-- é justamente essa coluna escondida que impede descobrir quem publicou o quê.
-- Aqui o filtro por autor acontece dentro do banco, sem devolver a coluna.
create or replace function public.my_alerts()
returns table(id uuid, category text, description text, is_ongoing boolean,
              latitude_public double precision, longitude_public double precision,
              status text, confirmations_count integer,
              expires_at timestamptz, created_at timestamptz, country_code text)
language sql stable security definer set search_path=public as $$
  select a.id, a.category, a.description, a.is_ongoing,
         a.latitude_public, a.longitude_public, a.status, a.confirmations_count,
         a.expires_at, a.created_at, a.country_code
  from public.alerts a
  where a.user_id = auth.uid()
  order by a.created_at desc
  limit 200
$$;
revoke execute on function public.my_alerts() from anon;

-- 4) Leitura da lista de usuários pelo painel (só staff, sem expor e-mail de ninguém)
create or replace function public.staff_user_list()
returns table(id uuid, display_name text, role text, reputation_score integer,
              created_at timestamptz, alerts_count bigint)
language sql stable security definer set search_path=public as $$
  select p.id, p.display_name, p.role, p.reputation_score, p.created_at,
         (select count(*) from public.alerts a where a.user_id = p.id)
  from public.profiles p
  where public.is_staff()
  order by p.created_at desc
$$;
