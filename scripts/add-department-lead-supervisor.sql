-- Migration to add lead_id and supervisor_id to departments table
-- Run this script to update your existing database

ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES members(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES members(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_departments_lead_id ON departments(lead_id);
CREATE INDEX IF NOT EXISTS idx_departments_supervisor_id ON departments(supervisor_id);
