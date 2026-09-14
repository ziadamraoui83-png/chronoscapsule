-- كبسولة اليوم الذهبية (تُحسب يوميًا عبر مفتاح التشفير أو التاريخ)
-- هذه الدالة تُرجع كبسولة واحدة مميزة يوميًا لجميع الزوار

CREATE OR REPLACE FUNCTION get_golden_capsule()
RETURNS TABLE (
    o_id bigint,
    o_text text,
    o_author text,
    o_country text,
    o_mood text,
    o_created timestamp with time zone,
    o_reads integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id as o_id,
        text as o_text,
        author as o_author,
        country as o_country,
        mood as o_mood,
        created_at as o_created,
        reads_count as o_reads
    FROM capsules
    WHERE mode = 'public' AND is_hidden = false
    -- نستخدم دالة Hash تعتمد على تاريخ اليوم لاختيار كبسولة ثابتة طوال اليوم
    ORDER BY md5(id::text || CURRENT_DATE::text)
    LIMIT 1;
END;
$$;
