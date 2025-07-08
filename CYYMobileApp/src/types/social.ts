/**
 * Social features types for CYY Mobile App
 */

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Friendship status types
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Friendship interface
 */
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  accepted_at?: string;
  user?: UserProfile;
  friend?: UserProfile;
}

/**
 * Invite code interface
 */
export interface InviteCode {
  id: string;
  code: string;
  creator_id: string;
  used_by?: string;
  expires_at: string;
  created_at: string;
  used_at?: string;
}

/**
 * Shared medication interface
 */
export interface SharedMedication {
  id: string;
  medication_data: any; // Will contain the full Medication object
  owner_id: string;
  shared_with: string[];
  permissions: {
    canViewHistory: boolean;
    canRemind: boolean;
  };
  created_at: string;
  updated_at: string;
  owner?: UserProfile;
}

/**
 * Friend reminder interface
 */
export interface FriendReminder {
  id: string;
  from_user_id: string;
  to_user_id: string;
  medication_id: string;
  message: string;
  scheduled_time?: string;
  sent_at: string;
  read_at?: string;
  notification_sent?: boolean;
  from_user?: UserProfile;
  to_user?: UserProfile;
}

/**
 * Medication sync log interface
 */
export interface MedicationSyncLog {
  id: string;
  user_id: string;
  medication_id: string;
  scheduled_time: string;
  actual_time?: string;
  status: 'taken' | 'skipped' | 'pending';
  photo_url?: string;
  notes?: string;
  created_at: string;
}

/**
 * Friend request payload
 */
export interface FriendRequestPayload {
  email?: string;
  username?: string;
  invite_code?: string;
}

/**
 * Share medication payload
 */
export interface ShareMedicationPayload {
  medication_id: string;
  friend_ids: string[];
  permissions?: {
    canViewHistory?: boolean;
    canRemind?: boolean;
  };
}