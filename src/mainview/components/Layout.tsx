import { useStore } from "../../store";
import { 
  LayoutDashboard, Package, ShoppingCart, Utensils, 
  Users, BarChart3, AlertTriangle, LogOut, FileText,
  ChefHat, Cloud, CloudOff, Menu, X, Tags
} from "lucide-react";
import { useState } from "react";
import { isSupabaseConfigured } from "../../services/supabaseClient";

export function Layout({ children }: { children: React.ReactNode }) {
  const { currentUser, currentView, setView, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCloudConfigured = isSupabaseConfigured();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "inventory", label: "Raw Materials", icon: Utensils },
    { id: "recipes", label: "Recipes", icon: ChefHat },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "purchases", label: "Purchases", icon: ShoppingCart },
    { id: "suppliers", label: "Suppliers", icon: Users },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  if (currentUser?.role === "admin") {
    navItems.push({ id: "users", label: "Users", icon: Users });
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 hidden md:flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-800">Bakery</h1>
                <p className="text-xs text-gray-500">Inventory</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  currentView === item.id
                    ? "bg-amber-50 text-amber-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 space-y-2">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isCloudConfigured ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
            {isCloudConfigured ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            {sidebarOpen && <span className="text-sm">{isCloudConfigured ? 'Sync Enabled' : 'Offline Mode'}</span>}
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex-1 md:flex-none"></div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-amber-600 font-semibold">{currentUser?.name.charAt(0)}</span>
            </div>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                    currentView === item.id
                      ? "bg-amber-50 text-amber-600"
                      : "text-gray-600"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
