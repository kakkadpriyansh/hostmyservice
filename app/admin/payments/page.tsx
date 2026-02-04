import { getPayments, activateSubscription } from "@/app/actions/admin/payments";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default async function PaymentsPage() {
  const result = await getPayments();
  const payments = result.success ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan / Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gateway ID
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {payments?.map((payment: any) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payment.user?.name || "Unknown"}</div>
                    <div className="text-sm text-gray-500">{payment.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.plan?.name || "Unknown Plan"}</div>
                    <div className="text-sm text-gray-500">₹{payment.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      payment.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 
                      payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status === 'SUCCESS' && <CheckCircle className="h-3 w-3" />}
                      {payment.status === 'PENDING' && <Clock className="h-3 w-3" />}
                      {payment.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">
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
              <p className="text-gray-500">No payments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
