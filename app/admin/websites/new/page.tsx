import { getPlans } from "@/app/actions/admin/plans";
import { getUsers } from "@/app/actions/admin/users";
import { WebsiteForm } from "@/components/admin/website-form";

export default async function NewWebsitePage() {
  const [users, plans] = await Promise.all([getUsers(), getPlans()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Add New Website</h1>
      <div className="bg-white shadow sm:rounded-lg p-6">
        <WebsiteForm users={users} plans={plans} />
      </div>
    </div>
  );
}
