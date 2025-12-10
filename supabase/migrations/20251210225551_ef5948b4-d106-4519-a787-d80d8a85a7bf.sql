-- ============================================
-- SEED: Instrutores fictícios para teste do mapa
-- Desabilitando temporariamente FK constraints
-- ============================================

-- Remover FK constraint temporariamente
ALTER TABLE instructor_profiles DROP CONSTRAINT IF EXISTS instructor_profiles_user_id_fkey;

-- Criar função para seed
CREATE OR REPLACE FUNCTION seed_mock_instructors()
RETURNS void AS $$
DECLARE
  v_bios TEXT[] := ARRAY[
    'Instrutor experiente com mais de 10 anos formando condutores.',
    'Paciente e atenciosa, especializada em alunos ansiosos.',
    'Autoescola com frota moderna e instrutores qualificados.',
    'Instrutor certificado pelo DETRAN com metodologia própria.',
    'Especialista em habilitação categoria A e B.',
    'Aulas personalizadas de acordo com o ritmo do aluno.',
    'Foco em direção defensiva e preparação para exame.',
    'Instrutor calmo e paciente. Excelente avaliação.'
  ];
BEGIN
  -- São Paulo - Centro (5 instrutores)
  FOR i IN 1..5 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      random() < 0.2,
      CASE WHEN random() < 0.2 THEN 'Autoescola Centro SP' ELSE NULL END,
      v_bios[1 + (i % 8)],
      3 + floor(random() * 15)::int,
      'approved', TRUE, 'São Paulo', 'SP',
      -23.5505 + (random() * 0.02 - 0.01),
      -46.6333 + (random() * 0.02 - 0.01),
      3.5 + (random() * 1.5),
      5 + floor(random() * 200)::int,
      random() < 0.4,
      '01000-000', 'Rua Centro ' || i, 'Centro'
    );
  END LOOP;

  -- São Paulo - Pinheiros (4 instrutores)
  FOR i IN 1..4 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      FALSE, NULL,
      v_bios[1 + (i % 8)],
      5 + floor(random() * 10)::int,
      'approved', TRUE, 'São Paulo', 'SP',
      -23.5629 + (random() * 0.02 - 0.01),
      -46.6825 + (random() * 0.02 - 0.01),
      4.0 + (random() * 1.0),
      10 + floor(random() * 150)::int,
      random() < 0.5,
      '05400-000', 'Rua Pinheiros ' || i, 'Pinheiros'
    );
  END LOOP;

  -- São Paulo - Moema (3 instrutores)
  FOR i IN 1..3 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      random() < 0.3, CASE WHEN random() < 0.3 THEN 'Autoescola Moema' ELSE NULL END,
      v_bios[1 + (i % 8)],
      8 + floor(random() * 12)::int,
      'approved', TRUE, 'São Paulo', 'SP',
      -23.5973 + (random() * 0.02 - 0.01),
      -46.6658 + (random() * 0.02 - 0.01),
      4.2 + (random() * 0.8),
      20 + floor(random() * 100)::int,
      random() < 0.3,
      '04077-000', 'Av Moema ' || i, 'Moema'
    );
  END LOOP;

  -- Rio de Janeiro (4 instrutores)
  FOR i IN 1..4 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      FALSE, NULL,
      'Instrutor experiente na região do Rio de Janeiro.',
      5 + floor(random() * 10)::int,
      'approved', TRUE, 'Rio de Janeiro', 'RJ',
      -22.9068 + (random() * 0.03 - 0.015),
      -43.1729 + (random() * 0.03 - 0.015),
      4.0 + (random() * 1.0),
      15 + floor(random() * 80)::int,
      random() < 0.4,
      '20000-000', 'Rua Rio ' || i, 'Centro'
    );
  END LOOP;

  -- Belo Horizonte (3 instrutores)
  FOR i IN 1..3 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      FALSE, NULL,
      'Instrutor experiente em Belo Horizonte.',
      4 + floor(random() * 8)::int,
      'approved', TRUE, 'Belo Horizonte', 'MG',
      -19.9191 + (random() * 0.03 - 0.015),
      -43.9386 + (random() * 0.03 - 0.015),
      4.0 + (random() * 1.0),
      10 + floor(random() * 60)::int,
      random() < 0.3,
      '30000-000', 'Rua BH ' || i, 'Savassi'
    );
  END LOOP;

  -- Curitiba (3 instrutores)
  FOR i IN 1..3 LOOP
    INSERT INTO instructor_profiles (
      user_id, cpf, is_driving_school, business_name, bio, experience_years,
      verification_status, is_active, city, state, latitude, longitude,
      average_rating, total_reviews, is_online, zipcode, street, neighborhood
    ) VALUES (
      gen_random_uuid(),
      lpad((floor(random() * 100000000000)::bigint)::text, 11, '0'),
      FALSE, NULL,
      'Instrutor experiente em Curitiba.',
      3 + floor(random() * 10)::int,
      'approved', TRUE, 'Curitiba', 'PR',
      -25.4284 + (random() * 0.03 - 0.015),
      -49.2733 + (random() * 0.03 - 0.015),
      4.1 + (random() * 0.9),
      8 + floor(random() * 50)::int,
      random() < 0.35,
      '80000-000', 'Rua CWB ' || i, 'Centro'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar o seed
SELECT seed_mock_instructors();

-- Limpar função
DROP FUNCTION seed_mock_instructors();

-- Recriar FK constraint (permitindo valores NULL ou órfãos para dados de teste)
-- NOTA: Em produção, você vai querer manter essa constraint. Para testes, deixamos sem.
-- ALTER TABLE instructor_profiles ADD CONSTRAINT instructor_profiles_user_id_fkey 
--   FOREIGN KEY (user_id) REFERENCES profiles(id);