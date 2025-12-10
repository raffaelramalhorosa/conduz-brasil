-- Tabela de TRANSAÇÕES
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  booking_id UUID UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'class_payment',
    'refund',
    'bonus',
    'penalty'
  )),
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'available',
    'withdrawn',
    'refunded',
    'cancelled'
  )),
  
  description TEXT,
  
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  available_date TIMESTAMP WITH TIME ZONE,
  withdrawn_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de SAQUES
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  
  amount DECIMAL(10,2) NOT NULL,
  
  bank_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )),
  
  receipt_url TEXT,
  failure_reason TEXT,
  
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de CONFIGURAÇÕES BANCÁRIAS
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID UNIQUE NOT NULL REFERENCES public.instructor_profiles(id) ON DELETE CASCADE,
  
  bank_name TEXT NOT NULL,
  bank_code TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  agency TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_digit TEXT,
  account_holder TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  
  is_default BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_transactions_instructor ON public.transactions(instructor_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_withdrawals_instructor ON public.withdrawals(instructor_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Policies para transactions
CREATE POLICY "Instrutor vê próprias transações"
  ON public.transactions FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para withdrawals
CREATE POLICY "Instrutor vê próprios saques"
  ON public.withdrawals FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode criar saques"
  ON public.withdrawals FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar próprios saques"
  ON public.withdrawals FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policies para bank_accounts
CREATE POLICY "Instrutor vê própria conta bancária"
  ON public.bank_accounts FOR SELECT
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode criar conta bancária"
  ON public.bank_accounts FOR INSERT
  WITH CHECK (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Instrutor pode atualizar conta bancária"
  ON public.bank_accounts FOR UPDATE
  USING (
    instructor_id IN (
      SELECT id FROM public.instructor_profiles WHERE user_id = auth.uid()
    )
  );

-- Função para criar transação após aula completed
CREATE OR REPLACE FUNCTION public.create_transaction_after_class()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.transactions (
      booking_id,
      instructor_id,
      student_id,
      gross_amount,
      platform_fee,
      net_amount,
      transaction_type,
      status,
      available_date,
      description
    ) VALUES (
      NEW.id,
      NEW.instructor_id,
      NEW.student_id,
      NEW.total_price,
      NEW.platform_fee,
      NEW.instructor_amount,
      'class_payment',
      'available',
      NOW() + INTERVAL '1 day',
      'Pagamento de aula - ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY')
    );
    
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    SELECT 
      user_id,
      'payment_received',
      'Pagamento Disponível',
      'Você recebeu R$ ' || NEW.instructor_amount || ' por uma aula concluída!',
      '/admin/financeiro'
    FROM public.instructor_profiles
    WHERE id = NEW.instructor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_transaction_trigger
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_transaction_after_class();

-- Trigger para updated_at
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();