/* eslint-disable no-console */
import { checkArgs, findRootDirectory } from "./utils.js";
import { spawn } from "child_process";

// npx build-tools -c dw -p "core,gui" -wd -wa
// npx build-tools -c dw  -wd -wa -s --https

// eslint-disable-next-line @typescript-eslint/naming-convention
export const devWatch = () => {
    // read the options
    const pkgArg = checkArgs(["-p", "--packages"], false, true);
    const packages = pkgArg && typeof pkgArg === "string" ? pkgArg.split(",") : ["all"];
    console.log(`Packages: ${packages.join(", ")}`);
    const watchDeclarations = checkArgs(["-wd", "--watch-declarations"], true);
    const watchAssets = checkArgs(["-ws", "--watch-shaders", "-wa", "--watch-assets"], true);
    const serve = checkArgs(["-s", "--serve"], true);
    const https = checkArgs(["-https", "--https"], true);
    const skipCompilation = checkArgs(["-sc", "--skip-compilation"], true);

    const processes: { command: string; name: string; arguments: string[]; optional?: boolean }[] = [];
    const processedPackages: string[] = [];
    // start running the processes needed
    if (packages[0] === "all") {
        // global watchers
        if (!skipCompilation) {
            processes.push({
                command: "npm",
                arguments: ["run", "watch:source:dev"],
                name: "typescript-all",
            });
        }
        if (watchAssets) {
            processes.push({
                command: "npm",
                arguments: ["run", "watch:assets"],
                name: "assets-all",
            });
        }
    } else {
        packages.forEach((p) => {
            if (p[0] !== "@") {
                p = `@dev/${p}`;
            }
            if (!skipCompilation) {
                processes.push({
                    command: "npm",
                    arguments: ["run", `watch:source`, "-w", p],
                    name: `typescript-${p}`,
                });
            }
            if (watchAssets) {
                processes.push({
                    command: "npm",
                    arguments: ["run", `watch:assets`, "-w", p],
                    name: `assets-${p}`,
                    optional: true,
                });
            }
            processedPackages.push(p);
        });
    }

    if (watchDeclarations) {
        const filter = processedPackages.join(",");
        const filterAddition = processedPackages.length === 0 ? [] : ["--", "--filter", filter];
        processes.push({
            // npm run watch:declaration -w @tools/babylon-server
            command: "npm",
            arguments: ["run", "watch:declaration:dev", "-w", "@tools/babylon-server", ...filterAddition],
            name: "declaration",
        });
    }

    if (serve) {
        const httpsArgs = https ? ["--server-type", "https", "--host", "::"] : [];
        processes.push({
            command: "npm",
            arguments: ["run", "serve", "-w", "@tools/babylon-server", "--", ...httpsArgs],
            name: "serve",
        });
    }

    // find the base path to run the commands. Should be the root!
    // let localPackageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./package.json")).toString());
    // let basePath = process.cwd();
    // while (localPackageJSON.name !== "@babylonjs/root") {
    //     process.chdir("..");
    //     if (basePath === process.cwd()) {
    //         throw new Error("Could not find the root package.json");
    //     }
    //     basePath = process.cwd();
    //     try {
    //         localPackageJSON = JSON.parse(fs.readFileSync(path.join(process.cwd(), "./package.json")).toString());
    //     } catch (e) {}
    // }

    const rootPath = findRootDirectory();

    if (processes.length) {
        processes.forEach((p) => {
            console.log(`Starting ${p.name}`, p.command, p.arguments);
            const child = spawn(p.command, p.arguments, { shell: true, cwd: rootPath });

            if (!child || !child.stdout || !child.stderr) {
                return;
            }

            child.stdout.setEncoding("utf8");
            child.stdout.on("data", function (data) {
                console.log("\x1b[36m", `[${p.name}]`, "\x1b[0m", data);
            });

            child.stderr.setEncoding("utf8");
            child.stderr.on("data", function (data) {
                console.log("\x1b[31m", `[${p.name}]`, "\x1b[0m", data);
            });

            child.on("close", function (code) {
                // callback(scriptOutput, code);
                console.log(p.name, "exit", code);
            });
        });
    }
};
