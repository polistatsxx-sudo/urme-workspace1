import React from 'react';
import { UserCog } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AccountManagerCard({ name }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4 tracking-wider">Account Manager</h3>
      {name ? (
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/15 text-primary text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">Dedicated relationship manager</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <UserCog className="w-5 h-5" />
          </div>
          <p className="text-sm">No manager assigned</p>
        </div>
      )}
    </div>
  );
}