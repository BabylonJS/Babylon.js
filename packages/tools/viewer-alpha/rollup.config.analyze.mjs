import { createConfig } from "./rollup.config.common.mjs";
import terser from "@rollup/plugin-terser";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";
import { visualizer } from "rollup-plugin-visualizer";

const analyzeConfig = createConfig("dist/analyze");
analyzeConfig.plugins = [...analyzeConfig.plugins, terser(), minifyTemplateLiterals(), visualizer({ filename: "dist/analyze/stats.json", template: "raw-data" })];

export default analyzeConfig;
