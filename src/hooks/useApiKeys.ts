import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useApiKeys() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, boolean>>({});

  const saveApiKey = async (keyName: string, value: string) => {
    if (!value.trim()) {
      toast({
        title: 'Error',
        description: 'API key value cannot be empty',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-secrets', {
        body: {
          action: 'set',
          secretName: keyName,
          secretValue: value
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to save API key');
      }

      setKeyStatuses(prev => ({ ...prev, [keyName]: true }));
      
      toast({
        title: 'Success',
        description: `${keyName} has been saved successfully.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: 'Error',
        description: `Failed to save ${keyName}. Please try again.`,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkApiKeyStatus = async (keyName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-secrets', {
        body: {
          action: 'get',
          secretName: keyName
        },
      });

      if (error) {
        console.error('Error checking API key status:', error);
        return false;
      }

      return data.exists || false;
    } catch (error) {
      console.error('Error checking API key status:', error);
      return false;
    }
  };

  const saveAllKeys = async (apiKeys: Record<string, string>) => {
    setLoading(true);
    let successCount = 0;
    let totalKeys = 0;

    for (const [keyName, value] of Object.entries(apiKeys)) {
      if (value.trim()) {
        totalKeys++;
        const success = await saveApiKey(keyName, value);
        if (success) successCount++;
      }
    }

    if (totalKeys === 0) {
      toast({
        title: 'No keys to save',
        description: 'Please enter at least one API key value.',
        variant: 'destructive',
      });
    } else if (successCount === totalKeys) {
      toast({
        title: 'All keys saved',
        description: `Successfully saved ${successCount} API keys.`,
      });
    } else {
      toast({
        title: 'Partial success',
        description: `Saved ${successCount} out of ${totalKeys} API keys.`,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return {
    saveApiKey,
    saveAllKeys,
    checkApiKeyStatus,
    loading,
    keyStatuses
  };
}
