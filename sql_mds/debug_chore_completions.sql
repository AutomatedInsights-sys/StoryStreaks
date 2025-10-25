-- Debug script to check chore completions and why they might not be showing
-- Run this to understand what's happening with pending completions

-- Check all chore completions
SELECT 
    cc.id,
    cc.chore_id,
    cc.child_id,
    cc.status,
    cc.completed_at,
    cc.photo_url,
    cc.created_at,
    c.title as chore_title,
    ch.name as child_name,
    ch.parent_id
FROM chore_completions cc
LEFT JOIN chores c ON cc.chore_id = c.id
LEFT JOIN children ch ON cc.child_id = ch.id
ORDER BY cc.created_at DESC;

-- Check specifically for pending completions
SELECT 
    cc.id,
    cc.chore_id,
    cc.child_id,
    cc.status,
    cc.completed_at,
    cc.photo_url,
    c.title as chore_title,
    ch.name as child_name,
    ch.parent_id
FROM chore_completions cc
LEFT JOIN chores c ON cc.chore_id = c.id
LEFT JOIN children ch ON cc.child_id = ch.id
WHERE cc.status = 'pending'
ORDER BY cc.created_at DESC;

-- Check if there are any completed chores that might have been processed
SELECT 
    cc.id,
    cc.chore_id,
    cc.child_id,
    cc.status,
    cc.completed_at,
    cc.photo_url,
    c.title as chore_title,
    ch.name as child_name,
    ch.parent_id
FROM chore_completions cc
LEFT JOIN chores c ON cc.chore_id = c.id
LEFT JOIN children ch ON cc.child_id = ch.id
WHERE cc.status IN ('approved', 'rejected')
ORDER BY cc.created_at DESC;

-- Check the children table to see what children exist
SELECT 
    id,
    name,
    parent_id,
    total_points,
    created_at
FROM children
ORDER BY created_at DESC;

-- Check the chores table to see what chores exist
SELECT 
    id,
    title,
    parent_id,
    points,
    created_at
FROM chores
ORDER BY created_at DESC;
