import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Package, Utensils, Download } from "lucide-react";
import { categoriesRepository } from "../../database/repositories";
import { exportToCSV } from "../../utils/export";

type CategoryType = 'product' | 'material';

export function Categories() {
  const [categories, setCategories] = useState<{ id: number; name: string; type: CategoryType }[]>([]);
  const [activeTab, setActiveTab] = useState<CategoryType>('product');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: number; name: string; type: CategoryType } | null>(null);
  const [formData, setFormData] = useState({ name: "", type: 'product' as CategoryType });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const cats = categoriesRepository.getAll() as { id: number; name: string; type: CategoryType }[];
    setCategories(cats);
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      categoriesRepository.update(editingCategory.id, formData.name);
    } else {
      categoriesRepository.create(formData);
    }
    
    resetForm();
    loadCategories();
  };

  const resetForm = () => {
    setFormData({ name: "", type: activeTab });
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleEdit = (category: { id: number; name: string; type: CategoryType }) => {
    setEditingCategory(category);
    setFormData({ name: category.name, type: category.type });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      categoriesRepository.delete(id);
      loadCategories();
    }
  };

  const handleExport = async () => {
    const headers = ["Name", "Type"];
    const rows = filteredCategories.map(c => [c.name, c.type]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    await exportToCSV(`categories_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500">Manage product and material categories</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", type: activeTab });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 inline-flex">
        <button
          onClick={() => setActiveTab('product')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'product'
              ? "bg-amber-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Package className="w-5 h-5" />
          Product Categories
        </button>
        <button
          onClick={() => setActiveTab('material')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'material'
              ? "bg-amber-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Utensils className="w-5 h-5" />
          Material Categories
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">No categories found</td>
                </tr>
              ) : (
                filteredCategories.map(category => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{category.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.type === 'product' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {category.type === 'product' ? 'Product' : 'Material'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
                {editingCategory ? "Edit Category" : "Add Category"}
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
                  placeholder="e.g., Cakes, Breads..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CategoryType })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  disabled={!!editingCategory}
                >
                  <option value="product">Product</option>
                  <option value="material">Material</option>
                </select>
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
                  {editingCategory ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
