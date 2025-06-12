
export const getModalityColor = (modality: string) => {
  switch (modality) {
    case 'text': return 'bg-blue-100 text-blue-800';
    case 'image': return 'bg-green-100 text-green-800';
    case 'audio': return 'bg-purple-100 text-purple-800';
    case 'video': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai': return 'bg-emerald-100 text-emerald-800';
    case 'anthropic': return 'bg-orange-100 text-orange-800';
    case 'google': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const filterModels = (models: any[], searchTerm: string) => {
  if (!searchTerm) return models;
  const searchLower = searchTerm.toLowerCase();
  return models.filter(model => 
    model.model_name.toLowerCase().includes(searchLower) ||
    model.provider.toLowerCase().includes(searchLower) ||
    model.modality.toLowerCase().includes(searchLower)
  );
};
