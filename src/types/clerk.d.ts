// Extend Clerk's types with our custom metadata
export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: string;
    };
  }
}

