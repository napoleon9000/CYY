import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessFriendRequestPayload {
  action: 'accept' | 'reject' | 'block'
  friendship_id: string
}

serve(async (req) => {
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

    // Verify the user
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      throw new Error('No authorization token provided')
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Invalid authorization token')
    }

    const { action, friendship_id } = await req.json() as ProcessFriendRequestPayload

    // Get the friendship request
    const { data: friendship, error: friendshipError } = await supabaseClient
      .from('friendships')
      .select('*')
      .eq('id', friendship_id)
      .single()

    if (friendshipError || !friendship) {
      throw new Error('Friendship request not found')
    }

    // Verify the user is the recipient
    if (friendship.friend_id !== user.id) {
      throw new Error('Unauthorized: You can only process friend requests sent to you')
    }

    // Process the request based on action
    let updateData: any = {}
    
    switch (action) {
      case 'accept':
        updateData = {
          status: 'accepted',
          accepted_at: new Date().toISOString()
        }
        break
      case 'reject':
        // Delete the request
        const { error: deleteError } = await supabaseClient
          .from('friendships')
          .delete()
          .eq('id', friendship_id)
        
        if (deleteError) {
          throw deleteError
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Friend request rejected' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      case 'block':
        updateData = {
          status: 'blocked'
        }
        break
      default:
        throw new Error('Invalid action')
    }

    // Update the friendship
    const { error: updateError } = await supabaseClient
      .from('friendships')
      .update(updateData)
      .eq('id', friendship_id)

    if (updateError) {
      throw updateError
    }

    // If accepted, send notification to the requester
    if (action === 'accept') {
      const { data: acceptorProfile } = await supabaseClient
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single()

      const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID')
      const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY')

      if (oneSignalAppId && oneSignalApiKey) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${oneSignalApiKey}`
          },
          body: JSON.stringify({
            app_id: oneSignalAppId,
            include_external_user_ids: [friendship.user_id],
            contents: {
              en: `${acceptorProfile?.display_name || acceptorProfile?.username} accepted your friend request!`
            },
            headings: {
              en: 'Friend Request Accepted'
            },
            data: {
              type: 'friend_request_accepted',
              friend_id: user.id
            }
          })
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Friend request ${action}ed successfully` 
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