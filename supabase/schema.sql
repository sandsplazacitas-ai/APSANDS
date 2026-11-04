-- Sands Plaza Spa · esquema de Supabase. Ejecutar completo en: SQL Editor > New query > Run

create table if not exists app_state (
  id text primary key,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  role text not null default 'Operario' check (role in ('Administrador','Vendedor','Operario'))
);

-- Crea el perfil automáticamente al crear un usuario (rol inicial: Operario)
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, nombre) values (new.id, new.email) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function is_admin() returns boolean language sql security definer stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'Administrador')
$$;

alter table app_state enable row level security;
alter table profiles enable row level security;

drop policy if exists "estado: leer" on app_state;
drop policy if exists "estado: crear" on app_state;
drop policy if exists "estado: editar" on app_state;
create policy "estado: leer" on app_state for select to authenticated using (true);
create policy "estado: crear" on app_state for insert to authenticated with check (true);
create policy "estado: editar" on app_state for update to authenticated using (true) with check (true);

drop policy if exists "perfil: ver propio" on profiles;
drop policy if exists "perfil: admin ve todo" on profiles;
drop policy if exists "perfil: admin edita" on profiles;
create policy "perfil: ver propio" on profiles for select to authenticated using (id = auth.uid());
create policy "perfil: admin ve todo" on profiles for select to authenticated using (is_admin());
create policy "perfil: admin edita" on profiles for update to authenticated using (is_admin());

-- Actualizaciones en tiempo real entre equipos
alter publication supabase_realtime add table app_state;

-- Vistas en formato de tabla para análisis (Excel, Power BI, Looker Studio)
create or replace view v_clientes with (security_invoker = true) as
select c->>'n' as nombre, c->>'a' as apellido, c->>'t' as telefono, c->>'d' as registro
from app_state a, jsonb_array_elements((a.data->>'json')::jsonb->'clients') c where a.id = 'main';

create or replace view v_ventas with (security_invoker = true) as
select s->>'d' as fecha, s->>'c' as cliente, s->>'v' as vendedor, s->>'pay' as pago,
       l->>'n' as detalle, (l->>'q')::int as cantidad, (l->>'p')::numeric as precio,
       coalesce((l->>'dc')::numeric,0) as descuento_pct, l->>'o' as atendido_por,
       coalesce(s->>'cp','') as cupon, (s->'fact' is not null and s->>'fact' <> 'null') as factura
from app_state a, jsonb_array_elements((a.data->>'json')::jsonb->'sales') s, jsonb_array_elements(s->'lines') l
where a.id = 'main';

create or replace view v_citas with (security_invoker = true) as
select x->>'d' as fecha, x->>'h' as hora, x->>'s' as servicio, x->>'st' as estado, x->>'pk' as sesion_paquete
from app_state a, jsonb_array_elements((a.data->>'json')::jsonb->'appts') x where a.id = 'main';

-- DESPUÉS de crear tu primer usuario (Authentication > Users > Add user), hazlo Administrador:
-- update profiles set role = 'Administrador' where nombre = 'tu-correo@ejemplo.com';
