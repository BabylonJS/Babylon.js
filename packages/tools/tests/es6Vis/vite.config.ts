import { defineConfig } from "vite";

const prebundleBabylonPackages = process.env.ES6VIS_PREBUNDLE === "true";

// Keep side-effect subpaths in the same optimized graph as the package roots.
const babylonOptimizeDeps = [
    "@babylonjs/core",
    "@babylonjs/core/Animations/animatable",
    "@babylonjs/core/Animations/animation",
    "@babylonjs/core/Cameras/arcRotateCamera",
    "@babylonjs/core/Cameras/freeCamera",
    "@babylonjs/core/Engines/engine",
    "@babylonjs/core/Engines/Extensions/engine.multiRender",
    "@babylonjs/core/Helpers/sceneHelpers",
    "@babylonjs/core/Layers/glowLayer",
    "@babylonjs/core/Lights/Shadows/shadowGenerator",
    "@babylonjs/core/Lights/directionalLight",
    "@babylonjs/core/Lights/hemisphericLight",
    "@babylonjs/core/Lights/pointLight",
    "@babylonjs/core/Loading/sceneLoader",
    "@babylonjs/core/Materials/Node/nodeMaterial",
    "@babylonjs/core/Materials/PBR/pbrMaterial",
    "@babylonjs/core/Materials/Textures/Procedurals/noiseProceduralTexture",
    "@babylonjs/core/Materials/Textures/cubeTexture",
    "@babylonjs/core/Materials/Textures/texture",
    "@babylonjs/core/Materials/standardMaterial",
    "@babylonjs/core/Maths/math.color",
    "@babylonjs/core/Maths/math.vector",
    "@babylonjs/core/Meshes/Builders/boxBuilder",
    "@babylonjs/core/Meshes/Builders/cylinderBuilder",
    "@babylonjs/core/Meshes/Builders/groundBuilder",
    "@babylonjs/core/Meshes/Builders/sphereBuilder",
    "@babylonjs/core/Meshes/Builders/torusKnotBuilder",
    "@babylonjs/core/Meshes/meshBuilder",
    "@babylonjs/core/Meshes/thinInstanceMesh",
    "@babylonjs/core/Particles/particleSystem",
    "@babylonjs/core/Particles/solidParticleSystem",
    "@babylonjs/core/PostProcesses",
    "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines",
    "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline",
    "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline",
    "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent",
    "@babylonjs/core/Rendering/depthRenderer",
    "@babylonjs/core/Rendering/prePassRenderer",
    "@babylonjs/core/Rendering/prePassRendererSceneComponent",
    "@babylonjs/core/pure",
    "@babylonjs/core/scene",
    "@babylonjs/gui",
    "@babylonjs/gui/2D/advancedDynamicTexture",
    "@babylonjs/gui/2D/controls/button",
    "@babylonjs/gui/2D/controls/control",
    "@babylonjs/gui/2D/controls/sliders/slider",
    "@babylonjs/gui/2D/controls/stackPanel",
    "@babylonjs/gui/2D/controls/textBlock",
    "@babylonjs/loaders/glTF",
];

export default defineConfig({
    root: __dirname,

    resolve: {
        extensions: [".ts", ".js", ".mjs"],
    },

    server: {
        port: 1340,
        host: "::",
    },

    optimizeDeps: prebundleBabylonPackages
        ? {
              entries: ["src/bootstrap.ts", "src/scenes/*/*.ts"],
              include: babylonOptimizeDeps,
          }
        : {
              // Prevent Vite from pre-bundling the large @babylonjs packages.
              // They ship as native ESM and will be served directly.
              exclude: ["@babylonjs/core", "@babylonjs/gui", "@babylonjs/loaders"],
          },
});
