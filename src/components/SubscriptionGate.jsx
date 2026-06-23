import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { hasActiveAccess, isExpiringSoon, getDaysRemaining } from '@/utils/subscription';
import { Navigate } from 'react-router-dom';

export default function SubscriptionGate({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth || !user) return null;

  if (!hasActiveAccess(user)) {
    return <Navigate to="/subscribe" replace />;
  }

  const expiring = isExpiringSoon(user);
  const days = getDaysRemaining(user);

  return (
    <>
      {expiring && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/95 text-black text-center text-xs py-2 px-4 font-medium">
          Your access expires in {days} day{days !== 1 ? 's' : ''}.
          <a href="https://buy.stripe.com/00wfZi6ID2uHeqw2JK3Je00" target="_blank" rel="noopener" className="underline ml-1 font-bold">Subscribe now</a>
        </div>
      )}
      <div className={expiring ? 'pt-8' : ''}>
        {children}
      </div>
    </>
  );
}