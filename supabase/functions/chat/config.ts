
export async function getApiKey(supabaseClient: any, keyName: string): Promise<string | null> {
  const { data: apiKeyData, error: apiKeyError } = await supabaseClient
    .from('api_keys_storage')
    .select('key_value')
    .eq('key_name', keyName)
    .maybeSingle();

  if (apiKeyError) {
    console.error(`Error fetching ${keyName}:`, apiKeyError);
    return null;
  }

  return apiKeyData?.key_value || null;
}

export async function getAgentConfigFromDatabase(supabaseClient: any, agentType: string) {
  const { data: configData, error: configError } = await supabaseClient
    .from('agent_config_versions')
    .select('*')
    .eq('agent_id', agentType)
    .eq('is_active', true)
    .maybeSingle();

  if (configError) {
    console.error('Error fetching agent config from database:', configError);
    return null;
  }

  return configData?.settings || null;
}
