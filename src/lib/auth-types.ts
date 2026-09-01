import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    weakPassword?: boolean;
    hasPassword?: boolean;
    isEmailVerified?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      weakPassword?: boolean;
      hasPassword?: boolean;
      isEmailVerified?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    weakPassword?: boolean;
    hasPassword?: boolean;
    isEmailVerified?: boolean;
    jti?: string;
  }
}
