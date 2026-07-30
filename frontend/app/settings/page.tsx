'use client';

import { DashboardShell } from '../components/dashboard-shell';
import { Card, CardHeader, CardContent } from '../components/ui';
import { Button } from '../components/ui/button';
import { Input, Textarea } from '../components/ui/input';
import { Info, Smartphone, Building, Code2, Save } from 'lucide-react';
import { useToast } from '../components/ui/toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved successfully.',
    });
  };

  return (
    <DashboardShell title="Settings">
      <div className="max-w-4xl space-y-8">
        
        {/* Gym Information */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#F97316]/10 rounded-lg">
                <Building className="w-5 h-5 text-[#F97316]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Gym Information</h3>
                <p className="text-sm text-zinc-400">Manage your basic gym details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Gym Name</label>
                <Input defaultValue="POWER GYM" className="bg-[#09090B] border-[#27272A]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                <Input defaultValue="01559666564" className="bg-[#09090B] border-[#27272A]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-300">Address</label>
                <Textarea defaultValue="123 Fitness Street" className="bg-[#09090B] border-[#27272A] min-h-[100px]" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Integration</h3>
                <p className="text-sm text-zinc-400">Configure automated messaging via WhatsApp Cloud API</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-4 items-start">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200 leading-relaxed">
                These settings require a Meta Developer account and a configured WhatsApp Business App. 
                Values are stored securely in your environment variables.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">WhatsApp Token</label>
                <Input 
                  type="password" 
                  defaultValue="*************************" 
                  className="bg-[#09090B] border-[#27272A]" 
                  disabled
                />
                <p className="text-xs text-zinc-500">Configured via WHATSAPP_TOKEN env variable</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Phone Number ID</label>
                <Input 
                  defaultValue="Configured via Env" 
                  className="bg-[#09090B] border-[#27272A]" 
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About App */}
        <Card className="border-[#27272A] bg-[#18181B]">
          <CardHeader className="border-b border-[#27272A] p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Code2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">About System</h3>
                <p className="text-sm text-zinc-400">System information and credits</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 mb-1">Application Name</p>
                  <p className="font-medium text-white">POWER GYM</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Version</p>
                  <p className="font-medium text-white bg-zinc-800 inline-block px-2 py-0.5 rounded text-xs border border-zinc-700">1.0.0</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-500 mb-1">Developer</p>
                  <p className="font-medium text-white">Sayed Khashana</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Support Phone</p>
                  <p className="font-medium text-white">01559666564</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#27272A]">
              <p className="text-zinc-400 text-sm text-center">
                Professional Gym Management System. All rights reserved &copy; {new Date().getFullYear()}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardShell>
  );
}
