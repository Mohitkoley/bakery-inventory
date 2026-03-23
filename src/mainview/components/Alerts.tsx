import { useStore } from "../../store";
import { useEffect } from "react";
import { AlertTriangle, Package, Utensils, Clock, ArrowRight } from "lucide-react";

export function Alerts() {
  const { products, rawMaterials, loadProducts, loadRawMaterials, setView } = useStore();

  useEffect(() => {
    loadProducts();
    loadRawMaterials();
  }, []);

  const lowStockProducts = products.filter(p => p.stock <= 10);
  const lowStockMaterials = rawMaterials.filter(m => m.stock <= m.min_stock);
  const expiringProducts = products.filter(p => {
    if (!p.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });
  const expiringMaterials = rawMaterials.filter(m => {
    if (!m.expiry_date) return false;
    const daysUntilExpiry = Math.ceil((new Date(m.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  });

  const totalAlerts = lowStockProducts.length + lowStockMaterials.length + expiringProducts.length + expiringMaterials.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Alerts</h1>
        <p className="text-gray-500">Low stock and expiry warnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{totalAlerts}</span>
          </div>
          <p className="text-sm text-gray-500">Total Alerts</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{lowStockProducts.length}</span>
          </div>
          <p className="text-sm text-gray-500">Low Stock Products</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Utensils className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{lowStockMaterials.length}</span>
          </div>
          <p className="text-sm text-gray-500">Low Stock Materials</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-800">{expiringProducts.length + expiringMaterials.length}</span>
          </div>
          <p className="text-sm text-gray-500">Expiring Soon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Products</h2>
            <button 
              onClick={() => setView("products")}
              className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No low stock products</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{product.stock} units</p>
                    <p className="text-xs text-gray-500">Min: 10</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Materials</h2>
            <button 
              onClick={() => setView("inventory")}
              className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {lowStockMaterials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No low stock materials</p>
          ) : (
            <div className="space-y-3">
              {lowStockMaterials.map(material => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Expiring Products (7 days)</h2>
            <button 
              onClick={() => setView("products")}
              className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {expiringProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expiring products</p>
          ) : (
            <div className="space-y-3">
              {expiringProducts.map(product => {
                const daysLeft = Math.ceil((new Date(product.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.stock} units in stock</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {daysLeft} days left
                      </p>
                      <p className="text-xs text-gray-500">{new Date(product.expiry_date!).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Expiring Materials (7 days)</h2>
            <button 
              onClick={() => setView("inventory")}
              className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {expiringMaterials.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expiring materials</p>
          ) : (
            <div className="space-y-3">
              {expiringMaterials.map(material => {
                const daysLeft = Math.ceil((new Date(material.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{material.name}</p>
                      <p className="text-sm text-gray-500">{material.stock} {material.unit} in stock</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${daysLeft <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {daysLeft} days left
                      </p>
                      <p className="text-xs text-gray-500">{new Date(material.expiry_date!).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
