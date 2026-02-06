 "use server";
 
 import prisma from "@/lib/prisma";
 import { getServerSession } from "next-auth";
 import { authOptions } from "@/lib/auth";
 import { SubscriptionWithPlan } from "@/types";
 
 export async function getClientSubscriptions(): Promise<SubscriptionWithPlan[]> {
   const session = await getServerSession(authOptions);
   if (!session?.user?.id) {
     throw new Error("Unauthorized");
   }
 
   try {
     const subscriptions = await prisma.subscription.findMany({
       where: { userId: session.user.id },
       include: {
         site: true,
         plan: true,
       },
       orderBy: { createdAt: "desc" },
     });
 
     return subscriptions.map((sub) => ({
       id: sub.id,
       domain: sub.site?.domain || null,
       startDate: sub.startDate,
       endDate: sub.endDate,
       status: sub.status as any,
       plan: {
         name: sub.plan.name,
         price: sub.plan.price,
         requiresEnv: (sub.plan as any).requiresEnv,
         providesDb: (sub.plan as any).providesDb,
       },
       site: sub.site,
     }));
   } catch (error) {
     console.error("Failed to fetch client subscriptions:", error);
     return [];
   }
 }
