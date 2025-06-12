
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ApiKey } from '@/config/apiKeysConfig';

interface ApiKeyItemProps {
  keyConfig: ApiKey;
  value: string;
  isVisible: boolean;
  isSaved: boolean;
  loading: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  onSave: () => void;
}

export default function ApiKeyItem({
  keyConfig,
  value,
  isVisible,
  isSaved,
  loading,
  onChange,
  onToggleVisibility,
  onSave
}: ApiKeyItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={keyConfig.name}>{keyConfig.label}</Label>
        {keyConfig.required && (
          <Badge variant="destructive" className="text-xs">Required</Badge>
        )}
        {isSaved && (
          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Saved
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={keyConfig.name}
            type={isVisible ? 'text' : 'password'}
            placeholder={`Enter your ${keyConfig.label}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={onToggleVisibility}
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={onSave}
          disabled={loading || !value?.trim()}
        >
          Save
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {keyConfig.description}
      </p>
    </div>
  );
}
