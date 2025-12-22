-- 1. Limpar dados órfãos que não têm correspondência em profiles
DELETE FROM instructor_specialties WHERE instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM instructor_availability WHERE instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM pricing WHERE instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM vehicles WHERE instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM service_areas WHERE instructor_id IN (
  SELECT id FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles)
);

DELETE FROM instructor_profiles WHERE user_id NOT IN (SELECT id FROM profiles);

-- 2. Adicionar foreign key entre instructor_profiles.user_id e profiles.id
ALTER TABLE public.instructor_profiles 
ADD CONSTRAINT instructor_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;