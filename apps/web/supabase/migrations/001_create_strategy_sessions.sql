CREATE TABLE IF NOT EXISTS strategy_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  role_title text,

  -- Business profile
  industry text,
  team_size text,
  current_tools text,

  -- Pain points & goals (arrays of selected checkbox values)
  pain_points text[] DEFAULT '{}',
  goals text[] DEFAULT '{}',

  -- Project scope
  project_types text[] DEFAULT '{}',
  features_needed text[] DEFAULT '{}',

  -- Budget & timeline
  budget_range text,
  timeline text,

  -- Free-text
  project_description text,
  additional_notes text,

  -- Meta
  source_url text,
  user_agent text,

  created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow inserts from anon (public form)
ALTER TABLE strategy_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON strategy_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON strategy_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
