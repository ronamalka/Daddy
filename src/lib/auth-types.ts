import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    weakPassword?: boolean;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      weakPassword?: boolean;
    };
  }
}
