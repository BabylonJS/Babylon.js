import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { build, type Plugin } from "esbuild";
import { describe, expect, it } from "vitest";

const SourceRoot = path.resolve("packages/dev/sharedUiComponents/src");
const PublicPackagePath = path.resolve("packages/public/@babylonjs/shared-ui-components/package.json");

const SourceAliasPlugin: Plugin = {
    name: "shared-ui-source-alias",
    setup: (buildContext) => {
        buildContext.onResolve({ filter: /^shared-ui-components\// }, (args) => {
            const sourcePath = path.join(SourceRoot, args.path.slice("shared-ui-components/".length));
            const resolvedPath = [sourcePath, `${sourcePath}.ts`, `${sourcePath}.tsx`].find(existsSync);
            return resolvedPath ? { path: resolvedPath } : { errors: [{ text: `Unable to resolve shared UI source: ${args.path}` }] };
        });
        buildContext.onResolve({ filter: /^core\// }, (args) => ({
            errors: [{ text: `Lite entry imports Babylon Core: ${args.path}` }],
        }));
    },
};

describe("@babylonjs/shared-ui-components/lite", () => {
    it("bundles without importing Babylon Core", async () => {
        await expect(
            build({
                entryPoints: [path.join(SourceRoot, "lite/index.ts")],
                bundle: true,
                write: false,
                platform: "browser",
                external: ["react", "react-dom", "@fluentui/*", "@babylonjs/lite"],
                plugins: [SourceAliasPlugin],
            })
        ).resolves.toBeDefined();
    });

    it("preserves existing package subpaths while exporting the Lite entry", async () => {
        const packageJson = JSON.parse(await readFile(PublicPackagePath, "utf8"));

        expect(packageJson.exports).toMatchObject({
            ".": {
                types: "./index.d.ts",
                default: "./index.js",
            },
            "./lite": {
                types: "./lite/index.d.ts",
                default: "./lite/index.js",
            },
            "./*.js": "./*.js",
            "./*.d.ts": "./*.d.ts",
            "./*.map": "./*.map",
            "./*.svg": "./*.svg",
            "./*.scss": "./*.scss",
            "./*": {
                types: "./*.d.ts",
                default: "./*.js",
            },
        });
    });
});
