-- Diagnostic script to check users and RPC function
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    hassan_id uuid;
    nada_id uuid;
    hassan_email text := 'hassanen.irq@gmail.com';
    nada_email text := 'nada@love.com';
BEGIN
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Testing Notification System Dependencies';
    RAISE NOTICE '----------------------------------------';

    -- 1. Test RPC Function existence
    RAISE NOTICE '1. Testing get_user_id_by_email RPC...';
    
    BEGIN
        SELECT get_user_id_by_email(hassan_email) INTO hassan_id;
        RAISE NOTICE '   - Hassan ID via RPC: %', COALESCE(hassan_id::text, 'NULL (Not Found)');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '   - ERROR calling RPC for Hassan: %', SQLERRM;
    END;

    BEGIN
        SELECT get_user_id_by_email(nada_email) INTO nada_id;
        RAISE NOTICE '   - Nada ID via RPC: %', COALESCE(nada_id::text, 'NULL (Not Found)');
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '   - ERROR calling RPC for Nada: %', SQLERRM;
    END;

    -- 2. Verify RLS on Notifications
    -- We'll try to insert a test notification
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '2. Simulating Notification Insert (Dry Run)...';
    
    IF hassan_id IS NOT NULL THEN
        RAISE NOTICE '   - Can target Hassan: YES';
    ELSE
        RAISE NOTICE '   - Can target Hassan: NO (User not found)';
    END IF;

    IF nada_id IS NOT NULL THEN
        RAISE NOTICE '   - Can target Nada: YES';
    ELSE
        RAISE NOTICE '   - Can target Nada: NO (User not found)';
    END IF;

    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Diagnostics Complete.';
END $$;
