import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("production build helpers", () => {
    let directory: string;

    beforeEach(() => {
        directory = realpathSync.native(mkdtempSync(join(tmpdir(), "babylon-production-build-")));
    });

    afterEach(() => {
        rmSync(directory, { recursive: true, force: true });
    });

    const write = (file: string, content: string) => {
        const fullPath = join(directory, file);
        mkdirSync(resolve(fullPath, ".."), { recursive: true });
        writeFileSync(fullPath, content);
    };

    it("shares TypeScript emit across entries and preserves const enums, decorators, and source maps", () => {
        write(
            "tsconfig.json",
            JSON.stringify({
                compilerOptions: {
                    target: "ES2015",
                    module: "ESNext",
                    moduleResolution: "bundler",
                    skipLibCheck: true,
                    useDefineForClassFields: false,
                    types: [],
                    paths: { tslib: [resolve("node_modules/tslib/tslib.d.ts")] },
                },
                include: ["*.ts"],
            })
        );
        write("values.ts", "export const enum Values { answer = 42 }\n");
        write(
            "first.ts",
            [
                'import { Values } from "./values";',
                "function identity<T extends Function>(value: T) { return value; }",
                "@identity export class Example { value = Values.answer; }",
            ].join("\n")
        );
        write("second.ts", 'import { Values } from "./values"; export const answer = Values.answer;');
        const helper = pathToFileURL(resolve("packages/public/rollupTypeScript.mjs")).href;
        const rollup = pathToFileURL(resolve("node_modules/rollup/dist/es/rollup.js")).href;
        const typescriptPlugin = pathToFileURL(resolve("node_modules/@rollup/plugin-typescript/dist/es/index.js")).href;
        const script = `
            import { createTypeScriptEmitPlugins } from ${JSON.stringify(helper)};
            import { rollup } from ${JSON.stringify(rollup)};
            import typescript from ${JSON.stringify(typescriptPlugin)};
            async function bundle(plugin) {
                const result = await rollup({ input: "./first.ts", external: ["tslib"], plugins: [plugin] });
                try {
                    return (await result.generate({ format: "cjs", sourcemap: true })).output[0].code;
                } finally {
                    await result.close();
                }
            }
            const original = await bundle(typescript({
                tsconfig: "tsconfig.json", outDir: undefined, declaration: false,
                declarationMap: false, sourceMap: true, inlineSources: true
            }));
            const shared = await bundle(createTypeScriptEmitPlugins("tsconfig.json")());
            const plugins = createTypeScriptEmitPlugins("tsconfig.json");
            const context = { error(message) { throw new Error(message); } };
            const first = plugins();
            first.buildStart.call(context);
            const a = first.load(${JSON.stringify(join(directory, "first.ts"))});
            // A second entry must reuse the first emit, not read the edited source.
            const fs = await import('node:fs');
            fs.writeFileSync("values.ts", "export const enum Values { answer = 99 }");
            const second = plugins();
            second.buildStart.call(context);
            const b = second.load(${JSON.stringify(join(directory, "second.ts"))});
            second.watchChange();
            second.buildStart.call(context);
            const changed = second.load(${JSON.stringify(join(directory, "second.ts"))});
            console.log(JSON.stringify({ a, b, changed, equivalent: original === shared, missing: second.load("missing.ts") }));
        `;
        const output = JSON.parse(execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: directory, encoding: "utf8" }));
        expect(output.a.code).toContain("__esDecorate");
        expect(output.a.code).toContain("42");
        expect(output.a.code).not.toContain('from "./values"');
        expect(output.b.code).toContain("42");
        expect(output.b.code).not.toContain("99");
        expect(output.changed.code).toContain("99");
        expect(output.equivalent).toBe(true);
        expect(output.a.map.sources).toEqual([join(directory, "first.ts")]);
        expect(output.a.map.sourcesContent[0]).toContain("@identity");
        expect(output.missing).toBeNull();
    });

    it("fails explicitly for invalid TypeScript instead of caching an incomplete emit", () => {
        write("tsconfig.json", JSON.stringify({ compilerOptions: { types: [], skipLibCheck: true }, include: ["*.ts"] }));
        write("bad.ts", "export const value: number = 'wrong';");
        const helper = pathToFileURL(resolve("packages/public/rollupTypeScript.mjs")).href;
        const script = `
            import { createTypeScriptEmitPlugins } from ${JSON.stringify(helper)};
            createTypeScriptEmitPlugins("tsconfig.json")().buildStart.call({ error(message) { throw new Error(message); } });
        `;
        expect(() => execFileSync(process.execPath, ["--input-type=module", "-e", script], { cwd: directory, stdio: "pipe" })).toThrow();
    });

    it("recreates complete UMD documentation deterministically from restored package declarations", () => {
        write("packages/public/glTF2Interface/babylon.glTF2Interface.d.ts", "gltf");
        for (const [name, initialize] of [
            ["babylonjs-gui", false],
            ["babylonjs", true],
        ] as const) {
            write(
                `packages/public/umd/${name}/config.json`,
                JSON.stringify({
                    filename: `${name}.module.d.ts`,
                    outputDirectory: ".",
                    addToDocumentation: true,
                    initDocumentation: initialize,
                })
            );
            write(`packages/public/umd/${name}/${name}.d.ts`, name);
        }
        const helper = pathToFileURL(resolve("scripts/generateUMDDocumentation.mjs")).href;
        const script = `
            import { generateUMDDocumentation } from ${JSON.stringify(helper)};
            generateUMDDocumentation(${JSON.stringify(directory)});
        `;
        execFileSync(process.execPath, ["--input-type=module", "-e", script]);
        const file = join(directory, ".snapshot/documentation.d.ts");
        expect(readFileSync(file, "utf8")).toBe("gltf\nbabylonjs\nbabylonjs-gui");
        writeFileSync(file, "stale documentation");
        execFileSync(process.execPath, ["--input-type=module", "-e", script]);
        expect(readFileSync(file, "utf8")).toBe("gltf\nbabylonjs\nbabylonjs-gui");
        rmSync(join(directory, "packages/public/umd/babylonjs-gui/babylonjs-gui.d.ts"));
        expect(() => execFileSync(process.execPath, ["--input-type=module", "-e", script], { stdio: "pipe" })).toThrow();
        expect(readFileSync(file, "utf8")).toBe("gltf\nbabylonjs\nbabylonjs-gui");
    });

    it.each(["default", "shared-ui-components", "smart-filters"])(
        "restores %s artifacts and invalidates shared configuration, dependencies, and build modes",
        (outputKind) => {
            write("nx.json", readFileSync(resolve("nx.json"), "utf8"));
            const nxPackage = JSON.parse(readFileSync(resolve("node_modules/nx/package.json"), "utf8"));
            write("package.json", JSON.stringify({ private: true, workspaces: ["packages/*"], devDependencies: { nx: nxPackage.version } }));
            const defaultArtifacts = [
                "bundle.js",
                "bundle.js.map",
                "bundle.d.ts",
                "dist/index.js",
                "lib/index.js",
                "bin/cli.js",
                "assets/decoder.wasm",
                "src/Shaders/upper.ts",
                "src/effect/shaders/lower.ts",
                "src/material.fragment.ts",
            ];
            const artifacts =
                outputKind === "shared-ui-components"
                    ? ["index.js", "index.js.map", "index.d.ts", "fluent/icons/icon.svg", "fluent/theme.module.scss"]
                    : outputKind === "smart-filters"
                      ? ["dist/index.js", "src/index.ts", "tsconfig.build.tsbuildinfo"]
                      : defaultArtifacts;
            const outputs =
                outputKind === "default" ? undefined : JSON.parse(readFileSync(resolve(`packages/public/@babylonjs/${outputKind}/package.json`), "utf8")).nx.targets.build.outputs;
            write(".gitignore", [".nx", "node_modules", ...artifacts.map((name) => `packages/fixture/${name}`)].join("\n"));
            write("tsconfig.build.json", "{}");
            write("packages/public/helper.mjs", "export const version = 1;");
            write("packages/dependency/project.json", JSON.stringify({ name: "dependency" }));
            write("packages/dependency/source.ts", "export const value = 1;");
            write("packages/fixture/source.ts", "export const value = 1;");
            write(
                "packages/fixture/project.json",
                JSON.stringify({
                    name: "fixture",
                    implicitDependencies: ["dependency"],
                    targets: { build: { executor: "nx:run-commands", outputs, options: { command: "node build.cjs", cwd: "packages/fixture" } } },
                })
            );
            write(
                "packages/fixture/build.cjs",
                `
            const fs = require("node:fs");
            const counter = "../../.runs";
            fs.writeFileSync(counter, String(fs.existsSync(counter) ? Number(fs.readFileSync(counter)) + 1 : 1));
            for (const name of ${JSON.stringify(artifacts)}) {
                fs.mkdirSync(require("node:path").dirname(name), { recursive: true });
                fs.writeFileSync(name, "expected artifact");
            }
        `
            );
            symlinkSync(resolve("node_modules"), join(directory, "node_modules"), process.platform === "win32" ? "junction" : "dir");
            const run = (mode = "") =>
                execFileSync(process.execPath, [resolve("node_modules/nx", nxPackage.bin.nx), "run", "fixture:build"], {
                    cwd: directory,
                    encoding: "utf8",
                    env: {
                        ...process.env,
                        NX_DAEMON: "false",
                        NX_TUI: "false",
                        NX_ISOLATE_PLUGINS: "false",
                        NX_CACHE_DIRECTORY: join(directory, ".nx/cache"),
                        NX_WORKSPACE_DATA_DIRECTORY: join(directory, ".nx/workspace-data"),
                        ROLLUP_MODE: mode,
                    },
                });
            const count = () => Number(readFileSync(join(directory, ".runs"), "utf8"));
            run();
            run();
            expect(count()).toBe(1);
            for (const name of artifacts) {
                rmSync(join(directory, "packages/fixture", name));
            }
            run();
            expect(count()).toBe(1);
            for (const name of artifacts) {
                expect(readFileSync(join(directory, "packages/fixture", name), "utf8")).toBe("expected artifact");
            }
            write("packages/public/helper.mjs", "export const version = 2;");
            run();
            expect(count()).toBe(2);
            write("tsconfig.build.json", '{"compilerOptions":{"strict":true}}');
            run();
            expect(count()).toBe(3);
            write("packages/dependency/source.ts", "export const value = 2;");
            run();
            expect(count()).toBe(4);
            write("packages/fixture/source.ts", "export const value = 2;");
            run();
            expect(count()).toBe(5);
            run("production");
            expect(count()).toBe(6);
        },
        60_000
    );
});
