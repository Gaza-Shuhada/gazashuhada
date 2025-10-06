import { ToolsNavbar } from '@/components/ToolsNavbar';
import { ReactNode } from 'react';

interface ToolsLayoutProps {
  children: ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <>
      <ToolsNavbar />
      {children}
    </>
  );
}

