import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import * as CoreEncoderTypes from "core/Materials/Textures/ktx2encoderTypes";
import * as EncoderTypes from "../../src/ktx2encoderTypes";
import { prepareSnapshot } from "../../../../dev/buildTools/src/prepareSnapshot";

const RepositoryRoot = resolve(import.meta.dirname, "../../../../..");

describe("KTX2 encoder package integration", () => {
    let fixture: string | undefined;
    const originalDirectory = process.cwd();

    afterEach(() => {
        process.chdir(originalDirectory);
        if (fixture) {
            rmSync(fixture, { recursive: true, force: true });
            fixture = undefined;
        }
    });

    it("shares only types with core, without runtime helper exports", () => {
        expect(Object.keys(CoreEncoderTypes)).toEqual([]);
        expect(Object.keys(EncoderTypes)).toEqual([]);
    });

    it("registers the shared core leaf as a build prerequisite without a public runtime dependency", () => {
        const tool = JSON.parse(readFileSync(join(RepositoryRoot, "packages/tools/ktx2Encoder/package.json"), "utf8"));
        expect(tool.devDependencies["@dev/core"]).toBe("1.0.0");

        for (const directory of ["@babylonjs/ktx2encoder", "umd/babylonjs-ktx2encoder"]) {
            const metadata = JSON.parse(readFileSync(join(RepositoryRoot, "packages/public", directory, "package.json"), "utf8"));
            expect(metadata.devDependencies["@tools/ktx2encoder"]).toBeTruthy();
            expect(metadata.dependencies).toBeUndefined();
            expect(metadata.peerDependencies).toBeUndefined();
        }
    });

    it("discovers both public packages without treating the CommonJS scope as a workspace", () => {
        const npmCLI = process.env.npm_execpath;
        if (!npmCLI) {
            throw new Error("Run this workspace-discovery test through npm or npx so npm_execpath identifies the npm CLI.");
        }
        const workspaces = JSON.parse(
            execFileSync(process.execPath, [npmCLI, "pkg", "get", "name", "--workspaces"], {
                cwd: RepositoryRoot,
                encoding: "utf8",
                env: { ...process.env, PATH: "" },
            })
        );
        expect(workspaces["@babylonjs/ktx2encoder"]).toBe("@babylonjs/ktx2encoder");
        expect(workspaces["babylonjs-ktx2encoder"]).toBe("babylonjs-ktx2encoder");
        expect(workspaces).not.toHaveProperty("wasm");
    });

    it("imports the unmodified packaged Basis factory from Node ESM and CommonJS", () => {
        fixture = mkdtempSync(join(tmpdir(), "bjs-ktx2-factory-"));
        writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
        const wasm = join(fixture, "wasm");
        mkdirSync(wasm);
        writeFileSync(join(wasm, "package.json"), readFileSync(join(RepositoryRoot, "packages/public/@babylonjs/ktx2encoder/wasm/package.json")));
        writeFileSync(join(wasm, "basis_encoder.js"), readFileSync(join(RepositoryRoot, "packages/tools/babylonServer/public/basisEncoder/v2_50/basis_encoder.js")));
        const output = execFileSync(
            process.execPath,
            [
                "--input-type=module",
                "--eval",
                `import assert from "node:assert/strict";
                import { createRequire } from "node:module";
                import BASIS from "./wasm/basis_encoder.js";
                const require = createRequire(import.meta.url);
                assert.equal(typeof BASIS, "function");
                assert.equal(require("./wasm/basis_encoder.js"), BASIS);`,
            ],
            { cwd: fixture, encoding: "utf8" }
        );
        expect(output).toBe("");
    }, 60_000);

    it("collects the root bundle, declarations and complete versioned codec payload into a clean snapshot", () => {
        fixture = mkdtempSync(join(tmpdir(), "bjs-ktx2-snapshot-"));
        writeFileSync(join(fixture, "package.json"), JSON.stringify({ name: "@babylonjs/root" }));
        const bundleDirectory = join(fixture, "packages/public/umd/babylonjs-ktx2encoder");
        mkdirSync(bundleDirectory, { recursive: true });
        const bundle = "globalThis.KTX2ENCODER = {};";
        writeFileSync(join(bundleDirectory, "babylon.ktx2Encoder.js"), bundle);
        writeFileSync(join(bundleDirectory, "babylon.ktx2Encoder.module.d.ts"), "export declare class KTX2Encoder {}");

        const codecDirectory = "packages/tools/babylonServer/public/basisEncoder/v2_50";
        const destination = join(fixture, codecDirectory);
        const filenames = ["basis_encoder.js", "basis_encoder.wasm", "LICENSE", "NOTICE", "LICENSES/Apache-2.0.txt", "LICENSES/BSD-3-clause.txt", "LICENSES/MIT.txt"];
        for (const filename of filenames) {
            expect(statSync(join(RepositoryRoot, codecDirectory, filename)).size).toBeGreaterThan(0);
            mkdirSync(dirname(join(destination, filename)), { recursive: true });
            writeFileSync(join(destination, filename), filename);
        }
        writeFileSync(join(destination, "package.json"), "{}");
        const havok = join(fixture, "packages/tools/babylonServer/public/havok");
        mkdirSync(havok, { recursive: true });
        writeFileSync(join(havok, "LICENSE"), "Havok license fixture");
        process.chdir(fixture);

        prepareSnapshot();

        expect(readFileSync(join(fixture, ".snapshot/babylon.ktx2Encoder.js"), "utf8")).toBe(bundle);
        expect(readFileSync(join(fixture, ".snapshot/babylon.ktx2Encoder.d.ts"), "utf8")).toBe("export declare class KTX2Encoder {}");
        for (const filename of filenames) {
            expect(readFileSync(join(fixture, ".snapshot/basisEncoder/v2_50", filename), "utf8")).toBe(filename);
        }
        expect(() => readFileSync(join(fixture, ".snapshot/basisEncoder/v2_50/package.json"))).toThrow();
        expect(readFileSync(join(fixture, ".snapshot/havok/LICENSE"), "utf8")).toBe("Havok license fixture");
    }, 60_000);
});
