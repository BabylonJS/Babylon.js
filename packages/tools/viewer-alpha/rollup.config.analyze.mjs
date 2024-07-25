import { createConfig } from "./rollup.config.common.mjs";
import terser from "@rollup/plugin-terser";
import { visualizer } from "rollup-plugin-visualizer";

const analyzeConfig = createConfig("dist/analyze");
analyzeConfig.plugins = [...analyzeConfig.plugins, terser(), visualizer({ filename: "dist/analyze/stats.json", template: "raw-data" })];

export default analyzeConfig;
