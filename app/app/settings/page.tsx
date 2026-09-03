'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { User } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const profileData = data as { full_name: string | null } | null;
      if (profileData?.full_name) setFullName(profileData.full_name);
      setFetching(false);
    }
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) {
        toast.error('Failed to update profile. Please try again.');
        return;
      }

      toast.success('Profile updated successfully');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <User className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and profile preferences.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name and account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{fullName || 'Your name'}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading || fetching}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed from this page.
              </p>
            </div>

            <Button type="submit" disabled={loading || fetching}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
