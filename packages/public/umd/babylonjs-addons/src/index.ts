// Export all named symbols directly so ADDONS.HtmlMesh etc. work.
// With Rollup UMD (unlike webpack's libraryExport:"default"), named exports must be
// explicitly re-exported for them to appear on the global namespace object.
//
// IMPORTANT: Do NOT also `import * as addons; export { addons }` here.
// When both patterns coexist, terser collapses all individual exports into the
// namespace object in the minified bundle, leaving ADDONS.X undefined at runtime.
export * from "addons/index";
