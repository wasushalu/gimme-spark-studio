
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ModelSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function ModelSearch({ searchTerm, onSearchChange }: ModelSearchProps) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
