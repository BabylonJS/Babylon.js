// Export all named symbols directly so BABYLON.GUI.AdvancedDynamicTexture etc. work.
// With Rollup UMD (unlike webpack's libraryExport:"default"), named exports must be
// explicitly re-exported for them to appear on the global namespace object.
//
// IMPORTANT: Do NOT also `import * as gui; export { gui }` here.
// When both patterns coexist, terser collapses all individual exports into the
// namespace object in the minified bundle, leaving BABYLON.GUI.X undefined at runtime.
import "gui/legacy/legacy";
export * from "gui/legacy/legacy";
