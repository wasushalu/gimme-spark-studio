
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, secretName, secretValue } = await req.json();
    
    // Get the service role key from environment
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing Supabase configuration');
    }

    if (action === 'set') {
      // Set a secret using Supabase Management API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/set_secret`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({
          name: secretName,
          value: secretValue
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set secret: ${response.statusText}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Secret ${secretName} has been saved successfully` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      // For security, we don't return the actual values, just whether they exist
      const secretExists = Deno.env.get(secretName) !== undefined;
      
      return new Response(JSON.stringify({ 
        exists: secretExists,
        name: secretName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manage-secrets function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
