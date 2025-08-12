// Logout button component

"use client";

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/Button';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className,
  children = 'Sign Out',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut({
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLogout}
      loading={isLoading}
      disabled={isLoading}
    >
      {children}
    </Button>
  );
};

export { LogoutButton };