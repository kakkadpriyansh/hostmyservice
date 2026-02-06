import { Site } from "@prisma/client";

export interface CurrentUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: 'USER' | 'ADMIN';
}

export interface SubscriptionWithPlan {
  id: string;
  domain: string | null;
  startDate: Date;
  endDate: Date;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  plan: {
    name: string;
    price: number;
    requiresEnv?: boolean;
    providesDb?: boolean;
  };
  site: Site | null;
}
