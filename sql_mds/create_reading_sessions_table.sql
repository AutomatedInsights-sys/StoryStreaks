-- Create reading_sessions table for tracking reading progress
CREATE TABLE reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  chapter_id UUID REFERENCES story_chapters(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  reading_duration INTEGER, -- in seconds
  words_read INTEGER,
  reading_speed INTEGER, -- words per minute
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reading_sessions_child_id ON reading_sessions(child_id);
CREATE INDEX idx_reading_sessions_chapter_id ON reading_sessions(chapter_id);
CREATE INDEX idx_reading_sessions_created_at ON reading_sessions(created_at);

-- Row Level Security Policies
CREATE POLICY "Children can view own reading sessions" ON reading_sessions 
FOR SELECT USING (child_id IN (
  SELECT id FROM children WHERE parent_id = auth.uid()
));

CREATE POLICY "Children can insert own reading sessions" ON reading_sessions 
FOR INSERT WITH CHECK (child_id IN (
  SELECT id FROM children WHERE parent_id = auth.uid()
));

CREATE POLICY "Children can update own reading sessions" ON reading_sessions 
FOR UPDATE USING (child_id IN (
  SELECT id FROM children WHERE parent_id = auth.uid()
));

-- Enable RLS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
