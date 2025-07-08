import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendReminderRequest {
  from_user_id: string
  to_user_id: string
  medication_id: string
  message: string
  medication_name?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the JWT from the Authorization header
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('No authorization token provided')
    }

    // Verify the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Invalid authorization token')
    }

    const { from_user_id, to_user_id, medication_id, message, medication_name } = await req.json() as SendReminderRequest

    // Verify the sender is the authenticated user
    if (from_user_id !== user.id) {
      throw new Error('Unauthorized: Cannot send reminders on behalf of other users')
    }

    // Check if users are friends
    const { data: friendship, error: friendshipError } = await supabaseClient
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${from_user_id},friend_id.eq.${from_user_id}`)
      .or(`user_id.eq.${to_user_id},friend_id.eq.${to_user_id}`)
      .eq('status', 'accepted')
      .single()

    if (friendshipError || !friendship) {
      throw new Error('You can only send reminders to friends')
    }

    // Get sender's profile
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('display_name, username')
      .eq('id', from_user_id)
      .single()

    // Save the reminder
    const { data: reminder, error: reminderError } = await supabaseClient
      .from('friend_reminders')
      .insert({
        from_user_id,
        to_user_id,
        medication_id,
        message,
        scheduled_time: new Date().toISOString()
      })
      .select()
      .single()

    if (reminderError) {
      throw reminderError
    }

    // Send push notification via OneSignal
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (oneSignalAppId && oneSignalApiKey) {
      const notificationPayload = {
        app_id: oneSignalAppId,
        include_external_user_ids: [to_user_id],
        contents: {
          en: message
        },
        headings: {
          en: `${senderProfile?.display_name || senderProfile?.username} sent you a reminder`
        },
        data: {
          type: 'friend_reminder',
          reminder_id: reminder.id,
          medication_id,
          medication_name,
          from_user_id
        },
        ios_badgeType: 'Increase',
        ios_badgeCount: 1
      }

      const notificationResponse = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${oneSignalApiKey}`
        },
        body: JSON.stringify(notificationPayload)
      })

      if (!notificationResponse.ok) {
        console.error('Failed to send push notification:', await notificationResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reminder_id: reminder.id,
        message: 'Reminder sent successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})