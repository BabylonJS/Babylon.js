// Ambient module declaration for the TypeScript services bundled within monaco-editor.
// The .js file exists but ships without its own .d.ts.
declare module "monaco-editor/esm/vs/language/typescript/lib/typescriptServices" {
    export const typescript: typeof import("typescript");
}
