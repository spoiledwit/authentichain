// components/RoleProvider.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import RoleSelectionModal from './RoleSelection';

export default function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (isLoaded && user && !user.unsafeMetadata?.role) {
      setShowRoleModal(true);
    }
  }, [isLoaded, user]);

  return (
    <>
      {children}
      <RoleSelectionModal 
        isOpen={showRoleModal} 
        onRoleSelected={() => setShowRoleModal(false)} 
      />
    </>
  );
}