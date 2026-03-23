import { useStore } from "../store";
import { useEffect, useState } from "react";
import { initDatabase } from "../database/sqlite";
import { 
  LoginScreen, 
  Layout, 
  Dashboard, 
  Products, 
  Inventory, 
  Recipes, 
  Sales, 
  Purchases,
  Alerts,
  Reports,
  Users,
  Categories
} from "./components";

function AppContent() {
  const { isAuthenticated, currentView, refresh } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
      } catch (e) {
        console.error("Failed to initialize database:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <Products />;
      case "categories":
        return <Categories />;
      case "inventory":
        return <Inventory />;
      case "recipes":
        return <Recipes />;
      case "sales":
        return <Sales />;
      case "purchases":
        return <Purchases />;
      case "suppliers":
        return <Purchases />;
      case "alerts":
        return <Alerts />;
      case "reports":
        return <Reports />;
      case "users":
        return <Users />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return <AppContent />;
}
