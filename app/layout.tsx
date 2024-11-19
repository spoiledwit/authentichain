import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from '@/components/Header';
import RoleProvider from '@/components/RoleProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <RoleProvider>
            <Header />
            <main>{children}</main>
          </RoleProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}