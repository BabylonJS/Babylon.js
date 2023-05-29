const { statSync, writeFileSync } = require("fs-extra");
const glob = require("glob");
const path = require("path");

const sizes = {};
glob.sync("./dist/**/*.js").forEach((file) => {
    const stats = statSync(file);
    console.log(`${file} - ${stats.size}`);
    const filename = path.basename(file);
    sizes[filename] = stats.size;
});

writeFileSync("./dist/fileSizes.json", JSON.stringify(sizes, null, 2));
