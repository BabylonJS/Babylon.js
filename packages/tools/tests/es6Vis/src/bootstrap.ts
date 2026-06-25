/**
 * Bootstrap loader for ES6 visualization tests.
 *
 * Reads query parameters:
 *   ?scene=basic&style=barrel
 *
 * Dynamically imports ./scenes/{scene}/{style}.ts and calls its run() export.
 */

// Ensure Symbol.metadata exists for TC39 decorator metadata. The "deep" and "pure" import
// styles don't pull the package index that applies this polyfill, so apply it here in the
// guaranteed-first bootstrap. Inlined (no core import) to avoid affecting the tree-shaking styles.
if (typeof Symbol !== "undefined" && !(Symbol as any).metadata) {
    (Symbol as any).metadata = Symbol("Symbol.metadata");
}

const params = new URLSearchParams(window.location.search);
const scene = params.get("scene") || "basic";
const style = params.get("style") || "barrel";

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

const modules = import.meta.glob("./scenes/*/*.ts");
const key = `./scenes/${scene}/${style}.ts`;
const loader = modules[key];

if (!loader) {
    const available = Object.keys(modules).join("\n  ");
    throw new Error(`Unknown scene/style: "${key}". Available:\n  ${available}`);
}

loader().then((mod: any) => mod.run(canvas));
