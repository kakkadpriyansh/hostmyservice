import { getPayments, activateSubscription } from "@/app/actions/admin/payments";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default async function PaymentsPage() {
  const result = await getPayments();
  const payments = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display text-white">Payments Management</h1>

      <div className="glass ring-1 ring-white/10 sm:rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-white/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Plan / Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Gateway ID
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {payments?.map((payment: any) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{payment.user?.name || "Unknown"}</div>
                    <div className="text-sm text-gray-400">{payment.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{payment.plan?.name || "Unknown Plan"}</div>
                    <div className="text-sm text-gray-500">₹{payment.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      payment.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      payment.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {payment.status === 'SUCCESS' && <CheckCircle className="h-3 w-3" />}
                      {payment.status === 'PENDING' && <Clock className="h-3 w-3" />}
                      {payment.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {format(new Date(payment.createdAt), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {payment.razorpayPaymentId || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {payment.status !== 'SUCCESS' && (
                        <form action={async () => {
                            "use server";
                            await activateSubscription(payment.id);
                        }}>
                            <button className="text-primary hover:text-white font-medium transition-colors">
                                Force Activate
                            </button>
                        </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No payments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
