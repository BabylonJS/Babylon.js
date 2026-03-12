/**
 * Ambient declaration for Monaco's browser-safe TypeScript bundle.
 *
 * This file has `require = void 0` at the top, so none of the Node.js
 * built-ins (`fs`, `path`, etc.) are loaded.  The `typescript` export
 * is the full `ts` namespace.
 */
declare module "monaco-editor/esm/vs/language/typescript/lib/typescriptServices" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const typescript: typeof import("typescript");
    export { typescript };
}
