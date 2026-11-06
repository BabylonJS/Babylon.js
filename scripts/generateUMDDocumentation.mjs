import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function generateUMDDocumentation(root = resolve(dirname(fileURLToPath(import.meta.url)), "..")) {
    const packages = join(root, "packages/public/umd");
    const configs = readdirSync(packages)
        .filter((name) => name.startsWith("babylonjs") && existsSync(join(packages, name, "config.json")))
        .flatMap((name) => {
            const config = JSON.parse(readFileSync(join(packages, name, "config.json"), "utf8"));
            return (Array.isArray(config) ? config : [config]).filter((entry) => entry.addToDocumentation).map((entry) => ({ ...entry, name }));
        })
        .sort((a, b) => Number(!!b.initDocumentation) - Number(!!a.initDocumentation) || a.name.localeCompare(b.name));
    const declarations = configs.map((config) => readFileSync(join(packages, config.name, config.outputDirectory || "dist", config.filename.replace(".module", "")), "utf8"));
    const output = [readFileSync(join(root, "packages/public/glTF2Interface/babylon.glTF2Interface.d.ts"), "utf8"), ...declarations].join("\n");
    mkdirSync(join(root, ".snapshot"), { recursive: true });
    writeFileSync(join(root, ".snapshot/documentation.d.ts"), output);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    generateUMDDocumentation();
}
