import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Download } from "lucide-react";
import type { Supplier } from "../../database/types";
import { purchasesRepository, suppliersRepository } from "../../database/repositories";
import type { PurchaseWithMaterial } from "../../database/types";
import { exportToCSV } from "../../utils/export";

export function Purchases() {
  const { rawMaterials, loadRawMaterials, suppliers, loadSuppliers } = useStore();
  const [purchases, setPurchases] = useState<PurchaseWithMaterial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseWithMaterial | null>(null);
  const [formData, setFormData] = useState({
    material_id: 0,
    supplier_id: null as number | null,
    quantity: 0,
    unit_cost: 0
  });
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact: "",
    email: "",
    address: ""
  });

  useEffect(() => {
    loadRawMaterials();
    loadSuppliers();
    loadPurchases();
  }, []);

  const loadPurchases = () => {
    setPurchases(purchasesRepository.getAll());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total_cost = formData.quantity * formData.unit_cost;
    
    if (editingPurchase) {
      const oldPurchase = purchasesRepository.getById(editingPurchase.id);
      if (oldPurchase) {
        purchasesRepository.delete(editingPurchase.id);
      }
    }
    
    purchasesRepository.create({
      material_id: formData.material_id,
      supplier_id: formData.supplier_id,
      quantity: formData.quantity,
      unit_cost: formData.unit_cost,
      total_cost
    });
    
    resetForm();
    loadPurchases();
    loadRawMaterials();
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    suppliersRepository.create(supplierForm);
    setSupplierForm({ name: "", contact: "", email: "", address: "" });
    setShowSupplierModal(false);
    loadSuppliers();
  };

  const resetForm = () => {
    setFormData({ material_id: 0, supplier_id: null, quantity: 0, unit_cost: 0 });
    setEditingPurchase(null);
    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this purchase?")) {
      purchasesRepository.delete(id);
      loadPurchases();
      loadRawMaterials();
    }
  };

  const handleExport = async () => {
    const headers = ["Material", "Supplier", "Quantity", "Unit Cost", "Total Cost", "Date"];
    const rows = purchases.map(p => [
      p.material_name,
      p.supplier_name || "",
      String(p.quantity),
      String(p.unit_cost),
      String(p.total_cost),
      new Date(p.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    await exportToCSV(`purchases_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>
          <p className="text-gray-500">Record purchases from suppliers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Add Supplier
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Purchase
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800">{supplier.name}</h3>
            {supplier.contact && <p className="text-sm text-gray-500">{supplier.contact}</p>}
            {supplier.email && <p className="text-sm text-gray-500">{supplier.email}</p>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Material</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Supplier</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Qty</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Unit Cost</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">No purchases found</td>
                </tr>
              ) : (
                purchases.map(purchase => (
                  <tr key={purchase.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-800">{purchase.material_name}</td>
                    <td className="py-3 px-4 text-gray-600">{purchase.supplier_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-800">{purchase.quantity}</td>
                    <td className="py-3 px-4 text-gray-800">₹{purchase.unit_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">₹{purchase.total_cost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(purchase.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">New Purchase</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={formData.material_id}
                  onChange={(e) => setFormData({ ...formData, material_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value={0}>Select material</option>
                  {rawMaterials.map(mat => (
                    <option key={mat.id} value={mat.id}>{mat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={formData.supplier_id || ""}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select supplier (optional)</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="font-semibold text-gray-800">₹{(formData.quantity * formData.unit_cost).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add Supplier</h2>
              <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
