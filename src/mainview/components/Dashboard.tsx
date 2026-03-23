import { useStore } from "../../store";
import { 
  TrendingUp, TrendingDown, AlertTriangle, Package, 
  DollarSign, ShoppingCart, Clock 
} from "lucide-react";
import { useEffect } from "react";

export function Dashboard() {
  const { dashboardStats, products, rawMaterials, sales, loadDashboardStats, loadProducts, loadRawMaterials, loadSales } = useStore();

  useEffect(() => {
    loadDashboardStats();
    loadProducts();
    loadRawMaterials();
    loadSales();
  }, []);

  const lowStockProducts = products.filter(p => p.stock <= 10);
  const lowStockMaterials = rawMaterials.filter(m => m.stock <= m.min_stock);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalSalesToday}</p>
          <p className="text-sm text-gray-500">Total Sales</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-sm text-amber-600 font-medium">Today</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{dashboardStats.totalRevenueToday.toFixed(2)}</p>
          <p className="text-sm text-gray-500">Revenue</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-red-600 font-medium">Alert</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dashboardStats.lowStockItems}</p>
          <p className="text-sm text-gray-500">Low Stock Items</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-orange-600 font-medium">Warning</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{dashboardStats.expiringItems}</p>
          <p className="text-sm text-gray-500">Expiring Soon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">No low stock products</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{product.stock}</p>
                    <p className="text-xs text-gray-500">units left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Materials</h2>
          {lowStockMaterials.length === 0 ? (
            <p className="text-gray-500 text-sm">No low stock materials</p>
          ) : (
            <div className="space-y-3">
              {lowStockMaterials.slice(0, 5).map(material => (
                <div key={material.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{material.name}</p>
                    <p className="text-sm text-gray-500">Min: {material.min_stock} {material.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{material.stock} {material.unit}</p>
                    <p className="text-xs text-gray-500">current stock</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Sales</h2>
        {sales.length === 0 ? (
          <p className="text-gray-500 text-sm">No sales today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 10).map(sale => (
                  <tr key={sale.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{(sale as any).product_name}</td>
                    <td className="py-3 px-4 text-gray-600">{sale.quantity}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">₹{sale.total_price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sale.payment_method === 'cash' ? 'bg-green-100 text-green-700' :
                        sale.payment_method === 'upi' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {sale.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
