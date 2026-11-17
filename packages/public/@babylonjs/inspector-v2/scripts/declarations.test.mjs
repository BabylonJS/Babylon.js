import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { checkDeclarations, packageDeclarations } from "./declarations.mjs";

let directory;
let lib;
let shared;

function write(file, text) {
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
}

beforeEach(() => {
    directory = mkdtempSync(path.join(tmpdir(), "inspector-declarations-"));
    lib = path.join(directory, "lib");
    shared = path.join(directory, "shared");
    write(path.join(lib, "index.d.ts"), 'export * from "./index.common";');
    write(path.join(lib, "lite/index.d.ts"), 'export * from "../index.common";');
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

test("copies the transitive closure once and shares identities across entry points", () => {
    write(
        path.join(lib, "index.common.d.ts"),
        ['export * from "shared-ui-components/modularity/service";', 'export type Factory = import("@babylonjs/shared-ui-components/modularity/service.js").Factory;'].join("\n")
    );
    write(
        path.join(shared, "modularity/service.d.ts"),
        ['import type { Contract } from "../contract";', 'export { Identity } from "shared-ui-components/contract";', "export type Factory = () => Contract;"].join("\n")
    );
    write(path.join(shared, "contract.d.ts"), "export declare const Identity: unique symbol;\nexport interface Contract { readonly [Identity]: true; }");
    write(path.join(shared, "unused.d.ts"), "export type Unused = never;");

    packageDeclarations(lib, shared);
    checkDeclarations(lib);

    const common = readFileSync(path.join(lib, "index.common.d.ts"), "utf8");
    assert.match(common, /from "\.\/shared-ui-components\/modularity\/service\.js"/);
    assert.match(common, /import\("\.\/shared-ui-components\/modularity\/service\.js"\)/);
    assert.equal(
        readFileSync(path.join(lib, "shared-ui-components/modularity/service.d.ts"), "utf8"),
        ['import type { Contract } from "../contract.js";', 'export { Identity } from "../contract.js";', "export type Factory = () => Contract;"].join("\n")
    );
    assert.deepEqual(readdirSync(path.join(lib, "shared-ui-components")).sort(), ["contract.d.ts", "modularity"]);
    assert.equal(readFileSync(path.join(lib, "lite/index.d.ts"), "utf8"), 'export * from "../index.common";');

    write(path.join(lib, "index.common.d.ts"), 'export * from "shared-ui-components/modularity/service";');
    write(path.join(shared, "contract.d.ts"), "export interface Contract { updated: true; }");
    packageDeclarations(lib, shared);
    checkDeclarations(lib);
    assert.equal(readFileSync(path.join(lib, "shared-ui-components/contract.d.ts"), "utf8"), "export interface Contract { updated: true; }");
});

test("handles circular declarations and directory index imports", () => {
    write(path.join(lib, "index.common.d.ts"), 'export * from "shared-ui-components/contracts";');
    write(path.join(shared, "contracts/index.d.ts"), 'export * from "./service";');
    write(path.join(shared, "contracts/service.d.ts"), 'export * from "./index.js";');
    packageDeclarations(lib, shared);
    checkDeclarations(lib);
    assert.match(readFileSync(path.join(lib, "index.common.d.ts"), "utf8"), /contracts\/index\.js/);
});

test("fails on missing transitive declarations", () => {
    write(path.join(lib, "index.common.d.ts"), 'export * from "shared-ui-components/service";');
    write(path.join(shared, "service.d.ts"), 'export * from "./missing";');
    assert.throws(() => packageDeclarations(lib, shared), /Missing declaration for "\.\/missing"/);
});

test("rejects leaked package imports, missing relative targets, and missing entry points", () => {
    write(path.join(lib, "index.common.d.ts"), 'export type Value = import("@babylonjs/shared-ui-components/service.js").Value;');
    assert.throws(() => checkDeclarations(lib), /Shared UI package reference/);
    write(path.join(lib, "index.common.d.ts"), 'export * from "./missing.js";');
    assert.throws(() => checkDeclarations(lib), /Missing declaration/);
    rmSync(path.join(lib, "lite/index.d.ts"));
    assert.throws(() => checkDeclarations(lib), /Missing declaration for "lite\/index"/);
});
