-- Las funciones internas salen del esquema expuesto por la API.
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

alter function public.es_miembro() set schema privado;
alter function public.solo_miembros_registro() set schema privado;

-- Primer miembro autorizado (en el proyecto real se usó el correo del administrador):
-- insert into public.miembros (email) values ('administrador@empresa.com') on conflict do nothing;
