'use client';

import { useSession } from 'next-auth/react';
import LoginButton from './auth/LoginButton';

export default function NavBar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-bold">WooSell</h1>
          </div>
          <div className="flex items-center">
            {session?.user?.name && (
              <span className="mr-4 text-sm text-gray-500">
                {session.user.name}
              </span>
            )}
            <LoginButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
