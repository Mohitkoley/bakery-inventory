import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingCart, DollarSign, CreditCard, Smartphone, Download, Calendar } from "lucide-react";
import type { Product, Sale } from "../../database/types";
import { exportToCSV } from "../../utils/export";

interface CartItem {
  product: Product;
  quantity: number;
}

export function Sales() {
  const { products, loadProducts, addSale, deleteSale, sales, loadSales } = useStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  useEffect(() => {
    loadProducts();
    loadSales();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        setCart(cart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else if (newQty <= item.product.stock) {
      setCart(cart.map(i => 
        i.product.id === productId 
          ? { ...i, quantity: newQty }
          : i
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const newSale = addSale({
      product_id: cart[0].product.id,
      quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
      unit_price: cart[0].product.price,
      total_price: cartTotal,
      payment_method: paymentMethod
    });

    setLastSale(newSale);
    setCart([]);
    setShowReceipt(true);
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastSale(null);
  };

  const handleExportSales = () => {
    const headers = ["ID", "Product Name", "Quantity", "Unit Price", "Total Price", "Payment Method", "Date"];
    const rows = sales.map(sale => [
      sale.id,
      products.find(p => p.id === sale.product_id)?.name || "Unknown",
      sale.quantity,
      sale.unit_price,
      sale.total_price,
      sale.payment_method,
      sale.created_at || ""
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    exportToCSV("todays_sales.csv", csvContent);
  };

  const todayTotal = sales.reduce((sum, sale) => sum + sale.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
          <p className="text-gray-500">Point of Sale - Create new orders</p>
        </div>
        <div className="flex items-center gap-3">
          {sales.length > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Today: ₹{todayTotal.toFixed(2)}</span>
            </div>
          )}
          {sales.length > 0 && (
            <button
              onClick={handleExportSales}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Sales
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock === 0}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  product.stock === 0
                    ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 bg-white hover:border-amber-400 hover:shadow-md"
                }`}
              >
                <h3 className="font-semibold text-gray-800 text-sm truncate">{product.name}</h3>
                <p className="text-lg font-bold text-amber-600">₹{product.price.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Stock: {product.stock}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-800">Cart</h2>
            <span className="ml-auto bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-sm font-medium">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
                    <p className="text-sm text-gray-500">₹{item.product.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between text-lg font-semibold mb-4">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 ${
                    paymentMethod === "cash" ? "border-green-500 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 ${
                    paymentMethod === "upi" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">UPI</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 ${
                    paymentMethod === "card" ? "border-purple-500 bg-purple-50" : "border-gray-200"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Complete Sale
            </button>
          </div>
        </div>
      </div>

      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Sale Complete!</h2>
              <p className="text-gray-500">Thank you for your purchase</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-gray-800">₹{lastSale?.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment</span>
                <span className="font-medium text-gray-800 uppercase">{lastSale?.payment_method}</span>
              </div>
            </div>

            <button
              onClick={closeReceipt}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
