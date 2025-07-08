import { supabase } from './supabase';
import { 
  SharedMedication, 
  ShareMedicationPayload,
  FriendReminder,
  MedicationSyncLog 
} from '../types/social';
import { Medication, MedicationLog } from '../types/medication';
import { Database } from '../utils/database';

export class MedicationShareService {
  /**
   * Share medications with friends
   */
  static async shareMedications(medications: Medication[], friendIds: string[]): Promise<SharedMedication[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const sharedMedications: SharedMedication[] = [];

    for (const medication of medications) {
      // Check if already shared
      const { data: existing } = await supabase
        .from('shared_medications')
        .select('*')
        .eq('owner_id', user.data.user.id)
        .eq('medication_data->>id', medication.id)
        .single();

      if (existing) {
        // Update shared_with array
        const updatedSharedWith = Array.from(new Set([...existing.shared_with, ...friendIds]));
        
        const { data, error } = await supabase
          .from('shared_medications')
          .update({ shared_with: updatedSharedWith })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        sharedMedications.push(data);
      } else {
        // Create new share
        const { data, error } = await supabase
          .from('shared_medications')
          .insert({
            medication_data: medication,
            owner_id: user.data.user.id,
            shared_with: friendIds,
            permissions: {
              canViewHistory: true,
              canRemind: true
            }
          })
          .select()
          .single();

        if (error) throw error;
        sharedMedications.push(data);
      }
    }

    return sharedMedications;
  }

  /**
   * Get medications shared with me
   */
  static async getSharedMedications(): Promise<SharedMedication[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shared_medications')
      .select('*, owner:profiles!owner_id(*)')
      .contains('shared_with', [user.data.user.id])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get my shared medications
   */
  static async getMySharedMedications(): Promise<SharedMedication[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('shared_medications')
      .select('*')
      .eq('owner_id', user.data.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update share permissions
   */
  static async updateSharePermissions(
    sharedMedicationId: string, 
    permissions: { canViewHistory?: boolean; canRemind?: boolean }
  ): Promise<void> {
    const { error } = await supabase
      .from('shared_medications')
      .update({ permissions })
      .eq('id', sharedMedicationId);

    if (error) throw error;
  }

  /**
   * Remove friend from shared medication
   */
  static async removeFriendFromShare(sharedMedicationId: string, friendId: string): Promise<void> {
    const { data: shared, error: fetchError } = await supabase
      .from('shared_medications')
      .select('shared_with')
      .eq('id', sharedMedicationId)
      .single();

    if (fetchError) throw fetchError;

    const updatedSharedWith = shared.shared_with.filter((id: string) => id !== friendId);

    const { error } = await supabase
      .from('shared_medications')
      .update({ shared_with: updatedSharedWith })
      .eq('id', sharedMedicationId);

    if (error) throw error;
  }

  /**
   * Stop sharing medication
   */
  static async stopSharingMedication(medicationId: string): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('shared_medications')
      .delete()
      .eq('owner_id', user.data.user.id)
      .eq('medication_data->>id', medicationId);

    if (error) throw error;
  }

  /**
   * Send reminder to friend
   */
  static async sendReminder(
    toUserId: string, 
    medicationId: string, 
    medicationName: string,
    message: string
  ): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Call edge function to send reminder
    const { error } = await supabase.functions.invoke('send-reminder', {
      body: {
        from_user_id: user.data.user.id,
        to_user_id: toUserId,
        medication_id: medicationId,
        medication_name: medicationName,
        message
      }
    });

    if (error) throw error;
  }

  /**
   * Get friend reminders
   */
  static async getFriendReminders(sent: boolean = false): Promise<FriendReminder[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const column = sent ? 'from_user_id' : 'to_user_id';
    const joinColumn = sent ? 'to_user' : 'from_user';

    const { data, error } = await supabase
      .from('friend_reminders')
      .select(`*, ${joinColumn}:profiles!${joinColumn}_id(*)`)
      .eq(column, user.data.user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark reminder as read
   */
  static async markReminderAsRead(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('friend_reminders')
      .update({ read_at: new Date().toISOString() })
      .eq('id', reminderId);

    if (error) throw error;
  }

  /**
   * Sync medication log to cloud
   */
  static async syncMedicationLog(log: MedicationLog): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('medication_logs')
      .upsert({
        id: log.id,
        user_id: user.data.user.id,
        medication_id: log.medicationId,
        scheduled_time: log.scheduledTime.toISOString(),
        actual_time: log.actualTime?.toISOString(),
        status: log.status,
        photo_url: log.photoUri,
        notes: log.notes,
        created_at: log.createdAt.toISOString()
      });

    if (error) throw error;
  }

  /**
   * Get friend's medication status
   */
  static async getFriendMedicationStatus(
    friendId: string, 
    medicationId: string
  ): Promise<MedicationSyncLog | null> {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', friendId)
      .eq('medication_id', medicationId)
      .order('scheduled_time', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get friend's medication history
   */
  static async getFriendMedicationHistory(
    friendId: string, 
    medicationId: string,
    days: number = 7
  ): Promise<MedicationSyncLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', friendId)
      .eq('medication_id', medicationId)
      .gte('scheduled_time', startDate.toISOString())
      .order('scheduled_time', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}