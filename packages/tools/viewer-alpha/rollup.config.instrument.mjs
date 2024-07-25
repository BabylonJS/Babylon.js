import { createConfig } from "./rollup.config.common.mjs";

const instrumentConfig = createConfig("dist/coverage/original");

export default instrumentConfig;
