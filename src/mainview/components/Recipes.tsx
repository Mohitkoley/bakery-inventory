import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Download } from "lucide-react";
import { recipesRepository, rawMaterialsRepository } from "../../database/repositories";
import type { RecipeWithMaterial } from "../../database/types";
import { exportToCSV } from "../../utils/export";

export function Recipes() {
  const { products, loadProducts } = useStore();
  const [recipes, setRecipes] = useState<RecipeWithMaterial[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [formData, setFormData] = useState({
    material_id: 0,
    quantity_required: 0
  });
  const rawMaterials = rawMaterialsRepository.getAll();

  useEffect(() => {
    loadProducts();
    loadAllRecipes();
  }, []);

  const loadAllRecipes = () => {
    setRecipes(recipesRepository.getAll());
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProduct(productId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    if (editingRecipe) {
      recipesRepository.update(editingRecipe.id, {
        material_id: formData.material_id,
        quantity_required: formData.quantity_required
      });
    } else {
      recipesRepository.create({
        product_id: selectedProduct,
        material_id: formData.material_id,
        quantity_required: formData.quantity_required
      });
    }
    resetForm();
    loadAllRecipes();
  };

  const resetForm = () => {
    setFormData({ material_id: 0, quantity_required: 0 });
    setEditingRecipe(null);
    setShowModal(false);
  };

  const handleEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setFormData({
      material_id: recipe.material_id,
      quantity_required: recipe.quantity_required
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this recipe item?")) {
      recipesRepository.delete(id);
      loadAllRecipes();
    }
  };

  const handleExport = async () => {
    const headers = ["Product", "Material", "Quantity Required"];
    const rows = recipes.map(r => [
      r.product_name,
      r.material_name,
      String(r.quantity_required)
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    await exportToCSV(`recipes_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  const groupedRecipes = recipes.reduce((acc, recipe) => {
    if (!acc[recipe.product_id]) {
      acc[recipe.product_id] = [];
    }
    acc[recipe.product_id].push(recipe);
    return acc;
  }, {} as Record<number, RecipeWithMaterial[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recipes</h1>
          <p className="text-gray-500">Define ingredients required for each product</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => handleProductSelect(product.id)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              selectedProduct === product.id
                ? "border-amber-500 bg-amber-50"
                : "border-gray-200 bg-white hover:border-amber-300"
            }`}
          >
            <h3 className="font-semibold text-gray-800">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category}</p>
            <p className="text-sm text-amber-600 mt-1">₹{product.price.toFixed(2)}</p>
          </button>
        ))}
      </div>

      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recipe for: {products.find(p => p.id === selectedProduct)?.name}
            </h2>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Ingredient
            </button>
          </div>

          {groupedRecipes[selectedProduct]?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No ingredients defined yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Material</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRecipes[selectedProduct]?.map(recipe => (
                    <tr key={recipe.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-800">{recipe.material_name}</td>
                      <td className="py-3 px-4 text-gray-800">{recipe.quantity_required} {recipe.material_unit}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(recipe)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(recipe.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingRecipe ? "Edit Ingredient" : "Add Ingredient"}
              </h2>
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
                    <option key={mat.id} value={mat.id}>{mat.name} ({mat.unit})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Required</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity_required}
                  onChange={(e) => setFormData({ ...formData, quantity_required: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                >
                  {editingRecipe ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
