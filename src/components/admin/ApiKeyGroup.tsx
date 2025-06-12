
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key } from 'lucide-react';
import { ApiKey } from '@/config/apiKeysConfig';
import ApiKeyItem from './ApiKeyItem';

interface ApiKeyGroupProps {
  category: string;
  keys: ApiKey[];
  apiKeys: Record<string, string>;
  visibleKeys: Record<string, boolean>;
  keyStatuses: Record<string, boolean>;
  loading: boolean;
  onUpdateApiKey: (keyName: string, value: string) => void;
  onToggleVisibility: (keyName: string) => void;
  onSaveKey: (keyName: string) => void;
}

export default function ApiKeyGroup({
  category,
  keys,
  apiKeys,
  visibleKeys,
  keyStatuses,
  loading,
  onUpdateApiKey,
  onToggleVisibility,
  onSaveKey
}: ApiKeyGroupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          {category}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {keys.map((keyConfig) => (
          <ApiKeyItem
            key={keyConfig.name}
            keyConfig={keyConfig}
            value={apiKeys[keyConfig.name] || ''}
            isVisible={visibleKeys[keyConfig.name] || false}
            isSaved={keyStatuses[keyConfig.name] || false}
            loading={loading}
            onChange={(value) => onUpdateApiKey(keyConfig.name, value)}
            onToggleVisibility={() => onToggleVisibility(keyConfig.name)}
            onSave={() => onSaveKey(keyConfig.name)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
