import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: shadcn,
      }}
    >
      {children}
    </ClerkProvider>
  );
}

