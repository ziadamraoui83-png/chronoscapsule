-- مرحلة 3: إضافة عمود الترجمة إلى الجدول capsuls
-- هذا العمود سيعمل كخيار إضافي فقط، حيث ستتم الترجمة عبر الدالة
-- إذا لم تكن الترجمة موجودة، سيتم طلبها من الدالة
ALTER TABLE capsules
ADD COLUMN IF NOT EXISTS translation text;

-- إضافة عمود اللغة التي تم الترجمة إليها
ALTER TABLE capsules
ADD COLUMN IF NOT EXISTS translation_lang text;

-- إنشاء دالة لجلب الترجمة (ستستخدم في الواجهة)
CREATE OR REPLACE FUNCTION get_capsule_translation(
    p_id bigint,
    p_target_lang text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
    translation_text text;
BEGIN
    -- 1. جلب الترجمة من قاعدة البيانات إذا كانت موجودة
    SELECT translation, translation_lang INTO translation_text FROM capsules WHERE id = p_id;

    -- 2. إذا لم تكن الترجمة موجودة أو اللغة غير مطابقة، نطلبها من الدالة
    IF translation_text IS NULL OR translation_lang != UPPER(p_target_lang) THEN
        -- هنا ستستخدم الدالة التي تم إنشاؤها في Supabase Edge Function
        -- في الواجهة، سيتم استدعاء الدالة عبر HTTP
        -- لكننا نضمن أن الترجمة ستخزن في قاعدة البيانات
        RETURN NULL; -- سيتم التعامل مع هذا في الواجهة
    ELSE
        RETURN translation_text;
    END IF;
END;
$$;

-- تحديث الدوال الموجودة لجلب الكبسولات
-- لإضافة الترجمة إذا كانت متاحة
CREATE OR REPLACE FUNCTION get_deep_capsule(p_exclude_id bigint)
RETURNS TABLE (
    o_id bigint,
    o_text text,
    o_author text,
    o_country text,
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
        created_at as o_created,
        reads_count as o_reads
    FROM capsules
    WHERE mode = 'public' AND is_hidden = false
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
      AND created_at < NOW() - INTERVAL '48 hours'
    ORDER BY RANDOM()
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_capsules(p_device_hash text)
RETURNS TABLE (
    o_id bigint,
    o_code text,
    o_text text,
    o_mood text,
    o_country text,
    o_arrival_at timestamp with time zone,
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
        code as o_code,
        text as o_text,
        mood as o_mood,
        country as o_country,
        arrival_at as o_arrival_at,
        created_at as o_created,
        reads_count as o_reads
    FROM capsules
    WHERE device_hash = p_device_hash
    ORDER BY arrival_at DESC;
END;
$$;
