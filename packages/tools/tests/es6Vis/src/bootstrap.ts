/**
 * Bootstrap loader for ES6 visualization tests.
 *
 * Reads query parameters:
 *   ?scene=basic&style=barrel
 *
 * Dynamically imports ./scenes/{scene}/{style}.ts and calls its run() export.
 */

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
