#!/usr/bin/env node
/**
 * populate-vis-test-tags.mjs
 *
 * Fetches each playground snippet referenced in config.json, analyzes the code
 * for Babylon.js API usage, and populates the `dependsOn` field with matching tags.
 *
 * Usage:
 *   node scripts/populate-vis-test-tags.mjs [--dry-run] [--concurrency N]
 *
 * Options:
 *   --dry-run       Print results without writing config.json
 *   --concurrency N Number of concurrent snippet fetches (default: 5)
 */

import * as fs from "node:fs";
import * as https from "node:https";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "packages/tools/tests/test/visualization/config.json");
const TAGMAP_PATH = path.join(ROOT, "packages/tools/tests/test/visualization/tagMap.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const concurrencyIdx = args.indexOf("--concurrency");
let CONCURRENCY = 5;

if (concurrencyIdx !== -1) {
    const concurrencyValue = args[concurrencyIdx + 1];
    const parsedConcurrency = Number(concurrencyValue);

    if (
        concurrencyValue === undefined ||
        concurrencyValue.startsWith("--") ||
        !Number.isFinite(parsedConcurrency) ||
        !Number.isInteger(parsedConcurrency) ||
        parsedConcurrency < 1
    ) {
        console.error("Invalid value for --concurrency. Expected an integer greater than or equal to 1.");
        process.exit(1);
    }

    CONCURRENCY = parsedConcurrency;
}

// ---------------------------------------------------------------------------
// Tag detection patterns — matched against snippet code
// ---------------------------------------------------------------------------
// Each entry: [tag, RegExp]
// Order matters for specificity — more specific patterns first where tags overlap.
const CODE_PATTERNS = [
    // --- Gaussian Splatting (before generic Meshes) ---
    ["GaussianSplatting", /GaussianSplattingMesh|GaussianSplatting|\.splat['"`]|\.spz['"`]/i],

    // --- GreasedLine (before generic Meshes) ---
    ["GreasedLine", /GreasedLine|CreateGreasedLine/i],

    // --- CSG (before generic Meshes) ---
    ["CSG", /\bCSG\b|\.subtract\(|\.intersect\(.*mesh/i],

    // --- PBR (before generic Materials) ---
    [
        "PBR",
        /PBRMaterial|PBRMetallicRoughnessMaterial|PBRSpecularGlossinessMaterial|PBRBaseMaterial|OpenPBR|PBRAnisotropicConfiguration|PBRSheenConfiguration|PBRClearCoatConfiguration|PBRSubSurface|PBRIridescenceConfiguration/i,
    ],

    // --- Node Material (before generic Materials) ---
    [
        "NodeMaterial",
        /NodeMaterial|InputBlock|TransformBlock|FragmentOutputBlock|VertexOutputBlock|TextureBlock|ReflectionBlock|PBRMetallicRoughnessBlock|LightBlock|ImageSourceBlock/i,
    ],

    // --- Shadows (before generic Lights) ---
    ["Shadows", /ShadowGenerator|CascadedShadowGenerator|ShadowLight|shadowGenerator|\.shadowEnabled|getShadowGenerator|shadowMinZ|shadowMaxZ|IBLShadows/i],

    // --- Lights (only focused lighting tests, not basic scene setup) ---
    [
        "Lights",
        /PointLight|SpotLight|DirectionalLight|Light\b.*setEnabled|LightFalloff|lightFalloff|\.includedOnlyMeshes|\.excludedMeshes.*light|\.range\s*=|\.exponent\s*=|IESLight/i,
    ],

    // --- Cameras (only focused camera tests, not basic scene setup) ---
    [
        "Cameras",
        /FollowCamera|AnaglyphArcRotateCamera|StereoscopicArcRotateCamera|VRDeviceOrientationArcRotateCamera|DeviceOrientationCamera|FlyCamera|camera\.viewport|multiview|MultiviewRenderTarget|CameraRig|activeCameras|cameraDirection|cameraRotation|camera.*inputs|upVector/i,
    ],

    // --- GUI ---
    [
        "GUI",
        /AdvancedDynamicTexture|BABYLON\.GUI|GUI\.|StackPanel|TextBlock|Slider|RadioButton|Checkbox|ColorPicker|InputText|ScrollViewer|Grid\b.*addControl|Button\.Create|Image\b.*new.*GUI|DisplayGrid|Ellipse|Rectangle\b.*addControl|SelectionPanel|VirtualKeyboard|HolographicSlate|NearMenu|TouchHolographic|GUI3DManager|PlanePanel|SpherePanel|CylinderPanel|ScatterPanel|MeshButton3D|HolographicButton/i,
    ],

    // --- Post-processes ---
    [
        "PostProcesses",
        /PostProcess|DefaultRenderingPipeline|SSAO2RenderingPipeline|SSRRenderingPipeline|MotionBlurPostProcess|BloomEffect|ScreenSpaceReflection|LensRenderingPipeline|VolumetricLightScatteringPostProcess|ConvolutionPostProcess|ColorCorrectionPostProcess|DepthOfField|ImageProcessingPostProcess|FxaaPostProcess|GrainPostProcess|SharpenPostProcess|ChromaticAberrationPostProcess|TonemapPostProcess|BlackAndWhitePostProcess|HighlightsPostProcess|ScreenSpaceCurvature|TAAPostProcess/i,
    ],

    // --- Particles ---
    ["Particles", /ParticleSystem|GPUParticleSystem|ParticleHelper|particleSystem|SolidParticleSystem|PointsCloudSystem|CloudPoint/i],

    // --- Physics ---
    ["Physics", /PhysicsAggregate|HavokPlugin|PhysicsBody|PhysicsShape|PhysicsEngine|PhysicsHelper|PhysicsImpostor|AmmoJSPlugin|CannonJSPlugin|PhysicsMotionType/i],

    // --- Animations ---
    ["Animations", /\bAnimation\b.*new|AnimationGroup|beginAnimation|beginDirectAnimation|Animatable\b|Animation\.CreateAndStartAnimation|ANIMATIONTYPE/i],

    // --- Bones / Skeleton ---
    ["Bones", /Skeleton|Bone\b|BoneIKController|BoneLookController|skeleton\./i],

    // --- Morph targets ---
    ["Morph", /MorphTarget|MorphTargetManager|morphTargetManager/i],

    // --- Sprites ---
    ["Sprites", /SpriteManager|Sprite\b.*new|SpriteMap|SpritePackedManager/i],

    // --- Textures (broad) ---
    [
        "Textures",
        /CubeTexture|HDRCubeTexture|RawTexture|RawCubeTexture|VideoTexture|DynamicTexture|EquiRectangularCubeTexture|CustomProceduralTexture|RenderTargetTexture|MultiRenderTarget|MirrorTexture|RefractionTexture|\.noMipmap|KTX2|\.ktx2|basis\.js|CompressedTextureFactory|DepthTextureCreationOptions/i,
    ],

    // --- glTF loader ---
    ["glTF", /SceneLoader.*\.gl(?:tf|b)|\.gltf['"`]|\.glb['"`]|GLTF2|GLTFFileLoader|loadAssetContainerAsync.*gl|appendSceneAsync.*gl|importMeshAsync.*gl/i],

    // --- OBJ loader ---
    ["OBJ", /OBJFileLoader|\.obj['"`]|loadAssetContainerAsync.*\.obj|appendSceneAsync.*\.obj/i],

    // --- SPLAT loader ---
    ["SPLATLoader", /SPLATFileLoader|\.splat['"`]|\.ply['"`]|\.spz['"`]/i],

    // --- Generic Loaders (SceneLoader usage not caught above) ---
    ["Loaders", /SceneLoader|loadAssetContainerAsync|appendSceneAsync|ImportMeshAsync|importMeshAsync|ImportAnimationsAsync/i],

    // --- Materials (generic / standard) ---
    ["Materials", /StandardMaterial|ShaderMaterial|MultiMaterial|FresnelParameters|MaterialHelper|BackgroundMaterial|OcclusionMaterial/i],

    // --- Library Materials (grid, water, sky etc.) ---
    [
        "LibMaterials",
        /GridMaterial|SkyMaterial|WaterMaterial|CellMaterial|FireMaterial|FurMaterial|GradientMaterial|LavaMaterial|MixMaterial|NormalMaterial|ShadowOnlyMaterial|SimpleMaterial|TerrainMaterial|TriPlanarMaterial|CustomMaterial|PBRCustomMaterial/i,
    ],

    // --- Procedural Textures ---
    [
        "ProceduralTextures",
        /ProceduralTexture|WoodProceduralTexture|GrassProceduralTexture|FireProceduralTexture|CloudProceduralTexture|RoadProceduralTexture|BrickProceduralTexture|MarbleProceduralTexture|StarfieldProceduralTexture|NoiseProceduralTexture/i,
    ],

    // --- Serializers ---
    ["Serializers", /GLTF2Export|STLExport|OBJExport|SceneSerializer|GLTFSerializer/i],

    // --- XR ---
    ["XR", /WebXRExperienceHelper|WebXRDefaultExperience|WebXR|createDefaultXRExperience/i],

    // --- Gizmos ---
    [
        "Gizmos",
        /GizmoManager|PositionGizmo|RotationGizmo|ScaleGizmo|BoundingBoxGizmo|LightGizmo|CameraGizmo|AxisDragGizmo|PlaneDragGizmo|PlaneRotationGizmo|AxisScaleGizmo|UtilityLayerRenderer/i,
    ],

    // --- Layers ---
    ["Layers", /HighlightLayer|GlowLayer|EffectLayer|Layer\b.*new/i],

    // --- Lens Flares ---
    ["LensFlares", /LensFlareSystem|LensFlare/i],

    // --- Probes ---
    ["Probes", /ReflectionProbe|MirrorTexture/i],

    // --- Flow Graph ---
    ["FlowGraph", /FlowGraph/i],

    // --- Frame Graph ---
    ["FrameGraph", /FrameGraph/i],

    // --- Compute ---
    ["Compute", /ComputeShader|StorageBuffer|ComputeEffect/i],

    // --- Navigation ---
    ["Navigation", /RecastJSPlugin|navigationPlugin|Crowd\b|ICrowd|INavMeshParameters/i],

    // --- MSDF Text ---
    ["MSDFText", /MSDFText|msdfText/i],

    // --- Audio ---
    ["Audio", /Sound\b|AudioEngine|AudioSceneComponent|music\b.*Sound|sfx\b.*Sound/i],

    // --- Behaviors ---
    [
        "Behaviors",
        /Behavior\b|PointerDragBehavior|SixDofDragBehavior|AttachToBoxBehavior|FadeInOutBehavior|MultiPointerScaleBehavior|FollowBehavior|SurfaceMagnetism|DefaultBehavior|BouncingBehavior|AutoRotationBehavior|FramingBehavior/i,
    ],

    // --- Baked Vertex Animation ---
    ["BakedVertexAnimation", /BakedVertexAnimationManager|VertexAnimationBaker/i],

    // --- Meshes (focused: instancing, vertex manipulation, specific geometry features) ---
    [
        "Meshes",
        /InstancedMesh|thinInstanceAdd|thinInstanceSetBuffer|thinInstanceCount|VertexData\.ComputeNormals|VertexData\.Merge|\.merge\(box|bakeCurrentTransformIntoVertices|convertToFlatShadedMesh|convertToUnIndexedMesh|Mesh\.MergeMeshes|EdgesRenderer|linesMesh|CreateLines|CreateDashedLines|CreateLineSystem|goldbergMesh|geodesicMesh|CreateDecal|decalMap|LODLevel|addLODLevel|simplify|overrideMaterialSideOrientation|\.isPickable|billboardMode|CreateRibbon|CreateLathe|CreatePolygon|CreateIcoSphere|CreatePolyhedron|CreateGeodesic|CreateCapsule|CreateTiledBox|CreateTiledGround|CreateTiledPlane|createInstance\(|instantiateHierarchy|\.setParent\(|\.parent\s*=|scaling\.\w\s*=\s*-|GPUPicker|CreateBoxVertexData|renderOutline|renderOverlay|outlineColor|getOutlineRenderer/i,
    ],

    // --- Shaders / Effects (custom shader code) ---
    ["Shaders", /Effect\.ShadersStore|ShadersStore|createEffect\(|ShaderStore/i],

    // --- Atmosphere ---
    ["Atmosphere", /Atmosphere|AtmosphereScattering/i],

    // --- Collisions ---
    ["Collisions", /checkCollisions|moveWithCollisions|collisionsEnabled|CollisionCoordinator/i],
];

// ---------------------------------------------------------------------------
// Title-based fallback patterns (used when snippet fetch fails or code matches nothing)
// ---------------------------------------------------------------------------
const TITLE_PATTERNS = [
    ["GaussianSplatting", /gaussian.?splat|gsplat|SOGS|SPZ\b/i],
    ["GreasedLine", /greased.?line/i],
    ["CSG", /\bCSG\b/i],
    ["PBR", /\bPBR\b|OpenPBR|iridescen|clear.?coat|sheen|subsurface|anisotrop/i],
    ["NodeMaterial", /\bNME\b|node.?material|node mat/i],
    ["Shadows", /shadow/i],
    ["Lights", /\blight|lighting|IES\b/i],
    ["Cameras", /\bcamera\b/i],
    ["GUI", /\bGUI\b|StackPanel|Slider|Checkbox|TextBlock|scroll.?viewer|input.*text|virtual.*keyboard|grid.*control|selector|radio/i],
    [
        "PostProcesses",
        /post.?process|SSAO|DOF|depth.?of.?field|motion.?blur|bloom|screen.?space|volumetric|convolution|color.?correct|fxaa|sharpen|grain|chromatic|tonemap|black.?and.?white|highlight|TAA|lens.?rendering|image.?processing/i,
    ],
    ["Particles", /particle|GPU.*Particle|solid.*particle|point.*cloud/i],
    ["Physics", /physic|havok|ammo|cannon/i],
    ["Animations", /animat|skeleton.*anim|morph.*anim|weighted.*anim/i],
    ["Bones", /bone|skeleton|IK\b/i],
    ["Morph", /morph/i],
    ["Sprites", /sprite/i],
    ["Textures", /texture|KTX2|basis|DDS|HDR|cube.*map|video.*texture|dynamic.*texture|render.*target|multi.*render/i],
    ["glTF", /\bglTF\b|GLTF|\.glb|\.gltf/i],
    ["OBJ", /\bOBJ\b.*load/i],
    ["SPLATLoader", /\.splat|\.ply|\.spz|SPZ/i],
    ["Loaders", /load|import|append.*scene/i],
    ["Materials", /material|shader/i],
    [
        "LibMaterials",
        /grid.*material|sky.*material|water.*material|cell.*material|fire.*material|fur|gradient.*material|lava|mix.*material|normal.*material|shadow.*only|terrain.*material|tri.?planar/i,
    ],
    ["ProceduralTextures", /procedural.*texture/i],
    ["Serializers", /serializ|export.*glTF|export.*OBJ|export.*STL/i],
    ["XR", /\bXR\b|WebXR|VR\b|AR\b/i],
    ["Gizmos", /gizmo/i],
    ["Layers", /highlight.*layer|glow.*layer|effect.*layer|layer.*mask/i],
    ["LensFlares", /lens.?flare/i],
    ["Probes", /reflection.*probe|mirror/i],
    ["FlowGraph", /flow.?graph/i],
    ["FrameGraph", /frame.?graph/i],
    ["Compute", /compute.*shader/i],
    ["Navigation", /navigation|recast|crowd|nav.?mesh/i],
    ["MSDFText", /MSDF/i],
    ["BakedVertexAnimation", /baked.*vertex|vertex.*animation.*bak/i],
    ["Meshes", /mesh|thin.?instance|vertex.*data|CSG|merge|decal|ribbon|extrude|lathe|polygon|ico.?sphere|polyhedron|capsule|geodesic|lattice|LOD\b|level.?of.?detail/i],
    ["Atmosphere", /atmosphere/i],
    ["Rendering", /render|depth|OIT|order.?independent|stencil|multi.?view|multi.?canvas|scissor|viewport|occlusion|pre.?pass|geometry.?buffer/i],
];

// ---------------------------------------------------------------------------
// Snippet fetching (raw HTTPS, same approach as read-snippet.js)
// ---------------------------------------------------------------------------
function parsePlaygroundId(input) {
    const cleaned = input.replace(/^#+/, "");
    const parts = cleaned.split("#");
    return { id: parts[0], version: parts[1] ?? "0" };
}

function fetchSnippetRaw(id, version) {
    return new Promise((resolve, reject) => {
        const reqPath = `/${id}/${version}`;
        const req = https.request({ hostname: "snippet.babylonjs.com", path: reqPath, method: "GET" }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode} for ${reqPath}`));
                res.resume();
                return;
            }
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Parse error for ${reqPath}`));
                }
            });
        });
        req.on("error", reject);
        req.setTimeout(15000, () => {
            req.destroy(new Error(`Timeout for ${reqPath}`));
        });
        req.end();
    });
}

function extractCodeFromResponse(resp) {
    const rawPayload = resp.jsonPayload ?? resp.payload ?? "{}";
    const payload = JSON.parse(rawPayload);
    let codeField = String(payload.code ?? "");

    if (payload.unicode) {
        codeField = Buffer.from(payload.unicode, "base64").toString("utf8");
    }

    try {
        const manifest = JSON.parse(codeField);
        if (manifest.v === 2 && manifest.files && manifest.entry) {
            // Concatenate all files for comprehensive API analysis
            return Object.values(manifest.files).join("\n");
        }
    } catch {
        // Not a v2 manifest
    }

    return codeField;
}

// ---------------------------------------------------------------------------
// Tag inference
// ---------------------------------------------------------------------------
function inferTagsFromCode(code) {
    const tags = new Set();
    for (const [tag, pattern] of CODE_PATTERNS) {
        if (pattern.test(code)) {
            tags.add(tag);
        }
    }
    return tags;
}

function inferTagsFromTitle(title) {
    const tags = new Set();
    for (const [tag, pattern] of TITLE_PATTERNS) {
        if (pattern.test(title)) {
            tags.add(tag);
        }
    }
    return tags;
}

// ---------------------------------------------------------------------------
// Concurrency-limited runner
// ---------------------------------------------------------------------------
async function mapWithConcurrency(items, fn, limit) {
    const results = new Array(items.length);
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const i = index++;
            results[i] = await fn(items[i], i);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const configRaw = fs.readFileSync(CONFIG_PATH, "utf8");
    const hasBOM = configRaw.startsWith("\uFEFF");
    const hasCRLF = configRaw.includes("\r\n");
    const config = JSON.parse(configRaw.replace(/^\uFEFF/, ""));
    const tagMap = JSON.parse(fs.readFileSync(TAGMAP_PATH, "utf8"));
    const validTags = new Set(tagMap.tags);

    const tests = config.tests;
    let codeTagged = 0;
    let titleFallback = 0;
    let untagged = 0;
    let fetchFailed = 0;

    console.log(`Processing ${tests.length} tests with concurrency ${CONCURRENCY}...\n`);

    await mapWithConcurrency(
        tests,
        async (test, i) => {
            const tags = new Set();
            let source = "none";

            if (test.playgroundId) {
                try {
                    const { id, version } = parsePlaygroundId(test.playgroundId);
                    const resp = await fetchSnippetRaw(id, version);
                    const code = extractCodeFromResponse(resp);

                    if (code && code.trim().length > 0) {
                        const codeTags = inferTagsFromCode(code);
                        for (const t of codeTags) tags.add(t);
                        if (tags.size > 0) source = "code";
                    }
                } catch (err) {
                    fetchFailed++;
                    if (i < 10 || fetchFailed <= 5) {
                        console.warn(`  [WARN] Fetch failed for "${test.title}" (${test.playgroundId}): ${err.message}`);
                    }
                }
            }

            // Fallback to title if code analysis found nothing
            if (tags.size === 0) {
                const titleTags = inferTagsFromTitle(test.title);
                for (const t of titleTags) tags.add(t);
                if (tags.size > 0) source = "title";
            }

            // Validate tags
            const validatedTags = [...tags].filter((t) => validTags.has(t)).sort();

            if (validatedTags.length > 0) {
                test.dependsOn = validatedTags;
                if (source === "code") codeTagged++;
                else titleFallback++;
            } else {
                delete test.dependsOn;
                untagged++;
            }

            // Progress indicator
            if ((i + 1) % 50 === 0 || i + 1 === tests.length) {
                process.stderr.write(`  Processed ${i + 1}/${tests.length}\r`);
            }
        },
        CONCURRENCY
    );

    console.log("\n");
    console.log("=== Summary ===");
    console.log(`Total tests:           ${tests.length}`);
    console.log(`Tagged via code:       ${codeTagged}`);
    console.log(`Tagged via title:      ${titleFallback}`);
    console.log(`Untagged (always run): ${untagged}`);
    console.log(`Fetch failures:        ${fetchFailed}`);

    // Print tag distribution
    const tagCounts = {};
    for (const test of tests) {
        if (test.dependsOn) {
            for (const tag of test.dependsOn) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
    }
    console.log("\n=== Tag Distribution ===");
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    for (const [tag, count] of sorted) {
        console.log(`  ${tag.padEnd(25)} ${count}`);
    }

    // Print untagged tests
    const untaggedTests = tests.filter((t) => !t.dependsOn || t.dependsOn.length === 0);
    if (untaggedTests.length > 0) {
        console.log(`\n=== Untagged Tests (${untaggedTests.length}) ===`);
        for (const t of untaggedTests) {
            console.log(`  - "${t.title}" (${t.playgroundId || "no playground"})`);
        }
    }

    if (!DRY_RUN) {
        let output = JSON.stringify(config, null, 4) + "\n";
        if (hasCRLF) output = output.replace(/\n/g, "\r\n");
        if (hasBOM) output = "\uFEFF" + output;
        fs.writeFileSync(CONFIG_PATH, output, "utf8");
        console.log(`\nWrote updated config.json (${output.length} bytes)`);
    } else {
        console.log("\n[DRY RUN] No files written.");
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
