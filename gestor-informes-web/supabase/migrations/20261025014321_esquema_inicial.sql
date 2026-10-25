-- Usuarios autorizados: solo estos correos pueden registrarse y ver/modificar datos.
create table public.miembros (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.miembros m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.es_miembro() from public, anon;
grant execute on function public.es_miembro() to authenticated;

-- Impide registrar cuentas con correos no autorizados.
create or replace function public.solo_miembros_registro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.miembros m where m.email = lower(new.email)) then
    raise exception 'El correo % no está autorizado para usar el gestor de informes', new.email;
  end if;
  return new;
end;
$$;
revoke all on function public.solo_miembros_registro() from public, anon, authenticated;
create trigger solo_miembros_registro
  before insert on auth.users
  for each row execute function public.solo_miembros_registro();

-- Consecutivo de actas de entrega (empieza en 1).
create sequence public.acta_consecutivo_seq start with 1 minvalue 1;

create table public.informes (
  id bigint generated always as identity primary key,
  acta_numero bigint not null unique,
  orden_obra text not null,
  actividades text not null,
  justificacion text not null default '',
  ubicacion text not null,
  responsable_nombre text not null,
  responsable_telefono text not null,
  responsable_cargo text not null default '',
  fecha_inicio date not null,
  fecha_fin date not null,
  tipo_validacion text not null default 'visita' check (tipo_validacion in ('visita', 'recibido')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- El consecutivo siempre lo asigna la base de datos y no se puede modificar.
create or replace function public.informes_consecutivo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.acta_numero := nextval('public.acta_consecutivo_seq');
  else
    new.acta_numero := old.acta_numero;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger informes_consecutivo
  before insert or update on public.informes
  for each row execute function public.informes_consecutivo();

create table public.servicios (
  id bigint generated always as identity primary key,
  informe_id bigint not null references public.informes (id) on delete cascade,
  nombre text not null,
  posicion integer not null,
  created_at timestamptz not null default now()
);
create index servicios_informe_id_idx on public.servicios (informe_id);

create table public.evidencias (
  id bigint generated always as identity primary key,
  servicio_id bigint not null references public.servicios (id) on delete cascade,
  nombre text not null,
  storage_path text not null unique,
  width integer not null,
  height integer not null,
  original_name text not null default '',
  created_at timestamptz not null default now()
);
create index evidencias_servicio_id_idx on public.evidencias (servicio_id);

-- Seguridad: todo el equipo autorizado comparte los informes.
alter table public.miembros enable row level security;
alter table public.informes enable row level security;
alter table public.servicios enable row level security;
alter table public.evidencias enable row level security;

create policy "miembros ven la lista de miembros" on public.miembros
  for select to authenticated using ((select public.es_miembro()));

create policy "miembros gestionan informes" on public.informes
  for all to authenticated using ((select public.es_miembro())) with check ((select public.es_miembro()));
create policy "miembros gestionan servicios" on public.servicios
  for all to authenticated using ((select public.es_miembro())) with check ((select public.es_miembro()));
create policy "miembros gestionan evidencias" on public.evidencias
  for all to authenticated using ((select public.es_miembro())) with check ((select public.es_miembro()));

grant usage, select on sequence public.acta_consecutivo_seq to authenticated;

-- Fotos de evidencias: bucket privado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 10485760, array['image/jpeg']);

create policy "miembros leen evidencias" on storage.objects
  for select to authenticated using (bucket_id = 'evidencias' and (select public.es_miembro()));
create policy "miembros suben evidencias" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidencias' and (select public.es_miembro()));
create policy "miembros actualizan evidencias" on storage.objects
  for update to authenticated using (bucket_id = 'evidencias' and (select public.es_miembro()));
create policy "miembros borran evidencias" on storage.objects
  for delete to authenticated using (bucket_id = 'evidencias' and (select public.es_miembro()));

-- Cambios en vivo entre dispositivos.
alter publication supabase_realtime add table public.informes, public.servicios, public.evidencias;
