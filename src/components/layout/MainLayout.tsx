
import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-4 p-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <h1 className="text-xl font-semibold gradient-text">Gimmefy</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
