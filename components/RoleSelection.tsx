// components/RoleSelectionModal.tsx
'use client';

import { useUser } from '@clerk/nextjs';
import { Shield, Truck } from 'lucide-react';
import { useState } from 'react';

export default function RoleSelectionModal({ isOpen, onRoleSelected }: { 
  isOpen: boolean;
  onRoleSelected: () => void;
}) {
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const selectRole = async (role: 'manufacturer' | 'supplier') => {
    setIsUpdating(true);
    try {
      await user?.update({
        unsafeMetadata: {
          role: role
        }
      });
      onRoleSelected();
    } catch (error) {
      console.error('Error setting role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Welcome to AuthentiChain</h2>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Please select your role to continue
        </p>

        <div className="mt-6 space-y-4">
          <button
            onClick={() => selectRole('manufacturer')}
            disabled={isUpdating}
            className="w-full p-4 border-2 rounded-lg flex items-center justify-center space-x-3 hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            <Shield className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-medium text-black">Manufacturer</span>
          </button>

          <button
            onClick={() => selectRole('supplier')}
            disabled={isUpdating}
            className="w-full p-4 border-2 rounded-lg flex items-center justify-center space-x-3 hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            <Truck className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-medium text-black">Supplier</span>
          </button>
        </div>
      </div>
    </div>
  );
}