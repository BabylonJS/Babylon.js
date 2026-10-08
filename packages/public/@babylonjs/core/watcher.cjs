const chokidar = require("chokidar");
const { exec } = require("child_process");

/**
 * This is a simpler watcher to compile the core package
 * This is a relatively slow process, mainly because of the postcompile script that prepares the package for NPM
 * Note that this will not directly watch changes in shaders, but will recompile the package if a shader is changed using the dev watcher
 *
 * Node 22.22.2 and Node 24.15.0 support loading Chokidar's synchronous ESM entry with require().
 */

let running = false;
let interval = null;
compile();
chokidar
    .watch("../../../dev/core/src", {
        ignored: (file, stats) => !!stats?.isFile() && !file.endsWith(".ts"),
        ignoreInitial: true,
    })
    .on("all", (event, path) => {
        if (!path.endsWith(".ts") || (event !== "add" && event !== "change" && event !== "unlink")) {
            return;
        }
        if (!running) {
            compile();
        } else {
            console.log("Waiting for compilation to finish");
            if (!interval) {
                interval = setInterval(() => {
                    if (!running) {
                        clearInterval(interval);
                        interval = null;
                        compile();
                    }
                }, 1000);
            }
        }
    });

function compile() {
    running = true;
    console.log("Compiling");
    exec("npm run compile", (error, stdout, stderr) => {
        running = false;
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log("Done");
    });
}
