CREATE OR REPLACE FUNCTION public.create_transaction_after_class()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

    -- Only create transactions if payment was confirmed
    IF NEW.payment_status != 'paid' THEN
      RAISE LOG 'Skipping transaction creation for booking % — payment_status is %', NEW.id, NEW.payment_status;
      RETURN NEW;
    END IF;

    -- 1) Transação do INSTRUTOR
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions WHERE booking_id = NEW.id AND transaction_type = 'class_payment'
    ) THEN
      INSERT INTO public.transactions (
        booking_id, instructor_id, student_id, gross_amount, platform_fee, gateway_fee,
        net_amount, transaction_type, status, available_date, description
      ) VALUES (
        NEW.id, NEW.instructor_id, NEW.student_id, NEW.total_price, NEW.platform_fee, 0,
        NEW.instructor_amount, 'class_payment', 'pending', NOW() + INTERVAL '30 days',
        'Pagamento de aula - ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY')
      );
    END IF;

    -- 2) Transação da AUTOESCOLA (comissão)
    IF NEW.is_affiliated_booking = TRUE
       AND NEW.driving_school_id IS NOT NULL
       AND COALESCE(NEW.school_fee, 0) > 0
    THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.transactions WHERE booking_id = NEW.id AND transaction_type = 'school_commission'
      ) THEN
        INSERT INTO public.transactions (
          booking_id, driving_school_id, student_id, gross_amount, platform_fee, gateway_fee,
          net_amount, transaction_type, status, available_date, description
        ) VALUES (
          NEW.id, NEW.driving_school_id, NEW.student_id, NEW.school_fee, 0, 0,
          NEW.school_fee, 'school_commission', 'pending', NOW() + INTERVAL '30 days',
          'Comissão de aula filiada - ' || TO_CHAR(NEW.scheduled_date, 'DD/MM/YYYY')
        );
      END IF;
    END IF;

    -- 3) Notificar instrutor
    INSERT INTO public.notifications (user_id, type, title, message, action_url)
    SELECT ip.user_id, 'payment_received', 'Pagamento Registrado',
      'R$ ' || NEW.instructor_amount || ' registrado. Disponível para saque em 30 dias.',
      '/admin/financeiro'
    FROM public.instructor_profiles ip WHERE ip.id = NEW.instructor_id;

  END IF;
  RETURN NEW;
END;
$$;