import config from "./rollup.config.analyze.mjs";

config.output.file = "dist/analyze/bundle/index.js";
delete config.output.dir;
config.output.preserveModules = false;

export default config;
