-- Im Supabase SQL Editor einmalig ausführen.
-- Nicht öffentlich erreichbar: Row Level Security blockiert anonyme Zugriffe.
create table if not exists public.bidbattle_store (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.bidbattle_store enable row level security;
-- Absichtlich keine Policies: Ausschließlich der Backend-Service-Role-Key
-- darf über den Server lesen und schreiben. Niemals den Schlüssel in GitHub speichern.
