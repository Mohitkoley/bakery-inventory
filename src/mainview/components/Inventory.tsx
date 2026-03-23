import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, X, Download } from "lucide-react";
import type { RawMaterial } from "../../database/types";
import { exportToCSV } from "../../utils/export";

const units = ["kg", "grams", "liters", "ml", "pieces", "dozen", "packets"];

export function Inventory() {
  const { rawMaterials, loadRawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    stock: 0,
    min_stock: 0,
    expiry_date: ""
  });

  useEffect(() => {
    loadRawMaterials();
  }, []);

  const filteredMaterials = rawMaterials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMaterial) {
      updateRawMaterial(editingMaterial.id, {
        name: formData.name,
        unit: formData.unit,
        stock: formData.stock,
        min_stock: formData.min_stock,
        expiry_date: formData.expiry_date || null
      });
    } else {
      addRawMaterial({
        name: formData.name,
        unit: formData.unit,
        stock: formData.stock,
        min_stock: formData.min_stock,
        expiry_date: formData.expiry_date || null
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", unit: "kg", stock: 0, min_stock: 0, expiry_date: "" });
    setEditingMaterial(null);
    setShowModal(false);
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      stock: material.stock,
      min_stock: material.min_stock,
      expiry_date: material.expiry_date || ""
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteRawMaterial(id);
    }
  };

  const handleExport = async () => {
    const headers = ["Name", "Unit", "Stock", "Min Stock", "Expiry Date"];
    const rows = filteredMaterials.map(m => [
      m.name,
      m.unit,
      String(m.stock),
      String(m.min_stock),
      m.expiry_date || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    await exportToCSV(`raw_materials_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Raw Materials</h1>
          <p className="text-gray-500">Manage inventory of ingredients and supplies</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Material
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Unit</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Min Stock</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expiry</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No materials found</td>
                </tr>
              ) : (
                filteredMaterials.map(material => (
                  <tr key={material.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{material.name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{material.unit}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${material.stock <= material.min_stock ? 'text-red-600' : 'text-gray-800'}`}>
                        {material.stock} {material.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{material.min_stock} {material.unit}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">
                      {material.expiry_date ? new Date(material.expiry_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
              <h2 className="text-xl font-semibold text-gray-800">
                {editingMaterial ? "Edit Material" : "Add Material"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  placeholder="e.g., All Purpose Flour"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white text-gray-700"
                    style={{ colorScheme: 'light' }}
                  />
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
                  {editingMaterial ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
