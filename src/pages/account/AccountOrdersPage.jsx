import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchOrders } from '../../lib/accountApi';
import OrderCard from '../../components/account/OrderCard';

export default function AccountOrdersPage() {
  const { user, supabase } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) return;
    fetchOrders(supabase, user.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [supabase, user]);

  if (loading) {
    return <p className="font-body text-sm text-ink-subtle">Loading orders…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="panel panel-padding text-center">
        <p className="font-display text-2xl text-wine mb-3">No orders yet</p>
        <p className="font-body text-sm text-ink-muted mb-6">
          Your purchase history will show up here after checkout.
        </p>
        <Link to="/products" className="btn-primary inline-flex">
          Shop templates
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl text-wine mb-4">All orders</h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
