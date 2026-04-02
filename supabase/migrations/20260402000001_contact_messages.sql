create table contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  type text not null default 'contact', -- 'contact' | 'support'
  status text not null default 'pending', -- 'pending' | 'replied' | 'resolved'
  created_at timestamptz default now()
);

alter table contact_messages enable row level security;

-- Qualquer visitante (anon) pode enviar uma mensagem
create policy "Anyone can insert contact messages"
  on contact_messages for insert
  with check (true);

-- Somente system-admin pode ler mensagens
create policy "Admins can view contact messages"
  on contact_messages for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );

-- Somente system-admin pode atualizar status
create policy "Admins can update contact messages"
  on contact_messages for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.user_type = 'admin'
    )
  );
