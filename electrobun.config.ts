import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Bakery Inventory",
		identifier: "com.bakery.inventory",
		version: "1.0.0",
	},
	build: {
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
			"node_modules/sql.js/dist/sql-wasm.wasm": "views/mainview/sql-wasm.wasm",
		},
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
