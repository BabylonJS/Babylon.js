import { defineConfig, type Plugin } from "vite";
import path from "path";
import { commonDevViteConfiguration } from "../../public/viteToolsHelper.mjs";

/**
 * Stub optional peer dependencies that core/src references but that are not
 * installed in the dev workspace (e.g. draco3dgltf, ammo.js). Webpack handled
 * these via externalsFunction; Vite needs an explicit transform plugin.
 *
 * Strategy: rewrite the import statements in consuming source files rather than
 * trying to stub the module itself, since ESM named imports require explicit
 * exports and we cannot enumerate them dynamically.
 *
 *   import { DracoDecoderModule } from "draco3dgltf"
 *   → const DracoDecoderModule = undefined;
 */
function stubOptionalPeerDepsPlugin(): Plugin {
    const optionals = ["draco3dgltf", "ammo.js", "cannon", "oimo", "recast", "havok", "basis_transcoder"];
    const q = optionals.map((p) => p.replace(".", "\\.")).join("|");
    // Handle: import type { A, B } from "pkg"  — erase entirely (type-only)
    const typeNamedRe = new RegExp(`import\\s+type\\s+\\{[^}]*\\}\\s+from\\s+['"](?:${q})['"];?`, "g");
    // Handle: import { A, B } from "pkg"   (single or multi-line braces, runtime)
    const namedRe = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"](?:${q})['"];?`, "g");
    // Handle: import * as ns from "pkg"
    const starRe = new RegExp(`import\\s+(?:type\\s+)?\\*\\s+as\\s+(\\w+)\\s+from\\s+['"](?:${q})['"];?`, "g");
    // Handle: import Default from "pkg"
    const defaultRe = new RegExp(`import\\s+(?:type\\s+)?(\\w+)\\s+from\\s+['"](?:${q})['"];?`, "g");
    // Handle: import "pkg"  (side-effect only)
    const sideEffectRe = new RegExp(`import\\s+['"](?:${q})['"];?`, "g");

    function stubNamed(bindings: string) {
        return bindings
            .split(",")
            .map((s) =>
                s
                    .trim()
                    .split(/\s+as\s+/)
                    .pop()!
                    .trim()
            )
            .filter((n) => Boolean(n) && !n.startsWith("type "))
            .map((n) => `const ${n} = undefined;`)
            .join(" ");
    }

    return {
        name: "stub-optional-peer-deps",
        enforce: "pre",
        transform(code, id) {
            if (!/\.[tj]sx?$/.test(id)) return null;
            if (!optionals.some((p) => code.includes(`"${p}"`) || code.includes(`'${p}'`))) return null;

            return {
                code: code
                    .replace(typeNamedRe, "")
                    .replace(namedRe, (_m, bindings: string) => stubNamed(bindings))
                    .replace(starRe, (_m, ns: string) => `const ${ns} = {};`)
                    .replace(defaultRe, (_m, def: string) => `const ${def} = undefined;`)
                    .replace(sideEffectRe, ""),
                map: null,
            };
        },
    };
}

export default defineConfig((_env) => {
    const base = commonDevViteConfiguration({
        port: parseInt(process.env.TOOLS_PORT ?? "1338"),
        aliases: {
            core: path.resolve("../../dev/core/src"),
            gui: path.resolve("../../dev/gui/src"),
            serializers: path.resolve("../../dev/serializers/src"),
            loaders: path.resolve("../../dev/loaders/src"),
            materials: path.resolve("../../dev/materials/src"),
            "lottie-player": path.resolve("../../dev/lottiePlayer/src"),
            inspector: path.resolve("../../dev/inspector/src"),
            "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
            "post-processes": path.resolve("../../dev/postProcesses/src"),
            "procedural-textures": path.resolve("../../dev/proceduralTextures/src"),
            "node-editor": path.resolve("../../tools/nodeEditor/src"),
            "node-geometry-editor": path.resolve("../../tools/nodeGeometryEditor/src"),
            "node-render-graph-editor": path.resolve("../../tools/nodeRenderGraphEditor/src"),
            "node-particle-editor": path.resolve("../../tools/nodeParticleEditor/src"),
            "gui-editor": path.resolve("../../tools/guiEditor/src"),
            accessibility: path.resolve("../../tools/accessibility/src"),
            "babylonjs-gltf2interface": path.resolve("./src/babylon.glTF2Interface.ts"),
        },
    });

    return {
        ...base,
        plugins: [...(base.plugins ?? []), stubOptionalPeerDepsPlugin()],
    };
});
