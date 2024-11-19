'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import ManufacturerDashboard from "@/components/Manufacturer";
import SupplierDashboard from "@/components/Supplier";
import CustomerDashboard from "@/components/Customer";

export default function Home() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    if (!user) {
      return <CustomerDashboard />;
    }

    const userRole = user.unsafeMetadata?.role as string;
    
    switch (userRole) {
      case 'manufacturer':
        return <ManufacturerDashboard />;
      case 'supplier':
        return <SupplierDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-200">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-6xl bg-white dark:bg-[#111111] rounded-lg shadow-lg dark:shadow-blue-500/10">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}