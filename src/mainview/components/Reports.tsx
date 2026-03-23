import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Download, BarChart3, TrendingUp, Calendar } from "lucide-react";
import { productsRepository, rawMaterialsRepository, salesRepository, purchasesRepository } from "../../database/repositories";
import { exportToCSV } from "../../utils/export";

type ReportType = "sales" | "inventory" | "purchases";

export function Reports() {
  const { products, rawMaterials, loadProducts, loadRawMaterials } = useStore();
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadRawMaterials();
    loadReportData();
  }, [reportType, startDate, endDate]);

  const loadReportData = () => {
    if (reportType === "sales") {
      const sales = salesRepository.getByDateRange(startDate, endDate + " 23:59:59");
      setSalesData(sales);
    } else if (reportType === "purchases") {
      const purchases = purchasesRepository.getByDateRange(startDate, endDate + " 23:59:59");
      setPurchaseData(purchases);
    }
  };

  const handleExport = async () => {
    let csvContent = "";
    let filename = "";

    if (reportType === "sales") {
      csvContent = "Product,Quantity,Unit Price,Total Price,Payment Method,Date\n";
      salesData.forEach(sale => {
        csvContent += `"${(sale as any).product_name}",${sale.quantity},${sale.unit_price},${sale.total_price},${sale.payment_method},${new Date(sale.created_at).toLocaleDateString()}\n`;
      });
      filename = `sales_report_${startDate}_${endDate}.csv`;
    } else if (reportType === "inventory") {
      csvContent = "Name,Category,Stock,Unit,Expiry Date\n";
      products.forEach(p => {
        csvContent += `"${p.name}","${p.category}",${p.stock},units,${p.expiry_date || ""}\n`;
      });
      rawMaterials.forEach(m => {
        csvContent += `"${m.name}","Raw Material",${m.stock},${m.unit},${m.expiry_date || ""}\n`;
      });
      filename = `inventory_report_${startDate}.csv`;
    } else if (reportType === "purchases") {
      csvContent = "Material,Supplier,Quantity,Unit Cost,Total Cost,Date\n";
      purchaseData.forEach(p => {
        csvContent += `"${p.material_name}","${p.supplier_name || ""}",${p.quantity},${p.unit_cost},${p.total_cost},${new Date(p.created_at).toLocaleDateString()}\n`;
      });
      filename = `purchases_report_${startDate}_${endDate}.csv`;
    }

    await exportToCSV(filename, csvContent);
  };

  const totalSales = salesData.reduce((sum, s) => sum + s.total_price, 0);
  const totalPurchases = purchaseData.reduce((sum, p) => sum + p.total_cost, 0);
  const netProfit = totalSales - totalPurchases;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-500">Analytics and data export</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType("sales")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === "sales" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Sales
            </button>
            <button
              onClick={() => setReportType("inventory")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === "inventory" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setReportType("purchases")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === "purchases" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Purchases
            </button>
          </div>

          <div className="flex items-center gap-2 md:ml-auto">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white text-gray-700"
              style={{ colorScheme: 'light' }}
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white text-gray-700"
              style={{ colorScheme: 'light' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{totalSales.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Total Purchases</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">₹{totalPurchases.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-5 h-5 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <span className="text-sm text-gray-500">Net Profit</span>
          </div>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{Math.abs(netProfit).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {reportType === "sales" ? "Sales Report" : reportType === "inventory" ? "Inventory Report" : "Purchase Report"}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {reportType === "sales" && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  </>
                )}
                {reportType === "purchases" && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Material</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Supplier</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  </>
                )}
                {reportType === "inventory" && (
                  <>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expiry</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {reportType === "sales" && (salesData.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No sales data</td></tr>
              ) : (
                salesData.map(sale => (
                  <tr key={sale.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{(sale as any).product_name}</td>
                    <td className="py-3 px-4 text-gray-600">{sale.quantity}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">₹{sale.total_price.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{sale.payment_method}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{new Date(sale.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ))}
              {reportType === "purchases" && (purchaseData.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No purchase data</td></tr>
              ) : (
                purchaseData.map(purchase => (
                  <tr key={purchase.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{purchase.material_name}</td>
                    <td className="py-3 px-4 text-gray-600">{purchase.supplier_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-800">{purchase.quantity}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">₹{purchase.total_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{new Date(purchase.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ))}
              {reportType === "inventory" && (
                <>
                  {products.map(p => (
                    <tr key={`p-${p.id}`} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{p.name}</td>
                      <td className="py-3 px-4 text-gray-600">{p.category}</td>
                      <td className="py-3 px-4 text-gray-800">{p.stock} units</td>
                      <td className="py-3 px-4 text-gray-500">{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                  {rawMaterials.map(m => (
                    <tr key={`m-${m.id}`} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{m.name}</td>
                      <td className="py-3 px-4 text-gray-600">Raw Material</td>
                      <td className="py-3 px-4 text-gray-800">{m.stock} {m.unit}</td>
                      <td className="py-3 px-4 text-gray-500">{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
