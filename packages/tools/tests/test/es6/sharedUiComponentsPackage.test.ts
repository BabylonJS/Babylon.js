/**
 * Packed-tarball contract test for @babylonjs/shared-ui-components.
 *
 * Packs the built package with `npm pack`, extracts the real tarball, and asserts that:
 *   - every static runtime/type entrypoint declared in package.json exists in the tarball
 *   - the supported `./lite` and deep-import subpaths resolve (runtime and types) to packed files
 *   - the package root is not exported, since the package has no root barrel
 *
 * Prerequisites: `npm run build:es6` (or `npx nx build @babylonjs/shared-ui-components`) must have been run.
 */

import { execFileSync, execSync } from "child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import * as ts from "typescript";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PackageName = "@babylonjs/shared-ui-components";
const PackageDir = resolve(__dirname, "../../../../public/@babylonjs/shared-ui-components");

type ExportTarget = string | null | ExportTarget[] | { [condition: string]: ExportTarget };

function collectExportTargets(target: ExportTarget, targets: string[]): void {
    if (typeof target === "string") {
        targets.push(target);
    } else if (Array.isArray(target)) {
        target.forEach((item) => collectExportTargets(item, targets));
    } else if (target) {
        Object.values(target).forEach((item) => collectExportTargets(item, targets));
    }
}

describe(`${PackageName} packed tarball`, () => {
    let workDir: string;
    let packedDir: string;
    let consumerDir: string;
    let manifest: Record<string, any>;

    beforeAll(() => {
        workDir = realpathSync.native(mkdtempSync(join(tmpdir(), "babylon-suc-pack-")));
        const packOutput = execSync(`npm pack --ignore-scripts --json --pack-destination "${workDir}"`, { cwd: PackageDir, encoding: "utf8" });
        const tarballName: string = JSON.parse(packOutput)[0].filename;
        // Run tar from the tarball's directory with a relative name so Windows drive letters are not parsed as remote hosts.
        execFileSync("tar", ["-xzf", tarballName], { cwd: workDir });
        packedDir = join(workDir, "package");
        manifest = JSON.parse(readFileSync(join(packedDir, "package.json"), "utf8"));

        consumerDir = join(workDir, "consumer");
        const installedDir = join(consumerDir, "node_modules", ...PackageName.split("/"));
        mkdirSync(installedDir, { recursive: true });
        cpSync(packedDir, installedDir, { recursive: true });
        writeFileSync(join(consumerDir, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
    }, 120000);

    afterAll(() => {
        if (workDir) {
            rmSync(workDir, { recursive: true, force: true });
        }
    });

    it("contains every declared static runtime and type entrypoint", () => {
        const declared: string[] = [];
        for (const field of ["main", "module", "types", "typings", "esnext", "browser"]) {
            if (typeof manifest[field] === "string") {
                declared.push(manifest[field]);
            }
        }
        collectExportTargets(manifest.exports ?? null, declared);

        const staticTargets = declared.filter((target) => !target.includes("*"));
        expect(staticTargets).toContain("./lite/index.js");
        expect(staticTargets).toContain("./lite/index.d.ts");
        const missing = staticTargets.filter((target) => !existsSync(join(packedDir, target)));
        expect(missing).toEqual([]);
    });

    it("resolves supported runtime subpaths and keeps the root unexported", () => {
        const script = `
            const result = {};
            for (const specifier of ["${PackageName}/lite", "${PackageName}/lite/index.js", "${PackageName}/stringTools", "${PackageName}/stringTools.js", "${PackageName}/package.json"]) {
                result[specifier] = import.meta.resolve(specifier);
            }
            const deep = await import("${PackageName}/stringTools");
            result.deepExportType = typeof deep.StringTools;
            try {
                await import("${PackageName}");
                result.rootError = "none";
            } catch (e) {
                result.rootError = e.code;
            }
            console.log(JSON.stringify(result));
        `;
        const scriptPath = join(consumerDir, "probe.mjs");
        writeFileSync(scriptPath, script);
        const result = JSON.parse(execFileSync(process.execPath, [scriptPath], { cwd: consumerDir, encoding: "utf8" }));

        const installedUrl = pathToFileURL(join(consumerDir, "node_modules", ...PackageName.split("/"))).href;
        expect(result[`${PackageName}/lite`]).toBe(`${installedUrl}/lite/index.js`);
        expect(result[`${PackageName}/lite/index.js`]).toBe(`${installedUrl}/lite/index.js`);
        expect(result[`${PackageName}/stringTools`]).toBe(`${installedUrl}/stringTools.js`);
        expect(result[`${PackageName}/stringTools.js`]).toBe(`${installedUrl}/stringTools.js`);
        expect(result[`${PackageName}/package.json`]).toBe(`${installedUrl}/package.json`);
        expect(result.deepExportType).toBe("function");
        expect(result.rootError).toBe("ERR_PACKAGE_PATH_NOT_EXPORTED");
    });

    it.each([
        ["Bundler", ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext],
        ["NodeNext", ts.ModuleResolutionKind.NodeNext, ts.ModuleKind.NodeNext],
    ])("resolves supported type subpaths with %s module resolution", (_name, moduleResolution, module) => {
        const containingFile = join(consumerDir, "index.ts");
        const resolveTypes = (specifier: string) => ts.resolveModuleName(specifier, containingFile, { module, moduleResolution }, ts.sys).resolvedModule?.resolvedFileName;
        const installedDir = join(consumerDir, "node_modules", ...PackageName.split("/"));

        expect(resolveTypes(`${PackageName}/lite`)).toBe(join(installedDir, "lite", "index.d.ts").replace(/\\/g, "/"));
        expect(resolveTypes(`${PackageName}/stringTools`)).toBe(join(installedDir, "stringTools.d.ts").replace(/\\/g, "/"));
        expect(resolveTypes(PackageName)).toBeUndefined();
    });
});
