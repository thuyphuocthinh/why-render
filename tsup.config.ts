import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core/index": "src/core/index.ts",
    "react/index": "src/adapter/react/index.ts",
    "vue/index": "src/adapter/vue/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["react", "vue"],
});
