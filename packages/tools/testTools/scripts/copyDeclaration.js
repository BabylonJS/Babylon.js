const fs = require("fs");
const path = require("path");

fs.copyFileSync(
    path.resolve(__dirname, "../src/window.d.ts"),
    path.resolve(__dirname, "../dist/window.d.ts")
)