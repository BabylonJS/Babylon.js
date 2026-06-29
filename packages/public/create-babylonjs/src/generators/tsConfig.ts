import type { ProjectOptions } from "../index";

export function generateTsConfig(options: ProjectOptions): string {
    const { bundler, moduleFormat } = options;

    const types: string[] = [];

    const compilerOptions: Record<string, unknown> = {
        target: "ES2020",
        module: bundler === "vite" ? "ESNext" : "ES2020",
        moduleResolution: bundler === "vite" ? "bundler" : "node",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        sourceMap: true,
    };

    if (bundler === "vite") {
        // Vite handles the actual bundling, so TypeScript only needs to type-check without emitting output
        compilerOptions.noEmit = true;
        // Add Vite client type declarations (e.g., import.meta.env, asset imports)
        types.push("vite/client");
    } else {
        compilerOptions.outDir = "./dist";
    }

    // UMD packages ship their own typings via the `babylonjs` package
    if (moduleFormat === "umd") {
        types.push("babylonjs");
    }

    if (types.length > 0) {
        compilerOptions.types = types;
    }

    return JSON.stringify({ compilerOptions, include: ["src"] }, null, 2) + "\n";
}
