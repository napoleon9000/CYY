-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  region TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Create invite codes table
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Create shared medications table
CREATE TABLE shared_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_data JSONB NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with UUID[] DEFAULT '{}',
  permissions JSONB DEFAULT '{"canViewHistory": true, "canRemind": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication logs table (synced from app)
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'pending')),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friend reminders table
CREATE TABLE friend_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_shared_medications_owner_id ON shared_medications(owner_id);
CREATE INDEX idx_shared_medications_shared_with ON shared_medications USING GIN(shared_with);
CREATE INDEX idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX idx_medication_logs_scheduled_time ON medication_logs(scheduled_time);
CREATE INDEX idx_friend_reminders_to_user_id ON friend_reminders(to_user_id);
CREATE INDEX idx_friend_reminders_sent_at ON friend_reminders(sent_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for friendships
CREATE POLICY "Users can view their friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for invite codes
CREATE POLICY "Users can view their own invite codes" ON invite_codes
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = used_by);

CREATE POLICY "Users can create invite codes" ON invite_codes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their invite codes" ON invite_codes
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for shared medications
CREATE POLICY "Users can view medications shared with them" ON shared_medications
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can share their medications" ON shared_medications
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their shared medications" ON shared_medications
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their shared medications" ON shared_medications
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for medication logs
CREATE POLICY "Users can view their own logs" ON medication_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Friends can view shared medication logs" ON medication_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shared_medications sm
      WHERE sm.medication_data->>'id' = medication_logs.medication_id
        AND auth.uid() = ANY(sm.shared_with)
        AND sm.permissions->>'canViewHistory' = 'true'
    )
  );

CREATE POLICY "Users can create their own logs" ON medication_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" ON medication_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for friend reminders
CREATE POLICY "Users can view reminders sent to/from them" ON friend_reminders
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send reminders" ON friend_reminders
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update reminders they received" ON friend_reminders
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_medications_updated_at BEFORE UPDATE ON shared_medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create reciprocal friendship
CREATE OR REPLACE FUNCTION create_reciprocal_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- When a friendship is accepted, create the reciprocal record
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user_id, friend_id, status, accepted_at)
    VALUES (NEW.friend_id, NEW.user_id, 'accepted', NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendship_accepted_trigger
AFTER UPDATE ON friendships
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
EXECUTE FUNCTION create_reciprocal_friendship();

-- Function to clean up expired invite codes
CREATE OR REPLACE FUNCTION cleanup_expired_invite_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM invite_codes
  WHERE expires_at < NOW() AND used_by IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a stored procedure to get friend's medication status
CREATE OR REPLACE FUNCTION get_friend_medication_status(friend_id UUID, medication_id TEXT)
RETURNS TABLE (
  last_taken TIMESTAMPTZ,
  last_status TEXT,
  is_overdue BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.actual_time as last_taken,
    ml.status as last_status,
    CASE 
      WHEN ml.status = 'pending' AND ml.scheduled_time < NOW() THEN true
      ELSE false
    END as is_overdue
  FROM medication_logs ml
  WHERE ml.user_id = friend_id 
    AND ml.medication_id = medication_id
  ORDER BY ml.scheduled_time DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;