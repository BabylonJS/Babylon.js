import type { ProjectOptions } from "../index";

export function generateTsConfig(options: ProjectOptions): string {
    const { bundler, moduleFormat } = options;

    const base: Record<string, unknown> = {
        compilerOptions: {
            target: "ES2020",
            module: bundler === "vite" ? "ESNext" : "ES2020",
            moduleResolution: bundler === "vite" ? "bundler" : "node",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
            outDir: "./dist",
            sourceMap: true,
        },
        include: ["src"],
    };

    // UMD packages ship their own typings via the `babylonjs` package
    if (moduleFormat === "umd") {
        (base.compilerOptions as Record<string, unknown>).types = ["babylonjs"];
    }

    return JSON.stringify(base, null, 2) + "\n";
}
