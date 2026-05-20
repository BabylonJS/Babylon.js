#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * verifyPhase4.mjs
 *
 * Comprehensive verification that Phase 4.3 (static→standalone extraction) is complete.
 *
 * 1. Scans ALL .ts files in packages/dev/core/src/ for classes with static methods
 * 2. Cross-references each file against the Phase 4.3 tracking table
 * 3. For "Done" files, verifies standalone functions actually exist
 * 4. Reports gaps: files not in the tracking table, incorrect counts, missing extractions
 *
 * Usage:
 *   node scripts/treeshaking/migration/verifyPhase4.mjs [--verbose] [--verify-extractions]
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, relative, join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "../../../packages/dev/core/src");

const VERBOSE = process.argv.includes("--verbose");
const VERIFY_EXTRACTIONS = process.argv.includes("--verify-extractions");

// ── Tracking table from TREE_SHAKING_PLAN.md ──────────────────────────────
// Status: "done" | "skip"
// NOTE: Phase 4.3 extractions (foo.pure.ts + foo.ts wrapper) are auto-detected
// and do NOT need entries here. Only files that keep statics on the class
// (Phase 4.2 inline, or intentional skips) need manual entries.
const TRACKING_TABLE = {
    "Maths/math.vector.pure.ts": { methods: 177, status: "done", note: "Vector2/3/4, Quaternion, Matrix" },
    "Maths/math.color.pure.ts": { methods: 33, status: "done", note: "Color3: 22, Color4: 11" },
    "Misc/tools.ts": { methods: 46, status: "done", note: "46 extracted, 11 kept" },
    "Meshes/mesh.pure.ts": { methods: 28, status: "done", note: "28 extracted, 2 kept" },
    "Misc/PerformanceViewer/performanceViewerCollectionStrategies.ts": { methods: 26, status: "done", note: "26 extracted" },
    "Meshes/mesh.vertexData.ts": { methods: 23, status: "done", note: "" },
    "Misc/greasedLineTools.ts": { methods: 23, status: "done", note: "" },
    "Engines/WebGPU/webgpuTextureHelper.ts": { methods: 15, status: "done", note: "15 extracted" },
    "Loading/sceneLoader.ts": { methods: 14, status: "skip", note: "private module functions" },
    "Animations/animation.ts": { methods: 9, status: "done", note: "" },
    "Misc/trajectoryClassifier.ts": { methods: 11, status: "skip", note: "only 2 of 11 clean" },
    "Maths/math.path.ts": { methods: 11, status: "done", note: "" },
    "Animations/animationGroup.ts": { methods: 10, status: "skip", note: "private instance fields" },
    "Misc/tags.ts": { methods: 9, status: "done", note: "" },
    "Maths/math.frustum.ts": { methods: 9, status: "done", note: "" },
    "Misc/dataStorage.ts": { methods: 8, status: "skip", note: "private _Storage" },
    "Materials/Textures/rawTexture.ts": { methods: 8, status: "done", note: "" },
    "XR/motionController/webXRMotionControllerManager.ts": { methods: 8, status: "skip", note: "6 of 8 use private registries" },
    "Materials/materialHelper.geometryrendering.ts": { methods: 7, status: "skip", note: "private _Configurations" },
    "Misc/decorators.serialization.ts": { methods: 6, status: "done", note: "" },
    "Culling/ray.core.ts": { methods: 6, status: "done", note: "" },
    "XR/webXRFeaturesManager.ts": { methods: 6, status: "skip", note: "all readonly constants" },
    "Meshes/abstractMesh.pure.ts": { methods: 6, status: "skip", note: "all readonly constants" },
    "Maths/math.polar.ts": { methods: 6, status: "done", note: "" },
    "Buffers/buffer.ts": { methods: 5, status: "done", note: "" },
    "Materials/Node/nodeMaterial.pure.ts": { methods: 4, status: "done", note: "" },
    "Particles/particleHelper.ts": { methods: 5, status: "done", note: "" },
    "Actions/actionEvent.ts": { methods: 4, status: "done", note: "" },
    "Maths/math.size.ts": { methods: 2, status: "done", note: "" },
    "Engines/shaderStore.ts": { methods: 3, status: "done", note: "" },
    "Maths/sphericalPolynomial.ts": { methods: 4, status: "done", note: "SphericalHarmonics: 2, SphericalPolynomial: 2" },
    "Culling/boundingBox.ts": { methods: 3, status: "done", note: "3 extracted, 1 kept" },
    "Misc/sceneOptimizer.ts": { methods: 4, status: "done", note: "SceneOptimizerOptions: 3, SceneOptimizer: 1" },
    "Materials/prePassConfiguration.ts": { methods: 2, status: "done", note: "AddUniforms, AddSamplers" },
    "FrameGraph/Node/nodeRenderGraphBlockConnectionPoint.ts": { methods: 3, status: "done", note: "" },
    "Sprites/spriteManager.ts": { methods: 3, status: "done", note: "" },
    "Meshes/Node/nodeGeometry.ts": { methods: 3, status: "done", note: "" },
    "Particles/Node/nodeParticleSystemSet.ts": { methods: 4, status: "done", note: "" },
    "node.ts": { methods: 1, status: "done", note: "ParseAnimationRanges" },
    "Misc/khronosTextureContainer2.ts": { methods: 1, status: "done", note: "IsValid" },
    "Culling/boundingSphere.ts": { methods: 1, status: "done", note: "" },
    "FrameGraph/Node/nodeRenderGraph.ts": { methods: 3, status: "done", note: "" },
    "Misc/rgbdTextureTools.ts": { methods: 2, status: "done", note: "" },
    "Misc/dds.ts": { methods: 1, status: "done", note: "" },
    "Misc/timingTools.ts": { methods: 1, status: "done", note: "" },
    "Misc/retryStrategy.ts": { methods: 1, status: "done", note: "" },
    "Misc/gradients.ts": { methods: 1, status: "done", note: "" },
    "Misc/deepCopier.ts": { methods: 1, status: "done", note: "" },
    "Misc/asyncLock.ts": { methods: 1, status: "done", note: "" },
    "Misc/videoRecorder.ts": { methods: 1, status: "done", note: "" },
    "Misc/khronosTextureContainer.ts": { methods: 1, status: "done", note: "" },
    "Probes/reflectionProbe.ts": { methods: 1, status: "done", note: "" },
    "FrameGraph/Passes/renderPass.ts": { methods: 1, status: "done", note: "" },
    "FrameGraph/Passes/objectListPass.ts": { methods: 1, status: "done", note: "" },
    "FrameGraph/frameGraphTextureManager.ts": { methods: 1, status: "done", note: "" },
    "FrameGraph/Tasks/Rendering/csmShadowGeneratorTask.ts": { methods: 1, status: "done", note: "" },
    "Materials/effect.ts": { methods: 1, status: "skip", note: "heavily augmented" },
    "Materials/materialHelper.ts": { methods: 25, status: "skip", note: "already delegates to standalone functions" },
    "Meshes/meshSimplification.ts": { methods: 2, status: "skip", note: "internal non-exported class" },
    "Materials/Textures/videoTexture.ts": { methods: 3, status: "skip", note: "inline object types" },
    "Misc/andOrNotEvaluator.ts": { methods: 1, status: "skip", note: "private _HandleParenthesisContent" },
    "Misc/sceneRecorder.ts": { methods: 1, status: "skip", note: "accesses private members" },
    "Misc/HighDynamicRange/panoramaToCubemap.ts": { methods: 1, status: "skip", note: "private static helpers" },
    "Misc/dumpTools.ts": { methods: 1, status: "skip", note: "@nativeOverride decorator" },
    "Meshes/geometry.ts": { methods: 2, status: "skip", note: "2 clean, low ROI" },
    "Engines/abstractEngine.ts": { methods: 5, status: "skip", note: "stubs, low ROI" },
    // ── Newly triaged files (from verification audit) ──
    // Phase 4.3 extractions (math.plane, sceneSerializer, polygonMesh, csg)
    // are auto-detected and don't need entries here.
    // Skip (≥3 methods):
    "Rendering/renderingGroup.ts": { methods: 4, status: "skip", note: "@internal, sort callbacks read _-prefixed SubMesh fields" },
    "Physics/v2/physicsShape.ts": { methods: 4, status: "skip", note: "trivial factory stubs" },
    "Physics/physicsHelper.ts": { methods: 3, status: "skip", note: "non-exported HelperTools class" },
    "Meshes/GaussianSplatting/gaussianSplattingMesh.ts": { methods: 3, status: "skip", note: "deep private static dep chain" },
    "Materials/Textures/texture.ts": { methods: 3, status: "skip", note: "constructor wrappers + private static hooks" },
    "Materials/Textures/cubeTexture.ts": { methods: 3, status: "skip", note: "trivial constructor wrappers" },
    "Engines/WebGPU/webgpuCacheRenderPipelineTree.ts": { methods: 3, status: "skip", note: "@internal, private _Cache state" },
    "Engines/Processors/Expressions/shaderDefineExpression.ts": { methods: 3, status: "skip", note: "@internal, private static caching" },
    // Skip (2 methods):
    "scene.pure.ts": { methods: 2, status: "skip", note: "factory property assignments" },
    "node.pure.ts": { methods: 2, status: "skip", note: "AddNodeConstructor + Construct, registry pattern" },
    "XR/features/WebXRHitTestLegacy.ts": { methods: 2, status: "skip", note: "low ROI, XR-specific" },
    "PostProcesses/postProcess.ts": { methods: 2, status: "skip", note: "RegisterShaderCodeProcessing + Parse, coupled" },
    "Physics/v2/Plugins/havokPlugin.ts": { methods: 2, status: "skip", note: "readToRef on internal event classes" },
    "Particles/flowMap.ts": { methods: 2, status: "skip", note: "factory async methods, low ROI" },
    "Morph/morphTarget.ts": { methods: 2, status: "skip", note: "Parse + FromMesh, low ROI" },
    "Misc/HighDynamicRange/cubemapToSphericalPolynomial.ts": { methods: 2, status: "skip", note: "low ROI" },
    "Meshes/subMesh.ts": { methods: 2, status: "skip", note: "factory stubs" },
    "Meshes/csg2.ts": { methods: 2, status: "skip", note: "factory stubs" },
    "Maths/math.functions.ts": { methods: 2, status: "skip", note: "already standalone functions" },
    "Materials/shaderMaterial.pure.ts": { methods: 2, status: "skip", note: "ParseFromFileAsync + ParseFromSnippetAsync" },
    "Materials/meshDebugPluginMaterial.pure.ts": { methods: 2, status: "skip", note: "Reset + PrepareMesh, low ROI" },
    "Materials/material.ts": { methods: 2, status: "skip", note: "deserialization stubs" },
    "Materials/colorCurves.ts": { methods: 2, status: "skip", note: "Bind + Parse, low ROI" },
    "Lights/light.ts": { methods: 2, status: "skip", note: "deserialization" },
    "Engines/WebGPU/webgpuCacheSampler.ts": { methods: 2, status: "skip", note: "@internal, GPU caching internals" },
    "Debug/skeletonViewer.ts": { methods: 2, status: "skip", note: "shader factories, low ROI" },
    "Cameras/camera.ts": { methods: 2, status: "skip", note: "deserialization" },
    "Bones/skeleton.ts": { methods: 2, status: "skip", note: "MakeAnimationAdditive + Parse" },
    "Actions/actionManager.ts": { methods: 2, status: "skip", note: "deserialization" },
    // Skip (1 method each — bulk):
    "XR/webXRSessionManager.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "XR/webXRManagedOutputCanvas.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "XR/webXRExperienceHelper.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "XR/webXREnterExitUI.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "XR/webXRDefaultExperience.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "XR/features/WebXRNearInteraction.ts": { methods: 1, status: "skip", note: "1 method, low ROI" },
    "Sprites/sprite.ts": { methods: 1, status: "skip", note: "Parse, low ROI" },
    "PostProcesses/volumetricLightScatteringPostProcess.pure.ts": { methods: 1, status: "skip", note: "CreateDefaultMesh, low ROI" },
    "PostProcesses/RenderPipeline/Pipelines/taaRenderingPipeline.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "PostProcesses/RenderPipeline/Pipelines/standardRenderingPipeline.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "PostProcesses/RenderPipeline/Pipelines/ssrRenderingPipeline.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Physics/v2/physicsEngine.ts": { methods: 1, status: "skip", note: "DefaultPluginFactory" },
    "Physics/v1/physicsEngine.ts": { methods: 1, status: "skip", note: "DefaultPluginFactory" },
    "Particles/subEmitter.ts": { methods: 1, status: "skip", note: "Parse" },
    "Particles/particleSystemSet.ts": { methods: 1, status: "skip", note: "Parse" },
    "Particles/particleSystem.ts": { methods: 1, status: "skip", note: "Parse" },
    "Particles/gpuParticleSystem.ts": { methods: 1, status: "skip", note: "Parse" },
    "Morph/morphTargetManager.ts": { methods: 1, status: "skip", note: "Parse" },
    "Misc/observable.ts": { methods: 1, status: "skip", note: "FromPromise" },
    "Misc/observable.extensions.ts": { methods: 1, status: "skip", note: "MultiObserver.Watch" },
    "Misc/logger.ts": { methods: 1, status: "skip", note: "ClearLogCache" },
    "Misc/khronosTextureContainer2.pure.ts": { methods: 1, status: "skip", note: "GetDefaultNumWorkers" },
    "Misc/instantiationTools.ts": { methods: 1, status: "skip", note: "Instantiate" },
    "Misc/greasedLineTools.pure.ts": { methods: 1, status: "skip", note: "OmitDuplicatesPredicate residual" },
    "Misc/dds.pure.ts": { methods: 1, status: "skip", note: "UploadDDSLevels residual" },
    "Meshes/transformNode.ts": { methods: 1, status: "skip", note: "Parse" },
    "Meshes/geodesicMesh.ts": { methods: 1, status: "skip", note: "BuildGeodesicData" },
    "Meshes/Compression/dracoEncoder.ts": { methods: 1, status: "skip", note: "ResetDefault" },
    "Meshes/Compression/dracoDecoder.ts": { methods: 1, status: "skip", note: "ResetDefault" },
    "Meshes/Compression/dracoCompression.ts": { methods: 1, status: "skip", note: "ResetDefault" },
    "Maths/math.isovector.ts": { methods: 1, status: "skip", note: "_IsoVector.Zero, internal" },
    "Materials/multiMaterial.pure.ts": { methods: 1, status: "skip", note: "ParseMultiMaterial" },
    "Materials/imageProcessingConfiguration.ts": { methods: 1, status: "skip", note: "Parse" },
    "Materials/fresnelParameters.ts": { methods: 1, status: "skip", note: "Parse" },
    "Materials/effectRenderer.ts": { methods: 1, status: "skip", note: "RegisterShaderCodeProcessing" },
    "Materials/drawWrapper.ts": { methods: 1, status: "skip", note: "GetEffect" },
    "Materials/Textures/rawTexture2DArray.ts": { methods: 1, status: "skip", note: "CreateRGBATexture" },
    "Materials/Textures/hdrCubeTexture.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Materials/Textures/externalTexture.ts": { methods: 1, status: "skip", note: "IsExternalTexture" },
    "Materials/Textures/exrCubeTexture.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Materials/Textures/colorGradingTexture.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Materials/Textures/baseTexture.ts": { methods: 1, status: "skip", note: "WhenAllReady" },
    "Materials/Node/nodeMaterialBlockConnectionPoint.ts": { methods: 1, status: "skip", note: "AreEquivalentTypes" },
    "Materials/Node/Blocks/PBR/subSurfaceBlock.pure.ts": { methods: 1, status: "skip", note: "GetCode" },
    "Materials/Node/Blocks/PBR/iridescenceBlock.pure.ts": { methods: 1, status: "skip", note: "GetCode" },
    "Materials/Node/Blocks/PBR/clearCoatBlock.pure.ts": { methods: 1, status: "skip", note: "GetCode" },
    "Materials/GaussianSplatting/gaussianSplattingMaterial.pure.ts": { methods: 1, status: "skip", note: "BindEffect" },
    "Materials/GaussianSplatting/gaussianSplattingGpuPickingMaterialPlugin.pure.ts": { methods: 1, status: "skip", note: "EncodeIdToColor" },
    "Lights/lightConstants.ts": { methods: 1, status: "skip", note: "CompareLightsPriority" },
    "Lights/Shadows/shadowGenerator.ts": { methods: 1, status: "skip", note: "Parse" },
    "Lights/Clustered/clusteredLightContainer.ts": { methods: 1, status: "skip", note: "IsLightSupported" },
    "LensFlares/lensFlareSystem.ts": { methods: 1, status: "skip", note: "Parse" },
    "LensFlares/lensFlare.ts": { methods: 1, status: "skip", note: "AddFlare" },
    "Layers/effectLayer.ts": { methods: 1, status: "skip", note: "Parse" },
    "Gizmos/gizmo.ts": { methods: 1, status: "skip", note: "GizmoAxisPointerObserver" },
    "Gizmos/boundingBoxGizmo.ts": { methods: 1, status: "skip", note: "MakeNotPickableAndWrapInBoundingBox" },
    "FlowGraph/CustomTypes/flowGraphInteger.pure.ts": { methods: 1, status: "skip", note: "FromValue" },
    "Events/clipboardEvents.ts": { methods: 1, status: "skip", note: "GetTypeFromCharacter" },
    "Engines/webgpuEngine.ts": { methods: 1, status: "skip", note: "CreateAsync" },
    "Engines/thinEngine.ts": { methods: 1, status: "skip", note: "isSupported" },
    "Engines/performanceConfigurator.ts": { methods: 1, status: "skip", note: "SetMatrixPrecision" },
    "Engines/engineFactory.ts": { methods: 1, status: "skip", note: "CreateAsync" },
    "Engines/WebGPU/webgpuCacheBindGroups.ts": { methods: 1, status: "skip", note: "ResetCache" },
    "DeviceInput/eventFactory.ts": { methods: 1, status: "skip", note: "CreateDeviceEvent" },
    "Debug/rayHelper.ts": { methods: 1, status: "skip", note: "CreateAndShow" },
    "Culling/boundingSphere.pure.ts": { methods: 1, status: "skip", note: "CreateFromCenterAndRadius residual" },
    "Culling/boundingBox.pure.ts": { methods: 1, status: "skip", note: "IntersectsSphere residual" },
    "Compute/computeShader.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Compute/computeEffect.ts": { methods: 1, status: "skip", note: "RegisterShader" },
    "Cameras/VR/vrCameraMetrics.ts": { methods: 1, status: "skip", note: "GetDefault" },
    "Cameras/Inputs/freeCameraDeviceOrientationInput.ts": { methods: 1, status: "skip", note: "WaitForOrientationChangeAsync" },
    "Audio/sound.pure.ts": { methods: 1, status: "skip", note: "Parse" },
    "Actions/condition.pure.ts": { methods: 1, status: "skip", note: "GetOperatorName" },
    "Actions/abstractActionManager.ts": { methods: 1, status: "skip", note: "HasSpecificTrigger" },
};

// Normalize tracking table keys — resolve to .pure.ts if that's what exists on disk
function normalizeFilePath(relPath) {
    // Try the path as-is first
    if (existsSync(resolve(SRC_ROOT, relPath))) {
        return relPath;
    }
    // Try .pure.ts variant
    const purePath = relPath.replace(/\.ts$/, ".pure.ts");
    if (existsSync(resolve(SRC_ROOT, purePath))) {
        return purePath;
    }
    return relPath;
}

// Build normalized lookup
const normalizedTracking = new Map();
for (const [key, value] of Object.entries(TRACKING_TABLE)) {
    const norm = normalizeFilePath(key);
    normalizedTracking.set(norm, { ...value, originalKey: key });
}

// ── Parse all classes and their static methods from a file ──────────────────
function parseAllStaticMethods(source) {
    const results = []; // { className, methods: string[], props: string[] }

    // Find all exported classes — must be at line start (not in comments)
    const classRe = /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)\b[^{]*\{/gm;
    let classMatch;
    while ((classMatch = classRe.exec(source)) !== null) {
        const className = classMatch[1];
        const startIdx = classMatch.index + classMatch[0].length;
        let depth = 1;
        let i = startIdx;
        while (i < source.length && depth > 0) {
            if (source[i] === "{") {
                depth++;
            } else if (source[i] === "}") {
                depth--;
            }
            i++;
        }
        const classBody = source.substring(startIdx, i - 1);

        const methods = [];
        const props = [];

        // Match static members
        const staticRe = /(?:public\s+)?static\s+(?:async\s+)?(?:readonly\s+)?(\w+)\s*[<(:=;]/g;
        let m;
        while ((m = staticRe.exec(classBody)) !== null) {
            const name = m[0];
            const memberName = m[1];
            if (memberName.startsWith("_")) {
                continue;
            }

            const charAfterName = name.slice(name.indexOf(memberName) + memberName.length).trim()[0];
            if (charAfterName === "(" || charAfterName === "<") {
                methods.push(memberName);
            } else {
                props.push(memberName);
            }
        }

        // Deduplicate (overloads)
        const uniqueMethods = [...new Set(methods)];
        const uniqueProps = [...new Set(props)];

        if (uniqueMethods.length > 0 || uniqueProps.length > 0) {
            results.push({
                className,
                methods: uniqueMethods,
                props: uniqueProps,
            });
        }
    }

    return results;
}

// ── Check if standalone functions exist in the .pure.ts file ────────────────
function findStandaloneFunctions(source) {
    const funcs = [];
    // Match: export function ClassName_MethodName or export function ClassNameMethodName
    const re = /^export\s+function\s+(\w+)/gm;
    let m;
    while ((m = re.exec(source)) !== null) {
        funcs.push(m[1]);
    }
    return funcs;
}

// ── Check if declare module augmentations exist in wrapper .ts ──────────────
function findAugmentations(source) {
    const augmentations = [];
    // Match: ClassName.MethodName = ClassNameMethodName;
    const re = /^(\w+)\.(\w+)\s*=\s*(\w+)\s*;/gm;
    let m;
    while ((m = re.exec(source)) !== null) {
        augmentations.push({ className: m[1], methodName: m[2], funcName: m[3] });
    }
    return augmentations;
}

// ── Auto-detect Phase 4.3 extractions ───────────────────────────────────────
// Phase 4.3 creates a .pure.ts file with standalone functions and a wrapper .ts
// with augmentations. These don't need manual tracking table entries.
function detectExtractionEvidence(relFile) {
    const evidence = [];
    const basePath = relFile.replace(/\.pure\.ts$/, "").replace(/\.ts$/, "");

    // 1. Check for .pure.ts companion with standalone functions
    const purePath = basePath + ".pure.ts";
    const pureAbsPath = resolve(SRC_ROOT, purePath);
    if (existsSync(pureAbsPath) && purePath !== relFile) {
        const pureSource = readFileSync(pureAbsPath, "utf8");
        const funcs = findStandaloneFunctions(pureSource);
        if (funcs.length > 0) {
            evidence.push({ type: "pure-companion", file: purePath, count: funcs.length });
        }
    }

    // 2. Check for .functions.ts companions (Phase 4.2 pattern)
    const funcFiles = globSync(`${basePath}*.functions.ts`, { cwd: SRC_ROOT });
    for (const ff of funcFiles) {
        const ffSource = readFileSync(resolve(SRC_ROOT, ff), "utf8");
        const funcs = findStandaloneFunctions(ffSource);
        if (funcs.length > 0) {
            evidence.push({ type: "functions-file", file: ff, count: funcs.length });
        }
    }

    // 3. Check for inline standalone functions in the file itself
    if (existsSync(resolve(SRC_ROOT, relFile))) {
        const source = readFileSync(resolve(SRC_ROOT, relFile), "utf8");
        const funcs = findStandaloneFunctions(source);
        if (funcs.length > 0) {
            evidence.push({ type: "inline", file: relFile, count: funcs.length });
        }
    }

    // 4. If this IS a .pure.ts file, check wrapper for augmentations
    if (relFile.endsWith(".pure.ts")) {
        const wrapperPath = relFile.replace(".pure.ts", ".ts");
        const wrapperAbsPath = resolve(SRC_ROOT, wrapperPath);
        if (existsSync(wrapperAbsPath)) {
            const wrapperSource = readFileSync(wrapperAbsPath, "utf8");
            const augs = findAugmentations(wrapperSource);
            if (augs.length > 0) {
                evidence.push({ type: "wrapper-augmentation", file: wrapperPath, count: augs.length });
            }
        }
    }

    return evidence;
}

// ── Directories to skip (shaders, tests, etc.) ─────────────────────────────
const SKIP_DIRS = ["Shaders", "ShadersWGSL"];

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║       Phase 4.3 Comprehensive Verification Report          ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    // 1. Scan ALL .ts files
    const allFiles = globSync("**/*.ts", {
        cwd: SRC_ROOT,
        ignore: ["**/*.d.ts", "**/test/**", "**/Shaders/**", "**/ShadersWGSL/**"],
    });

    const fileInventory = new Map(); // relPath → { classes: [...], totalMethods, totalProps }

    for (const relFile of allFiles) {
        const absPath = resolve(SRC_ROOT, relFile);
        let source;
        try {
            source = readFileSync(absPath, "utf8");
        } catch {
            continue;
        }

        const classResults = parseAllStaticMethods(source);
        if (classResults.length === 0) {
            continue;
        }

        const totalMethods = classResults.reduce((sum, c) => sum + c.methods.length, 0);
        const totalProps = classResults.reduce((sum, c) => sum + c.props.length, 0);

        if (totalMethods === 0) {
            continue;
        } // Only care about files with extractable methods

        fileInventory.set(relFile, { classes: classResults, totalMethods, totalProps });
    }

    // 2. Cross-reference against tracking table + auto-detection
    const tracked = new Set();
    const autoDetected = []; // Files detected as done via .pure.ts/.functions.ts companions
    const untracked = [];
    const countMismatches = [];

    for (const [relFile, info] of fileInventory) {
        const trackEntry = normalizedTracking.get(relFile);
        // Also check if the base .ts file is tracked when we're looking at a .pure.ts
        const baseFile = relFile.endsWith(".pure.ts") ? relFile.replace(".pure.ts", ".ts") : null;
        const baseTrackEntry = baseFile ? normalizedTracking.get(baseFile) : null;
        // Also check if the .pure.ts variant is tracked when we're looking at a base .ts
        const pureFile = !relFile.endsWith(".pure.ts") ? relFile.replace(/\.ts$/, ".pure.ts") : null;
        const pureTrackEntry = pureFile ? normalizedTracking.get(pureFile) : null;

        if (trackEntry || baseTrackEntry || pureTrackEntry) {
            tracked.add(relFile);
            const entry = trackEntry || baseTrackEntry || pureTrackEntry;
            if (entry.methods !== info.totalMethods && VERBOSE) {
                countMismatches.push({
                    file: relFile,
                    tableCount: entry.methods,
                    actualCount: info.totalMethods,
                    status: entry.status,
                });
            }
        } else {
            // Try auto-detection: check for .pure.ts companions, .functions.ts, inline extraction
            const evidence = detectExtractionEvidence(relFile);
            if (evidence.length > 0) {
                autoDetected.push({ file: relFile, evidence, ...info });
                tracked.add(relFile);
            } else {
                untracked.push({ file: relFile, ...info });
            }
        }
    }

    // 3. Check for tracking entries whose files no longer exist or have 0 methods
    const staleEntries = [];
    for (const [normKey, entry] of normalizedTracking) {
        if (!fileInventory.has(normKey)) {
            // File might have 0 methods now (all extracted) or might not exist
            const absPath = resolve(SRC_ROOT, normKey);
            if (!existsSync(absPath)) {
                staleEntries.push({ file: entry.originalKey, reason: "file not found" });
            } else {
                // File exists but has 0 extractable methods — good if status is "done"
                if (entry.status === "done") {
                    tracked.add(normKey); // Still tracked, just fully extracted
                } else {
                    staleEntries.push({ file: entry.originalKey, reason: "0 static methods found (may be fully extracted or renamed)" });
                }
            }
        }
    }

    // ── Report Section 1: Summary ───────────────────────────────────────────
    console.log("── 1. Inventory Summary ──────────────────────────────────────");
    console.log(`  Total .ts files scanned:                    ${allFiles.length}`);
    console.log(`  Files with ≥1 public static method:         ${fileInventory.size}`);
    console.log(`  Total static methods found:                  ${[...fileInventory.values()].reduce((s, v) => s + v.totalMethods, 0)}`);
    console.log(`  Files in tracking table:                     ${normalizedTracking.size}`);
    console.log(`  Auto-detected extractions:                   ${autoDetected.length}`);
    console.log(`  Files matched (tracked & have methods):      ${tracked.size}`);
    console.log(`  Files NOT accounted for:                     ${untracked.length}`);
    console.log();

    // ── Report Section 2: Tracked files status ──────────────────────────────
    const doneFiles = [...normalizedTracking.entries()].filter(([_, v]) => v.status === "done");
    const skipFiles = [...normalizedTracking.entries()].filter(([_, v]) => v.status === "skip");
    console.log("── 2. Tracking Table Coverage ────────────────────────────────");
    console.log(`  ✅ Done (table):          ${doneFiles.length} files`);
    console.log(`  🔍 Done (auto-detected):  ${autoDetected.length} files`);
    console.log(`  ⏭ Skip:                  ${skipFiles.length} files`);
    console.log(`  Total accounted:          ${normalizedTracking.size + autoDetected.length} files`);

    if (autoDetected.length > 0 && VERBOSE) {
        console.log("\n  Auto-detected extractions:");
        for (const entry of autoDetected) {
            const evidenceStr = entry.evidence.map((e) => `${e.type}(${e.count})`).join(", ");
            console.log(`    ${entry.file}: ${evidenceStr}`);
        }
    }
    console.log();

    // ── Report Section 3: UNTRACKED files ───────────────────────────────────
    if (untracked.length > 0) {
        // Sort by method count descending
        untracked.sort((a, b) => b.totalMethods - a.totalMethods);

        console.log("── 3. ⚠️  FILES NOT IN TRACKING TABLE ────────────────────────");
        console.log("   These files have public static methods but are NOT listed");
        console.log("   in the Phase 4.3 tracking table (neither Done nor Skip):\n");

        let untrackedMethods = 0;
        for (const entry of untracked) {
            untrackedMethods += entry.totalMethods;
            const classInfo = entry.classes.map((c) => `${c.className}(${c.methods.length}m)`).join(", ");
            console.log(`  ${String(entry.totalMethods).padStart(3)} methods │ ${entry.file}`);
            if (VERBOSE) {
                console.log(`             │ Classes: ${classInfo}`);
                for (const c of entry.classes) {
                    if (c.methods.length > 0) {
                        console.log(`             │   ${c.className}: ${c.methods.join(", ")}`);
                    }
                }
            }
        }
        console.log(`\n  Total untracked methods: ${untrackedMethods}`);
        console.log(`  Total untracked files:   ${untracked.length}\n`);

        // Breakdown by method count bucket
        const high = untracked.filter((u) => u.totalMethods >= 5);
        const medium = untracked.filter((u) => u.totalMethods >= 3 && u.totalMethods < 5);
        const low = untracked.filter((u) => u.totalMethods < 3);
        console.log(`  Breakdown: ${high.length} files ≥5 methods, ${medium.length} files 3-4 methods, ${low.length} files 1-2 methods\n`);
    } else {
        console.log("── 3. ✅ All files with static methods are in the tracking table\n");
    }

    // ── Report Section 4: Method count mismatches ───────────────────────────
    if (countMismatches.length > 0) {
        console.log("── 4. Method Count Mismatches (table vs. actual) ─────────────");
        for (const mm of countMismatches) {
            const delta = mm.actualCount - mm.tableCount;
            const sign = delta > 0 ? "+" : "";
            console.log(`  ${mm.file}: table=${mm.tableCount}, actual=${mm.actualCount} (${sign}${delta}) [${mm.status}]`);
        }
        console.log();
    }

    // ── Report Section 5: Stale tracking entries ────────────────────────────
    if (staleEntries.length > 0) {
        console.log("── 5. Stale Tracking Entries ──────────────────────────────────");
        for (const s of staleEntries) {
            console.log(`  ${s.file}: ${s.reason}`);
        }
        console.log();
    }

    // ── Report Section 6: Verify extractions for "Done" files ───────────────
    if (VERIFY_EXTRACTIONS) {
        console.log("── 6. Extraction Verification (--verify-extractions) ────────");
        let verified = 0;
        let issues = 0;

        for (const [normKey, entry] of normalizedTracking) {
            if (entry.status !== "done") {
                continue;
            }

            // Determine the pure file path
            let pureFile = normKey;
            if (!pureFile.endsWith(".pure.ts")) {
                pureFile = pureFile.replace(/\.ts$/, ".pure.ts");
            }
            const pureAbsPath = resolve(SRC_ROOT, pureFile);

            // Determine the wrapper file path
            let wrapperFile = normKey;
            if (normKey.endsWith(".pure.ts")) {
                wrapperFile = normKey.replace(".pure.ts", ".ts");
            }
            const wrapperAbsPath = resolve(SRC_ROOT, wrapperFile);

            // Some files have extractions in the same file (no separate .pure.ts),
            // and some files (like math.vector) used Phase 4.2 (.functions.ts) approach.
            // Check all possible locations for evidence of extraction.

            // Strategy 1: Check .pure.ts + wrapper .ts (Phase 4.3 pattern)
            let pureStandalone = 0;
            let wrapperAugmentations = 0;
            if (existsSync(pureAbsPath)) {
                const pureSource = readFileSync(pureAbsPath, "utf8");
                pureStandalone = findStandaloneFunctions(pureSource).length;
            }
            if (existsSync(wrapperAbsPath) && wrapperFile !== pureFile) {
                const wrapperSource = readFileSync(wrapperAbsPath, "utf8");
                wrapperAugmentations = findAugmentations(wrapperSource).length;
            }

            // Strategy 2: Check the original file itself for standalone functions (e.g. ray.core.ts)
            const origAbsPath = resolve(SRC_ROOT, normKey);
            let origStandalone = 0;
            if (existsSync(origAbsPath) && origAbsPath !== pureAbsPath) {
                const origSource = readFileSync(origAbsPath, "utf8");
                origStandalone = findStandaloneFunctions(origSource).length;
            }

            // Strategy 3: Check for companion .functions.ts files (Phase 4.2 pattern)
            const baseName = normKey.replace(/\.pure\.ts$/, "").replace(/\.ts$/, "");
            const funcPatterns = [
                `${baseName}.functions.ts`,
                `${baseName}.quaternion.functions.ts`, // special case for math.vector
            ];
            let functionFileCount = 0;
            for (const fp of funcPatterns) {
                const funcAbsPath = resolve(SRC_ROOT, fp);
                if (existsSync(funcAbsPath)) {
                    functionFileCount += findStandaloneFunctions(readFileSync(funcAbsPath, "utf8")).length;
                }
            }

            const totalEvidence = pureStandalone + wrapperAugmentations + origStandalone + functionFileCount;

            if (totalEvidence === 0) {
                console.log(`  ⚠️  ${entry.originalKey}: no standalone functions or augmentations found anywhere`);
                issues++;
            } else {
                verified++;
                if (VERBOSE) {
                    const parts = [];
                    if (pureStandalone > 0) {
                        parts.push(`${pureStandalone} in .pure.ts`);
                    }
                    if (wrapperAugmentations > 0) {
                        parts.push(`${wrapperAugmentations} augmentations`);
                    }
                    if (origStandalone > 0) {
                        parts.push(`${origStandalone} in original file`);
                    }
                    if (functionFileCount > 0) {
                        parts.push(`${functionFileCount} in .functions.ts`);
                    }
                    console.log(`  ✅ ${entry.originalKey}: ${parts.join(", ")}`);
                }
            }
        }

        console.log(`\n  Table-tracked: ${verified}/${doneFiles.length} | Auto-detected: ${autoDetected.length} | Issues: ${issues}`);

        // Also verify auto-detected files
        if (autoDetected.length > 0) {
            console.log("\n  Auto-detected extractions:");
            for (const ad of autoDetected) {
                const evidenceStr = ad.evidence.map((e) => `${e.type}(${e.count})`).join(", ");
                console.log(`  ✅ ${ad.file}: ${evidenceStr}`);
            }
        }
        console.log();
    }

    // ── Final verdict ───────────────────────────────────────────────────────
    console.log("══════════════════════════════════════════════════════════════");
    if (untracked.length === 0) {
        console.log("  ✅ PASS: All files with static methods are accounted for.");
    } else {
        console.log(`  ⚠️  INCOMPLETE: ${untracked.length} files with ${untracked.reduce((s, u) => s + u.totalMethods, 0)} static methods are not in the tracking table.`);
        console.log("  Run with --verbose for details on each file.");
    }
    console.log("══════════════════════════════════════════════════════════════\n");

    process.exit(untracked.length > 0 ? 1 : 0);
}

main();
