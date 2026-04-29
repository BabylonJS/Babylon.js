// Re-export the augmentation moved to AbstractEngine so that existing
// side-effect imports of this file (e.g. `import "core/Engines/Extensions/engine.textureSelector"`)
// continue to register setTextureFormatToUse / setCompressedTextureExclusions / texturesSupported /
// textureFormatInUse / _textureFormatInUse / _excludedCompressedTextures on the engine prototype.
// The methods are now defined on AbstractEngine so they are available on every engine (WebGL, WebGPU, Native).
import "../AbstractEngine/abstractEngine.textureSelector";
// eslint-disable-next-line no-duplicate-imports
export * from "../AbstractEngine/abstractEngine.textureSelector";
