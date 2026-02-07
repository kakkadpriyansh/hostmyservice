"use client";

import { useState, useEffect } from "react";
import { getUsers } from "@/app/actions/admin/users";
import { UserForm } from "@/components/admin/user-form";
import { Plus, User as UserIcon } from "lucide-react";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  createdAt: Date;
  _count: {
    subscriptions: number;
    sites: number;
  };
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!isFormOpen) {
      loadUsers();
    }
  }, [isFormOpen]);

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-white">Client Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-black transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
        >
          <Plus className="h-4 w-4" />
          Create Client
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 glass">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Subscriptions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${
                      user.role === "ADMIN"
                        ? "bg-secondary/20 text-secondary border border-secondary/20"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {user.phoneNumber || "N/A"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-300">
                    {user.city ? `${user.city}, ${user.country}` : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500">
                     {user.address}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                  {user._count.subscriptions} active
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && <UserForm onClose={() => setIsFormOpen(false)} />}
    </div>
  );
}
