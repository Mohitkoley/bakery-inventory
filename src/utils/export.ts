import { Electroview, type RPCSchema } from "electrobun/view";

// Define RPC schema for type-safe communication (matches src/bun/index.ts)
type AppRPC = {
  bun: RPCSchema<{
    requests: {
      saveFile: {
        params: { filename: string; content: string };
        response: { success: boolean; path?: string; error?: string };
      };
    };
    messages: {};
  }>;
  webview: RPCSchema<{
    requests: {};
    messages: {};
  }>;
};

let electroview: Electroview<any> | null = null;

if (typeof window !== "undefined" && window.__electrobun) {
  try {
    const rpc = Electroview.defineRPC<AppRPC>({
      handlers: {
        requests: {},
        messages: {},
      },
    });
    electroview = new Electroview({ rpc });
  } catch (err) {
    console.error("Failed to initialize Electroview", err);
  }
}

export async function exportToCSV(filename: string, csvContent: string): Promise<{ success: boolean; path?: string; error?: string }> {
  // Try RPC first (Electrobun desktop app)
  if (electroview && electroview.rpc) {
    try {
      const result = await electroview.rpc.request.bun.saveFile({
        filename,
        content: csvContent,
      });
      return result;
    } catch (error) {
      console.error("Electrobun RPC error:", error);
      return { success: false, error: String(error) };
    }
  }

  // Fallback to browser download (for development in browser)
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  return { success: true };
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));
  return [headerLine, ...dataLines].join("\n");
}