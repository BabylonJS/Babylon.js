import config from "./rollup.config.analyze.mjs";

// Output to a single bundled file to make it easy to verify total size and that everything needed to run is being included
config.output.file = "dist/analyze/bundle/index.js";
delete config.output.dir;
config.output.preserveModules = false;

export default config;
