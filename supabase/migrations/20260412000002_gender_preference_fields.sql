-- ============================================================
-- Gender fields for instructors and students
-- ============================================================

-- Instructor: gender + which student genders they accept
ALTER TABLE public.instructor_profiles
  ADD COLUMN IF NOT EXISTS gender                   TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS accepted_student_genders TEXT NOT NULL DEFAULT 'all'
    CHECK (accepted_student_genders IN ('all', 'female_only', 'male_only'));

-- Student: gender + which instructor genders they prefer
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS gender                      TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS preferred_instructor_gender TEXT NOT NULL DEFAULT 'no_preference'
    CHECK (preferred_instructor_gender IN ('no_preference', 'female_only', 'male_only'));
