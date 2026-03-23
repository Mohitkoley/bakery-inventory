import { useStore } from "../../store";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Shield, Download } from "lucide-react";
import type { User } from "../../database/types";
import { exportToCSV } from "../../utils/export";

export function Users() {
  const { users, loadUsers, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "staff" as "admin" | "manager" | "staff",
    pin: ""
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const updateData: any = { name: formData.name, role: formData.role };
      if (formData.pin) {
        updateData.pin = formData.pin;
      }
      updateUser(editingUser.id, updateData);
    } else {
      addUser({
        name: formData.name,
        role: formData.role,
        pin: formData.pin
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", role: "staff", pin: "" });
    setEditingUser(null);
    setShowModal(false);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      role: user.role,
      pin: ""
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
    }
  };

  const handleExport = async () => {
    const headers = ["Name", "Role", "Created At"];
    const rows = users.map(u => [
      u.name,
      u.role,
      new Date(u.created_at).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    await exportToCSV(`users_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-700";
      case "manager": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500">Manage staff and permissions</p>
        </div>
        {currentUser?.role === "admin" && (
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-semibold text-lg">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{user.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              {currentUser?.role === "admin" && user.id !== currentUser?.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingUser ? "Edit User" : "Add User"}
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
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PIN {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-amber-500"
                  maxLength={4}
                  required={!editingUser}
                  placeholder="4-digit PIN"
                />
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
                  {editingUser ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
