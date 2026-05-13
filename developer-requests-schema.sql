-- Run this in your Supabase SQL editor to create the developer_requests table

CREATE TABLE IF NOT EXISTS developer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  website TEXT,
  about TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

CREATE INDEX idx_dev_requests_email ON developer_requests(email);
CREATE INDEX idx_dev_requests_status ON developer_requests(status);
ALTER TABLE developer_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages developer requests" ON developer_requests FOR ALL USING (true);
