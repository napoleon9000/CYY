import { supabase } from './supabase';
import { 
  Friendship, 
  FriendRequestPayload, 
  UserProfile, 
  InviteCode 
} from '../types/social';
import { Database } from '../utils/database';

export class FriendService {
  /**
   * Generate an invite link
   */
  static async generateInviteLink(): Promise<string> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const inviteCode = `${user.data.user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Save invite code to database
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code: inviteCode,
        creator_id: user.data.user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (error) throw error;

    // Return deep link
    return `cyymeds://invite/${inviteCode}`;
  }

  /**
   * Send friend request
   */
  static async sendFriendRequest(payload: FriendRequestPayload): Promise<Friendship> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    let friendId: string | null = null;

    // Handle invite code
    if (payload.invite_code) {
      // Find and validate invite code
      const { data: inviteCode, error: inviteError } = await supabase
        .from('invite_codes')
        .select('*, creator:profiles!creator_id(*)')
        .eq('code', payload.invite_code)
        .gt('expires_at', new Date().toISOString())
        .is('used_by', null)
        .single();

      if (inviteError || !inviteCode) {
        throw new Error('Invalid or expired invite code');
      }

      friendId = inviteCode.creator_id;

      // Mark invite code as used
      await supabase
        .from('invite_codes')
        .update({ 
          used_by: user.data.user.id,
          used_at: new Date().toISOString() 
        })
        .eq('id', inviteCode.id);
    }
    // Handle username search
    else if (payload.username) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', payload.username)
        .single();

      if (profileError || !profile) {
        throw new Error('User not found');
      }

      friendId = profile.id;
    }
    // Handle email search
    else if (payload.email) {
      // Note: This requires additional setup to search by email
      throw new Error('Email search not implemented yet');
    }

    if (!friendId) {
      throw new Error('No valid friend identifier provided');
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.data.user.id},friend_id.eq.${user.data.user.id}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
      .single();

    if (existingFriendship) {
      throw new Error('Friendship already exists');
    }

    // Create friendship request
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_id: user.data.user.id,
        friend_id: friendId,
        status: 'pending'
      })
      .select('*, friend:profiles!friend_id(*)')
      .single();

    if (friendshipError) throw friendshipError;

    return friendship;
  }

  /**
   * Get friend requests (received)
   */
  static async getFriendRequests(): Promise<Friendship[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select('*, user:profiles!user_id(*)')
      .eq('friend_id', user.data.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get friends list
   */
  static async getFriends(): Promise<Friendship[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('friendships')
      .select('*, friend:profiles!friend_id(*), user:profiles!user_id(*)')
      .or(`user_id.eq.${user.data.user.id},friend_id.eq.${user.data.user.id}`)
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false });

    if (error) throw error;

    // Format the data to always show the friend's info
    return (data || []).map(friendship => {
      const isSender = friendship.user_id === user.data.user!.id;
      return {
        ...friendship,
        friend: isSender ? friendship.friend : friendship.user
      };
    });
  }

  /**
   * Accept friend request
   */
  static async acceptFriendRequest(friendshipId: string): Promise<void> {
    const { error } = await supabase.rpc('process_friend_request', {
      p_friendship_id: friendshipId,
      p_action: 'accept'
    });

    if (error) throw error;
  }

  /**
   * Reject friend request
   */
  static async rejectFriendRequest(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;
  }

  /**
   * Remove friend
   */
  static async removeFriend(friendId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`user_id.eq.${user.data.user.id},friend_id.eq.${user.data.user.id}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`);

    if (error) throw error;
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId?: string): Promise<UserProfile | null> {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.data.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Search users by username
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user.data.user.id)
      .limit(10);

    if (error) throw error;
    return data || [];
  }
}