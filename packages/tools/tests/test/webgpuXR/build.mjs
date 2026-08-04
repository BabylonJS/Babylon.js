// Bundles Babylon core (from the live working-copy source) into a single global for the harness page.
// Bundling straight from src/ is deliberate: the harness must exercise the code you are editing, with no
// build/publish step in between.
import * as esbuild from "esbuild";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// .../packages/tools/tests/test/webgpuXR -> repo root
const repo = process.env.BJS_REPO || path.resolve(here, "../../../../..");
const pkgs = path.join(repo, "packages");

const aliasPlugin = {
    name: "bjs-alias",
    setup(build) {
        const map = [
            ["core/", path.join(pkgs, "dev/core/src/")],
            ["gui/", path.join(pkgs, "dev/gui/src/")],
            ["loaders/", path.join(pkgs, "dev/loaders/src/")],
            ["serializers/", path.join(pkgs, "dev/serializers/src/")],
            ["materials/", path.join(pkgs, "dev/materials/src/")],
            ["addons/", path.join(pkgs, "dev/addons/src/")],
        ];
        build.onResolve({ filter: /^(core|gui|loaders|serializers|materials|addons)\// }, (args) => {
            for (const [prefix, target] of map) {
                if (args.path.startsWith(prefix)) {
                    const base = target + args.path.slice(prefix.length);
                    for (const cand of [base + ".ts", base + ".tsx", base + "/index.ts", base + ".js"]) {
                        if (fs.existsSync(cand)) {
                            return { path: cand };
                        }
                    }
                    return { path: base };
                }
            }
            return null;
        });
        // Optional native/asset deps that are irrelevant to the XR render path.
        build.onResolve({ filter: /^draco3dgltf$/ }, () => ({ path: "draco3dgltf", namespace: "bjs-stub" }));
        build.onLoad({ filter: /.*/, namespace: "bjs-stub" }, () => ({
            contents: "export const DracoDecoderModule = undefined; export const DracoEncoderModule = undefined; export default {};",
            loader: "js",
        }));
    },
};

const entry = path.join(here, "entry.ts");

const ctx = {
    entryPoints: [entry],
    bundle: true,
    format: "iife",
    globalName: "BABYLON",
    outfile: path.join(here, "public", "babylon.harness.js"),
    sourcemap: false,
    target: ["chrome120"],
    plugins: [aliasPlugin],
    logLevel: "info",
    tsconfigRaw: {
        compilerOptions: {
            useDefineForClassFields: false,
            target: "es2021",
        },
    },
    banner: {
        js: "if (typeof Symbol !== 'undefined' && !Symbol.metadata) { Object.defineProperty(Symbol, 'metadata', { configurable: true, writable: true, value: Symbol('Symbol.metadata') }); }",
    },
};

fs.mkdirSync(path.join(here, "public"), { recursive: true });
await esbuild.build(ctx);
console.log("built", ctx.outfile, fs.statSync(ctx.outfile).size, "bytes");
