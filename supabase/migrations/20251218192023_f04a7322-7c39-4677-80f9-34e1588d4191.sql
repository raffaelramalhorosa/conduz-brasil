
-- ============================================
-- UNIQUE CONSTRAINT FOR SPECIALTIES
-- ============================================
ALTER TABLE instructor_specialties 
ADD CONSTRAINT instructor_specialties_unique UNIQUE (instructor_id, specialty);

-- ============================================
-- FUNÇÃO PARA CRIAR INSTRUTOR COMPLETO
-- ============================================
CREATE OR REPLACE FUNCTION create_mock_instructor_complete(
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_cpf TEXT,
  p_is_driving_school BOOLEAN,
  p_business_name TEXT,
  p_bio TEXT,
  p_experience_years INTEGER,
  p_city TEXT,
  p_state TEXT,
  p_neighborhood TEXT,
  p_street TEXT,
  p_number TEXT,
  p_zipcode TEXT,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_average_rating DECIMAL,
  p_total_reviews INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_instructor_id UUID;
BEGIN
  v_user_id := gen_random_uuid();
  
  INSERT INTO profiles (id, email, full_name, phone, user_type, avatar_url)
  VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_phone,
    CASE WHEN p_is_driving_school THEN 'driving_school' ELSE 'instructor' END,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || p_email
  );
  
  INSERT INTO instructor_profiles (
    user_id, cpf, is_driving_school, business_name, bio, experience_years,
    verification_status, is_active, city, state, neighborhood, street, number,
    zipcode, latitude, longitude, average_rating, total_reviews, acceptance_rate,
    total_classes, cnh_number, instructor_license
  ) VALUES (
    v_user_id, p_cpf, p_is_driving_school, p_business_name, p_bio, p_experience_years,
    'approved', TRUE, p_city, p_state, p_neighborhood, p_street, p_number,
    p_zipcode, p_latitude, p_longitude, p_average_rating, p_total_reviews,
    ROUND(85 + (RANDOM() * 15))::DECIMAL(5,2),
    FLOOR(RANDOM() * 200 + 50)::INTEGER,
    (10000000000 + FLOOR(RANDOM() * 90000000000)::BIGINT)::TEXT,
    'DETRAN-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
  )
  RETURNING id INTO v_instructor_id;
  
  RETURN v_instructor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO PARA LIMPAR DADOS MOCKUP
-- ============================================
CREATE OR REPLACE FUNCTION clear_mock_data()
RETURNS void AS $$
BEGIN
  DELETE FROM instructor_specialties WHERE instructor_id IN (
    SELECT id FROM instructor_profiles WHERE verification_status = 'approved'
  );
  DELETE FROM instructor_availability WHERE instructor_id IN (
    SELECT id FROM instructor_profiles WHERE verification_status = 'approved'
  );
  DELETE FROM pricing WHERE instructor_id IN (
    SELECT id FROM instructor_profiles WHERE verification_status = 'approved'
  );
  DELETE FROM vehicles WHERE instructor_id IN (
    SELECT id FROM instructor_profiles WHERE verification_status = 'approved'
  );
  DELETE FROM instructor_profiles WHERE verification_status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO RPC PARA SEED DE INSTRUTORES
-- ============================================
CREATE OR REPLACE FUNCTION seed_mock_instructors(p_quantity INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  v_instructor_id UUID;
  v_vehicle_id UUID;
  v_names TEXT[] := ARRAY[
    'Carlos Eduardo Silva', 'Ana Paula Santos', 'Roberto Almeida Costa',
    'Juliana Ferreira Lima', 'Fernando Oliveira Souza', 'Patricia Lima Rodrigues',
    'Ricardo Santos Pereira', 'Mariana Costa Alves', 'João Pedro Martins',
    'Camila Rodrigues Silva', 'Bruno Henrique Santos', 'Larissa Mendes Costa',
    'Diego Santos Oliveira', 'Tatiana Alves Lima', 'Lucas Pereira Silva',
    'Fernanda Ribeiro Costa', 'Gustavo Carvalho Santos', 'Amanda Silva Souza',
    'Rafael Gomes Oliveira', 'Beatriz Costa Lima', 'Thiago Martins Silva',
    'Vanessa Santos Alves', 'Rodrigo Lima Costa', 'Gabriela Ferreira Santos',
    'Marcelo Souza Lima', 'Priscila Alves Costa', 'Eduardo Santos Silva',
    'Carolina Lima Ferreira', 'Anderson Costa Rodrigues', 'Natalia Silva Santos'
  ];
  v_bios TEXT[] := ARRAY[
    'Instrutor experiente com mais de 10 anos formando condutores. Especialista em alunos de primeira habilitação com metodologia própria para reduzir ansiedade.',
    'Paciente e atenciosa, especializada em alunos ansiosos e terceira idade. Foco em direção defensiva e segurança.',
    'Autoescola tradicional com 20 anos no mercado. Frota moderna e instrutores qualificados para todas as categorias.',
    'Instrutor certificado pelo DETRAN com didática diferenciada. Resultados comprovados: 95% de aprovação no primeiro exame.',
    'Especialista em habilitação categoria A. Motos de diferentes cilindradas e equipamento de segurança completo.',
    'Aulas personalizadas de acordo com o ritmo do aluno. Horários flexíveis, incluindo finais de semana.',
    'Instrutor bilíngue (Português/Inglês). Atendo estrangeiros e brasileiros que preferem aulas em inglês.',
    'Foco em direção defensiva e preparação completa para o exame prático do DETRAN.',
    'Instrutor calmo e paciente, especializado em alunos com dificuldades de aprendizagem.',
    'Metodologia exclusiva para alunos ansiosos. Ambiente acolhedor e respeitoso.'
  ];
  v_specialties TEXT[] := ARRAY['first_license', 'renewal', 'anxious_students', 'elderly', 'english_classes', 'defensive_driving', 'night_classes'];
  v_neighborhoods TEXT[] := ARRAY['Centro', 'Pinheiros', 'Vila Madalena', 'Moema', 'Tatuapé', 'Santana', 'Vila Mariana', 'Santo Amaro', 'Lapa', 'Itaquera', 'Consolação', 'Perdizes'];
  v_name TEXT;
  v_bio TEXT;
  v_is_school BOOLEAN;
  v_rating DECIMAL;
  v_reviews INTEGER;
  v_experience INTEGER;
  v_lat DECIMAL;
  v_lng DECIMAL;
  v_neighborhood TEXT;
  v_num_specialties INTEGER;
  v_num_vehicles INTEGER;
  v_day INTEGER;
  v_price DECIMAL;
  v_transmission TEXT;
  v_vehicle_type TEXT;
  v_created_count INTEGER := 0;
BEGIN
  FOR i IN 1..p_quantity LOOP
    v_name := v_names[1 + floor(random() * array_length(v_names, 1))];
    v_bio := v_bios[1 + floor(random() * array_length(v_bios, 1))];
    v_is_school := random() < 0.25;
    v_rating := ROUND((3.5 + (random() * 1.5))::DECIMAL, 1);
    v_reviews := 10 + floor(random() * 300);
    v_experience := 2 + floor(random() * 18);
    v_neighborhood := v_neighborhoods[1 + floor(random() * array_length(v_neighborhoods, 1))];
    v_lat := -23.55 + (random() * 0.15 - 0.075);
    v_lng := -46.65 + (random() * 0.2 - 0.1);
    
    v_instructor_id := create_mock_instructor_complete(
      lower(replace(v_name, ' ', '.')) || floor(random() * 10000)::text || '@autoconect.test',
      v_name,
      '+55 11 9' || (5000 + floor(random() * 4999))::text || '-' || (1000 + floor(random() * 8999))::text,
      LPAD(floor(random() * 100000000000)::text, 11, '0'),
      v_is_school,
      CASE WHEN v_is_school THEN 'Auto Escola ' || split_part(v_name, ' ', 1) ELSE NULL END,
      v_bio,
      v_experience,
      'São Paulo',
      'SP',
      v_neighborhood,
      'Rua ' || chr(65 + floor(random() * 26)::int) || ' de Janeiro',
      (100 + floor(random() * 900))::text,
      LPAD((1000 + floor(random() * 9000))::text, 5, '0') || '-000',
      v_lat,
      v_lng,
      v_rating,
      v_reviews
    );
    
    -- Especialidades (2-4)
    v_num_specialties := 2 + floor(random() * 3)::int;
    FOR j IN 1..v_num_specialties LOOP
      INSERT INTO instructor_specialties (instructor_id, specialty)
      VALUES (v_instructor_id, v_specialties[1 + floor(random() * array_length(v_specialties, 1))])
      ON CONFLICT (instructor_id, specialty) DO NOTHING;
    END LOOP;
    
    -- Disponibilidade
    FOR v_day IN 1..5 LOOP
      IF random() < 0.8 THEN
        IF random() < 0.6 THEN
          INSERT INTO instructor_availability (instructor_id, day_of_week, start_time, end_time, is_available)
          VALUES (v_instructor_id, v_day, '08:00', '12:00', TRUE);
        END IF;
        IF random() < 0.9 THEN
          INSERT INTO instructor_availability (instructor_id, day_of_week, start_time, end_time, is_available)
          VALUES (v_instructor_id, v_day, '14:00', '18:00', TRUE);
        END IF;
        IF random() < 0.4 THEN
          INSERT INTO instructor_availability (instructor_id, day_of_week, start_time, end_time, is_available)
          VALUES (v_instructor_id, v_day, '19:00', '22:00', TRUE);
        END IF;
      END IF;
    END LOOP;
    IF random() < 0.7 THEN
      INSERT INTO instructor_availability (instructor_id, day_of_week, start_time, end_time, is_available)
      VALUES (v_instructor_id, 6, '08:00', '14:00', TRUE);
    END IF;
    
    -- Veículos (1-4)
    v_num_vehicles := CASE WHEN v_is_school THEN 2 + floor(random() * 3)::int ELSE 1 + floor(random() * 2)::int END;
    FOR j IN 1..v_num_vehicles LOOP
      v_transmission := (ARRAY['manual', 'automatic'])[1 + floor(random() * 2)];
      v_vehicle_type := (ARRAY['car', 'car', 'car', 'motorcycle'])[1 + floor(random() * 4)];
      
      INSERT INTO vehicles (
        instructor_id, brand, model, year, license_plate, color, vehicle_type,
        license_category, transmission, has_air_conditioning, has_power_steering,
        is_adapted, main_photo_url, is_active
      ) VALUES (
        v_instructor_id,
        (ARRAY['Honda', 'Toyota', 'Volkswagen', 'Chevrolet', 'Fiat', 'Hyundai'])[1 + floor(random() * 6)],
        (ARRAY['Civic', 'Corolla', 'Gol', 'Onix', 'Argo', 'HB20', 'Polo', 'Sandero'])[1 + floor(random() * 8)],
        2018 + floor(random() * 7)::int,
        chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int) ||
        floor(random() * 10)::text || chr(65 + floor(random() * 26)::int) || (10 + floor(random() * 90))::text,
        (ARRAY['Branco', 'Prata', 'Preto', 'Cinza', 'Vermelho'])[1 + floor(random() * 5)],
        v_vehicle_type,
        CASE WHEN v_vehicle_type = 'motorcycle' THEN 'A' ELSE 'B' END,
        v_transmission,
        random() < 0.75,
        random() < 0.85,
        random() < 0.05,
        CASE WHEN v_vehicle_type = 'motorcycle' 
          THEN 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400'
          ELSE 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400'
        END,
        TRUE
      ) RETURNING id INTO v_vehicle_id;
      
      v_price := CASE
        WHEN v_vehicle_type = 'motorcycle' THEN 80 + floor(random() * 60)
        WHEN v_transmission = 'automatic' THEN 120 + floor(random() * 80)
        ELSE 90 + floor(random() * 70)
      END;
      
      INSERT INTO pricing (
        instructor_id, vehicle_id, license_category, single_class_price,
        package_5_price, package_10_price, package_20_price, is_active
      ) VALUES (
        v_instructor_id,
        v_vehicle_id,
        CASE WHEN v_vehicle_type = 'motorcycle' THEN 'A' ELSE 'B' END,
        v_price,
        v_price * 5 * 0.95,
        v_price * 10 * 0.90,
        v_price * 20 * 0.85,
        TRUE
      );
    END LOOP;
    
    v_created_count := v_created_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'created', v_created_count,
    'message', v_created_count || ' instrutores criados com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
