-- Table to store email verification codes for OTP flow
CREATE TABLE public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by email
CREATE INDEX idx_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_verification_codes_user_id ON public.email_verification_codes(user_id);

-- Enable RLS (all access is through service_role in edge functions)
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed - edge functions use service_role key which bypasses RLS