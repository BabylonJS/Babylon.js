import { createConfig } from "./rollup.config.common.mjs";
import terser from "@rollup/plugin-terser";
import minifyHTMLModule from "rollup-plugin-minify-html-literals";
import { visualizer } from "rollup-plugin-visualizer";

const minifyHTML = minifyHTMLModule.default;

const analyzeConfig = createConfig("dist/analyze");
analyzeConfig.plugins = [...analyzeConfig.plugins, terser(), minifyHTML(), visualizer({ filename: "dist/analyze/stats.json", template: "raw-data" })];

export default analyzeConfig;
