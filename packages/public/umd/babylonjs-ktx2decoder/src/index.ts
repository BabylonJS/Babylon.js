// Export all named symbols directly so KTX2DECODER.LiteTranscoder_UASTC_ASTC etc. work.
// With Rollup UMD (unlike webpack's libraryExport:"default"), named exports must be
// explicitly re-exported for them to appear on the global namespace object.
//
// IMPORTANT: Do NOT also `import * as ktx2decoder; export { ktx2decoder }` here.
// When both patterns coexist, terser collapses all individual exports into the
// namespace object in the minified bundle, leaving KTX2DECODER.X undefined at runtime.
export * from "ktx2decoder/legacy/legacy";
