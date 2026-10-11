DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN 
        SELECT 
            s.sequence_name,
            c.table_name,
            c.column_name
        FROM information_schema.sequences s
        JOIN information_schema.columns c
          ON c.column_default LIKE '%' || s.sequence_name || '%'
        WHERE s.sequence_schema = 'public'
    LOOP
        EXECUTE format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1))',
            seq.sequence_name,
            seq.column_name,
            seq.table_name
        );
    END LOOP;
END $$;
