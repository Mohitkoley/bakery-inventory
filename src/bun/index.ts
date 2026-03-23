import { BrowserWindow, BrowserView, Updater, Utils, type RPCSchema } from "electrobun/bun";
import { join } from "path";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Define RPC schema for type-safe communication
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

// Create RPC handler
const rpc = BrowserView.defineRPC<AppRPC>({
  maxRequestTime: 5000,
  handlers: {
    requests: {
      saveFile: async ({ filename, content }) => {
        try {
          // Save to Downloads folder
          const savePath = join(Utils.paths.downloads, filename);
          await Bun.write(savePath, content);
          return { success: true, path: savePath };
        } catch (error) {
          return { success: false, error: String(error) };
        }
      },
    },
    messages: {},
  },
});

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Create the main application window
const url = await getMainViewUrl();

const mainWindow = new BrowserWindow({
	title: "Bakery Inventory",
	url,
	frame: {
		width: 1100,
		height: 750,
		x: 100,
		y: 100,
	},
	rpc,
});

console.log("Bakery Inventory app started!");
