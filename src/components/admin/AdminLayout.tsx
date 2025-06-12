
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Bot, 
  Cpu, 
  Wrench, 
  FileText, 
  LogOut,
  Settings,
  Key
} from 'lucide-react';

export default function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('agents');

  const navigationItems = [
    { id: 'agents', label: 'Agents', icon: Bot, path: '/admin/agents' },
    { id: 'models', label: 'Model Catalog', icon: Cpu, path: '/admin/models' },
    { id: 'tools', label: 'Tool Registry', icon: Wrench, path: '/admin/tools' },
    { id: 'api-keys', label: 'API Keys', icon: Key, path: '/admin/api-keys' },
    { id: 'logs', label: 'Logs', icon: FileText, path: '/admin/logs' },
  ];

  const handleNavigation = (item: typeof navigationItems[0]) => {
    setActiveTab(item.id);
    navigate(item.path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Admin Panel</h1>
          
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <Separator />

        <div className="p-6">
          {user && profile ? (
            <>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <Settings className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Demo Mode</p>
              <p className="text-xs text-gray-400">No authentication required</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
