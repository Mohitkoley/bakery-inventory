import { useState } from "react";
import { useStore } from "../../store";
import { ChefHat } from "lucide-react";

export function LoginScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useStore(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const success = await login(pin);
      if (!success) {
        setError("Invalid PIN");
        setPin("");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Bakery Inventory</h1>
          <p className="text-gray-500 mt-2">Enter your PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:outline-none"
              maxLength={4}
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 4}
            className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 text-center">Demo PINs:</p>
          <div className="flex justify-center gap-4 mt-2 text-sm">
            <span className="px-2 py-1 bg-white rounded">Admin: 1234</span>
            <span className="px-2 py-1 bg-white rounded">Manager: 5678</span>
            <span className="px-2 py-1 bg-white rounded">Staff: 0000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
