// Export utilities for CSV file downloads using Electrobun RPC
declare global {
  interface Window {
    electrobun: {
      rpc: {
        request: {
          saveFile: (params: { filename: string; content: string }) => Promise<{ success: boolean; path?: string; error?: string }>;
        };
      };
    };
  }
}

export async function exportToCSV(filename: string, csvContent: string): Promise<{ success: boolean; path?: string; error?: string }> {
  // Try RPC first (Electrobun desktop app)
  if (typeof window !== "undefined" && window.electrobun?.rpc) {
    try {
      const result = await window.electrobun.rpc.request.saveFile({
        filename,
        content: csvContent,
      });
      return result;
    } catch (error) {
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