import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getLoyaltyBalance, getLoyaltyTransactions } from '../services/api';
import { FiAward, FiClock, FiArrowUp, FiArrowDown } from 'react-icons/fi';

export default function Loyalty() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [balRes, txRes] = await Promise.all([
          getLoyaltyBalance(),
          getLoyaltyTransactions(),
        ]);
        setBalance(balRes.data.points_balance);
        setTransactions(txRes.data);
      } catch (err) {
        toast.error('Failed to load loyalty data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">Loading...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FiAward className="w-6 h-6 text-yellow-500" /> Loyalty Rewards
      </h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg mb-8">
        <p className="text-sm opacity-80">Available Points</p>
        <p className="text-4xl font-extrabold mt-1">{balance}</p>
        <p className="text-xs opacity-75 mt-2">1 point = ₹1 discount</p>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <h2 className="font-semibold text-lg text-gray-800 mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  {tx.points_earned > 0 ? (
                    <FiArrowUp className="w-5 h-5 text-green-500" />
                  ) : (
                    <FiArrowDown className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      <FiClock className="inline w-3 h-3 mr-1" />
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.points_earned > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.points_earned > 0 ? `+${tx.points_earned}` : `-${tx.points_used}`} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}