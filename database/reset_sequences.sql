DO $$
DECLARE
    r RECORD;
    max_id BIGINT;
BEGIN
    FOR r IN (
        SELECT
            c.table_name,
            c.column_name,
            s.relname AS seq_name
        FROM information_schema.columns c
        JOIN pg_class s ON s.relname = pg_get_serial_sequence(c.table_name, c.column_name)::regclass::text
        WHERE c.table_schema = 'public'
    ) LOOP
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_id;
        IF max_id > 0 THEN
            EXECUTE format('SELECT setval(%L, %s, true)', r.seq_name, max_id);
            RAISE NOTICE 'Sequence % reset to % for table %', r.seq_name, max_id, r.table_name;
        ELSE
            EXECUTE format('SELECT setval(%L, 1, false)', r.seq_name);
            RAISE NOTICE 'Sequence % reset to 1 (empty table %)', r.seq_name, r.table_name;
        END IF;
    END LOOP;
END $$;
