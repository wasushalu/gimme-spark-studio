
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
    
    console.log(`Action: ${action}, Secret: ${secretName}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'set') {
      // Store API key in our custom table
      const { error } = await supabase
        .from('api_keys_storage')
        .upsert({
          key_name: secretName,
          key_value: secretValue
        });

      if (error) {
        console.error('Error storing API key:', error);
        throw new Error(`Failed to store API key: ${error.message}`);
      }

      console.log(`Successfully stored API key: ${secretName}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `API key ${secretName} has been saved successfully` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      // Check if API key exists in our table
      const { data, error } = await supabase
        .from('api_keys_storage')
        .select('key_name')
        .eq('key_name', secretName)
        .maybeSingle();

      if (error) {
        console.error('Error checking API key:', error);
        return new Response(JSON.stringify({ 
          exists: false,
          name: secretName
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const exists = !!data;
      console.log(`Checking API key ${secretName}: exists = ${exists}`);
      
      return new Response(JSON.stringify({ 
        exists: exists,
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
