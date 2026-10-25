-- Cualquier cambio en servicios o evidencias marca el informe como modificado.
create or replace function privado.tocar_informe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_informe bigint;
begin
  if tg_table_name = 'servicios' then
    v_informe := coalesce(new.informe_id, old.informe_id);
  else
    select s.informe_id into v_informe
    from public.servicios s
    where s.id = coalesce(new.servicio_id, old.servicio_id);
  end if;
  if v_informe is not null then
    update public.informes set updated_at = now() where id = v_informe;
  end if;
  return null;
end;
$$;
revoke all on function privado.tocar_informe() from public, anon, authenticated;

create trigger servicios_tocar_informe
  after insert or update or delete on public.servicios
  for each row execute function privado.tocar_informe();
create trigger evidencias_tocar_informe
  after insert or update or delete on public.evidencias
  for each row execute function privado.tocar_informe();
