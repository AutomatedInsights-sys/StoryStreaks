-- Check the structure of the notifications table
-- This will help us understand what columns exist

-- Check if the notifications table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check the table structure more comprehensively
SELECT 
    schemaname,
    tablename,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
JOIN pg_tables ON information_schema.columns.table_name = pg_tables.tablename
WHERE tablename = 'notifications' 
AND schemaname = 'public'
ORDER BY ordinal_position;

