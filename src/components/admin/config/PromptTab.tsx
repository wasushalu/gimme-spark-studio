
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptTabProps {
  config: any;
  setConfig: (config: any) => void;
}

export default function PromptTab({ config, setConfig }: PromptTabProps) {
  const handlePromptChange = (value: string) => {
    setConfig((prev: any) => ({
      ...prev,
      prompt: value
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Textarea
          id="system-prompt"
          placeholder="Enter the system prompt for this agent..."
          value={config?.prompt || ''}
          onChange={(e) => handlePromptChange(e.target.value)}
          rows={10}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-2">
          This prompt will guide the agent's behavior and responses. Be specific about the role, tone, and capabilities you want the agent to have.
        </p>
      </div>
    </div>
  );
}
