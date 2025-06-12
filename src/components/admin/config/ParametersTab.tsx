
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ParametersTabProps {
  config: any;
  setConfig: (config: any) => void;
}

export default function ParametersTab({ config, setConfig }: ParametersTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="max-context">Max Context Tokens</Label>
          <Input
            id="max-context"
            type="number"
            value={config.generation.max_context_tokens}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              generation: {
                ...prev.generation,
                max_context_tokens: parseInt(e.target.value) || 8000
              }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="max-response">Max Response Tokens</Label>
          <Input
            id="max-response"
            type="number"
            value={config.generation.max_response_tokens}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              generation: {
                ...prev.generation,
                max_response_tokens: parseInt(e.target.value) || 4000
              }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={config.generation.temperature}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              generation: {
                ...prev.generation,
                temperature: parseFloat(e.target.value) || 0.7
              }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="top-p">Top P</Label>
          <Input
            id="top-p"
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={config.generation.top_p}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              generation: {
                ...prev.generation,
                top_p: parseFloat(e.target.value) || 1
              }
            }))}
          />
        </div>
      </div>
    </div>
  );
}
