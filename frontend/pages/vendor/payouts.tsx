import useSWR from 'swr';
import { Layout } from '../../components/Layout';
import { ProtectedPage } from '../../components/ProtectedPage';
import { useAuth } from '../../lib/useAuth';
import { api } from '../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const { data: payouts, error } = useSWR(user ? '/store/payouts/' : null, fetcher);

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Payout History">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Payout History</h2>
            <p className="mt-2 text-slate-600">Review completed and scheduled vendor payouts.</p>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            {error ? (
              <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">
                {/* Map known API errors to helpful messages */}
                {error.response?.status === 404
                  ? 'Payout history endpoint not found.'
                  : error.response?.status === 401
                  ? 'Authentication token expired. Please login again.'
                  : error.response?.data?.message
                  ? error.response.data.message
                  : 'Unable to load payout history.'}
              </div>
            ) : !payouts ? (
              <div className="text-slate-500">Loading payout history...</div>
            ) : payouts.length === 0 ? (
              <div className="text-slate-500">No payouts have been made yet.</div>
            ) : (
              <div className="space-y-4">
                {payouts.slice().sort((a: any, b: any) => {
                  const aDate = a.processed_at || a.created_at;
                  const bDate = b.processed_at || b.created_at;
                  return new Date(bDate).getTime() - new Date(aDate).getTime();
                }).map((payout: any) => (
                  <article key={payout.id} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="text-lg font-semibold text-slate-900">{payout.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Amount</p>
                        <p className="text-lg font-semibold text-slate-900">฿{Number(payout.amount || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Processed</p>
                        <p className="text-lg font-semibold text-slate-900">{payout.processed_at ? new Date(payout.processed_at).toLocaleString() : 'Pending'}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-sm text-slate-500">Reference</p>
                        <p className="text-sm text-slate-700">{payout.reference_number || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Payout method</p>
                        <p className="text-sm text-slate-700">{payout.payout_method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Destination</p>
                        <p className="text-sm text-slate-700">
                          {payout.promptpay_id
                            ? `PromptPay • ${payout.promptpay_id}`
                            : payout.bank_name
                            ? `${payout.bank_name} • ${payout.account_name || payout.bank_account_holder} • ${payout.account_number || payout.bank_account_number}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    {payout.notes ? <p className="mt-4 text-sm text-slate-500">{payout.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </Layout>
    </ProtectedPage>
  );
}
