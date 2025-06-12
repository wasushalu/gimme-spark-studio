
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { API_KEYS, ApiKey } from '@/config/apiKeysConfig';
import ApiKeyGroup from '@/components/admin/ApiKeyGroup';
import SecurityNotice from '@/components/admin/SecurityNotice';

export default function ApiKeysPage() {
  const { saveApiKey, saveAllKeys, checkApiKeyStatus, loading, keyStatuses } = useApiKeys();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Check status of all API keys on component mount
  useEffect(() => {
    const checkAllKeyStatuses = async () => {
      for (const keyConfig of API_KEYS) {
        await checkApiKeyStatus(keyConfig.name);
      }
    };
    checkAllKeyStatuses();
  }, [checkApiKeyStatus]);

  const toggleVisibility = (keyName: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const updateApiKey = (keyName: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyName]: value
    }));
  };

  const handleSaveKey = async (keyName: string) => {
    const value = apiKeys[keyName];
    if (!value?.trim()) return;
    
    const success = await saveApiKey(keyName, value);
    if (success) {
      // Only clear the input after successful save
      setApiKeys(prev => ({ ...prev, [keyName]: '' }));
    }
  };

  const handleSaveAllKeys = async () => {
    const keysToSave = Object.fromEntries(
      Object.entries(apiKeys).filter(([_, value]) => value.trim())
    );
    
    if (Object.keys(keysToSave).length === 0) {
      return;
    }

    await saveAllKeys(keysToSave);
    // Clear all inputs after successful save
    setApiKeys({});
  };

  const groupedKeys = API_KEYS.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, ApiKey[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys Management</h1>
          <p className="text-gray-600 mt-1">Securely manage all your service API keys in one place</p>
        </div>
        <Button onClick={handleSaveAllKeys} disabled={loading || Object.keys(apiKeys).length === 0}>
          <Save className="w-4 h-4 mr-2" />
          Save All Keys
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedKeys).map(([category, keys]) => (
          <ApiKeyGroup
            key={category}
            category={category}
            keys={keys}
            apiKeys={apiKeys}
            visibleKeys={visibleKeys}
            keyStatuses={keyStatuses}
            loading={loading}
            onUpdateApiKey={updateApiKey}
            onToggleVisibility={toggleVisibility}
            onSaveKey={handleSaveKey}
          />
        ))}
      </div>

      <div className="mt-6">
        <SecurityNotice />
      </div>
    </div>
  );
}
