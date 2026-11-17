// Exercise the emitted bundle: source-level tests do not catch minify/downlevel collisions.
const assert = require("node:assert/strict");
const BABYLON = require("../babylon.es5.js");

Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { gpu: { getPreferredCanvasFormat: () => "bgra8unorm" } },
});

const engine = new BABYLON.WebGPUEngine({
    width: 1,
    height: 1,
    addEventListener() {},
    removeEventListener() {},
});
const processor = engine._getShaderProcessor(BABYLON.ShaderLanguage.WGSL);

for (const [type, dimension, count] of [
    ["texture_cube<f32>", "cube", 1],
    ["texture_2d<f32>", "2d", 1],
    ["array<texture_cube<f32>, 2>", "cube", 2],
]) {
    const context = engine._getShaderProcessingContext(BABYLON.ShaderLanguage.WGSL, true);
    processor.initializeShaders(context);
    const declaration = processor.textureProcessor(`var environment : ${type};`, true, {});
    assert.match(declaration, /^@group\(0\) @binding\(0\)/);
    const entries = context.bindGroupLayoutEntries.flat();
    assert.equal(entries.length, count, type);
    for (const [index, entry] of entries.entries()) {
        assert.equal(entry.texture.viewDimension, dimension, type);
        assert.equal(entry.binding, index, type);
    }
}
