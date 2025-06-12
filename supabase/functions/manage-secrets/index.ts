
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

    if (action === 'set') {
      // For Supabase secrets, we need to use the vault schema
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!serviceRoleKey || !supabaseUrl) {
        throw new Error('Missing Supabase configuration');
      }

      // Create Supabase client with service role
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Use the vault.secrets table to store secrets
      const { error } = await supabase
        .from('vault.secrets')
        .upsert({
          name: secretName,
          secret: secretValue
        });

      if (error) {
        console.error('Error storing secret:', error);
        throw new Error(`Failed to store secret: ${error.message}`);
      }

      console.log(`Successfully stored secret: ${secretName}`);

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Secret ${secretName} has been saved successfully` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      // Check if secret exists by trying to read it from environment
      // In production, secrets are available as environment variables
      const secretExists = Deno.env.get(secretName) !== undefined;
      
      console.log(`Checking secret ${secretName}: exists = ${secretExists}`);
      
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
