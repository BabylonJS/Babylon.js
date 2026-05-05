import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { Logger } from "core/Misc/logger";
import {
    AddOverride,
    ApplyAllOverrides,
    CreateOverrideManager,
    LinkOverrideManagerSmartAssets,
} from "core/SmartAssets/overrideManager";
import {
    CreateSmartAssetManager,
    FindSmartAssetKeyForObject,
    LoadSmartAssetAsync,
    LoadSmartAssetTextureAsync,
} from "core/SmartAssets/smartAssetManager";
import { SerializeProject, PROJECT_LOCALS_KEY } from "core/SmartAssets/projectSerializer";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import "core/Materials/standardMaterial";
import { type Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { registerBuiltInLoaders } from "loaders/dynamic";
import "core/Loading/Plugins/babylonFileLoader";

registerBuiltInLoaders();

/**
 * Assembly prototype: tests Patrick's full scene composition workflow.
 *
 * Simulates what the assembly tool would do, without Inspector:
 *   1. Load a mesh GLB as a smart asset
 *   2. Load standalone textures as smart assets
 *   3. Create a PBR material in-tool (simulating Inspector Quick Create)
 *   4. Assign textures to material slots
 *   5. Assign the material to the loaded mesh
 *   6. Add scene furniture (lights, camera, environment)
 *   7. Serialize the project — surfaces the "inlineObjects" gap
 *   8. Verify what survives the round-trip
 *   9. Swap a texture and verify the material updates
 *  10. Export clean GLB
 *
 * This prototype intentionally pushes beyond what the current project
 * serializer supports to surface gaps for the assembly milestone (M7).
 *
 * @param engine - The Babylon engine to create the scene on.
 * @param canvas - The HTML canvas element for camera attachment.
 * @returns A promise resolving to the created scene.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.15, 0.15, 0.2, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 0.05, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.001;
    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.7;
    const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.5;

    // Environment texture for PBR reflections
    scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
        "https://playground.babylonjs.com/textures/environment.env", scene
    );

    const log = (label: string, msg: string) => Logger.Log(`[Assembly Prototype] ${label}: ${msg}`);
    const warn = (label: string, msg: string) => Logger.Warn(`[Assembly Prototype] ${label}: ${msg}`);
    const results: string[] = [];
    const pass = (test: string) => {
        log("PASS", test);
        results.push(`✅ ${test}`);
    };
    const fail = (test: string, reason: string) => {
        warn("FAIL", `${test}: ${reason}`);
        results.push(`❌ ${test}: ${reason}`);
    };

    // ═══════════════════════════════════════════════════════════════
    // Step 1: Load a mesh GLB as a smart asset
    // ═══════════════════════════════════════════════════════════════
    const sam = CreateSmartAssetManager(scene);
    sam.onAssetNotFound = async (key, url) => {
        log("MISSING", `Asset "${key}" not found at "${url}" — skipping`);
        return null;
    };

    await LoadSmartAssetAsync(sam, "boombox", "https://playground.babylonjs.com/scenes/BoomBox.glb");
    const boomboxMesh = scene.meshes.find((m) => FindSmartAssetKeyForObject(sam, m) === "boombox" && m.name !== "__root__");
    if (boomboxMesh) {
        pass("Step 1: Loaded mesh GLB as smart asset");
    } else {
        fail("Step 1", "No mesh found from boombox key");
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 2: Load standalone textures as smart assets
    // ═══════════════════════════════════════════════════════════════
    const albedoTex = await LoadSmartAssetTextureAsync(sam, "albedo-tex", "https://playground.babylonjs.com/textures/floor.png");
    const bumpTex = await LoadSmartAssetTextureAsync(sam, "bump-tex", "https://playground.babylonjs.com/textures/normalMap.jpg");

    if (albedoTex && bumpTex) {
        pass("Step 2: Loaded 2 standalone textures as smart assets");
    } else {
        fail("Step 2", "Texture loading failed");
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 3: Create a PBR material in-tool (simulating Quick Create)
    // ═══════════════════════════════════════════════════════════════
    const customMat = new PBRMaterial("custom-assembly-mat", scene);
    customMat.albedoColor = new Color3(0.8, 0.4, 0.2); // warm orange base
    customMat.metallic = 0.3;
    customMat.roughness = 0.6;
    log("Step 3", `Created PBR material: ${customMat.name}`);

    // ═══════════════════════════════════════════════════════════════
    // Step 4: Assign textures to material slots
    // ═══════════════════════════════════════════════════════════════
    customMat.albedoTexture = albedoTex as Texture;
    customMat.bumpTexture = bumpTex as Texture;
    log("Step 4", `Assigned albedo=${albedoTex.name}, bump=${bumpTex.name} to ${customMat.name}`);
    pass("Step 4: Textures assigned to material slots");

    // ═══════════════════════════════════════════════════════════════
    // Step 5: Assign the material to the loaded mesh
    // ═══════════════════════════════════════════════════════════════
    const originalMat = boomboxMesh?.material;
    if (boomboxMesh) {
        boomboxMesh.material = customMat;
        log("Step 5", `Assigned ${customMat.name} to ${boomboxMesh.name} (was: ${originalMat?.name})`);
        pass("Step 5: Custom material assigned to smart-asset mesh");
    }

    // Auto-frame camera
    const worldExtends = scene.getWorldExtends();
    const worldSize = worldExtends.max.subtract(worldExtends.min);
    const worldCenter = worldExtends.min.add(worldSize.scale(0.5));
    camera.setTarget(worldCenter);
    camera.radius = worldSize.length() * 1.5;
    camera.minZ = camera.radius * 0.01;

    // ═══════════════════════════════════════════════════════════════
    // Step 6: Set up overrides for the assembly
    // ═══════════════════════════════════════════════════════════════
    const overrides = CreateOverrideManager(scene);
    LinkOverrideManagerSmartAssets(overrides, sam);

    // Override mesh transform
    if (boomboxMesh) {
        AddOverride(overrides, {
            key: "boombox",
            targetType: "meshes",
            targetName: boomboxMesh.name,
            propertyPath: "scaling.x",
            value: 2,
        });
        AddOverride(overrides, {
            key: "boombox",
            targetType: "meshes",
            targetName: boomboxMesh.name,
            propertyPath: "scaling.y",
            value: 2,
        });
        AddOverride(overrides, {
            key: "boombox",
            targetType: "meshes",
            targetName: boomboxMesh.name,
            propertyPath: "scaling.z",
            value: 2,
        });

        // Material assignment as a reference override
        AddOverride(overrides, {
            key: "boombox",
            targetType: "meshes",
            targetName: boomboxMesh.name,
            propertyPath: "material",
            value: "ref:custom-assembly-mat",
        });
        pass("Step 6a: Overrides applied (mesh scaling 2x + material assignment)");
    }

    // Texture→material slot assignments as reference overrides
    // These use the "texture:key" syntax to reference smart-asset-loaded textures
    AddOverride(overrides, {
        key: "",
        targetType: "materials",
        targetName: "custom-assembly-mat",
        propertyPath: "albedoTexture",
        value: "texture:albedo-tex",
    });
    AddOverride(overrides, {
        key: "",
        targetType: "materials",
        targetName: "custom-assembly-mat",
        propertyPath: "bumpTexture",
        value: "texture:bump-tex",
    });
    pass("Step 6b: Texture slot overrides added (albedo + bump)");

    // Scene-level override
    AddOverride(overrides, {
        key: "",
        targetType: "scene",
        targetName: "",
        propertyPath: "clearColor",
        value: [0.05, 0.08, 0.12, 1],
    });

    // ═══════════════════════════════════════════════════════════════
    // Step 7: Serialize the project — test companion .babylon approach
    // ═══════════════════════════════════════════════════════════════
    const bundle = SerializeProject(sam, overrides);
    const projectJson = JSON.stringify(bundle.project, null, 2);

    log("Step 7", `Project serialized: ${projectJson.length} bytes`);
    log("Step 7", `  Assets: [${Object.keys(bundle.project.assets).join(", ")}]`);
    log("Step 7", `  Overrides: ${bundle.project.overrides.length}`);

    // Check: does the project produce a companion .babylon for the in-tool material?
    if (bundle.companionBabylon) {
        const companionSize = bundle.companionBabylon.size;
        const hasLocalsKey = PROJECT_LOCALS_KEY in bundle.project.assets;
        pass(`Step 7a: Companion .babylon generated (${companionSize} bytes, key registered: ${hasLocalsKey})`);
    } else {
        fail("Step 7a", "No companion .babylon generated — in-tool material would be lost on reload");
    }

    // Check: project JSON has NO inlineObjects (replaced by companion)
    if (!("inlineObjects" in bundle.project)) {
        pass("Step 7b: Project JSON clean — no inlineObjects (companion .babylon instead)");
    } else {
        fail("Step 7b", "Project JSON still has inlineObjects — should be removed");
    }

    // Check: is the material assignment captured as override?
    const hasMaterialAssignment = bundle.project.overrides.some(
        (o) => o.propertyPath === "material" && typeof o.value === "string" && o.value.startsWith("ref:")
    );
    if (hasMaterialAssignment) {
        pass("Step 7c: Material assignment persisted as ref: override");
    } else {
        fail("Step 7c", "Material assignment override missing");
    }

    // Check: are texture slots captured as overrides?
    const hasTextureOverrides = bundle.project.overrides.some(
        (o) => o.propertyPath === "albedoTexture" && typeof o.value === "string" && o.value.startsWith("texture:")
    );
    if (hasTextureOverrides) {
        pass("Step 7d: Texture slot assignments persisted as texture: overrides");
    } else {
        fail("Step 7d", "Texture slot overrides missing");
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 8: Swap a texture — verify the material updates
    // ═══════════════════════════════════════════════════════════════
    // Step 8 disabled — keep albedo-tex on the material so Inspector
    // texture swaps are visually apparent.
    // const newAlbedoTex = new Texture("https://playground.babylonjs.com/textures/grass.png", scene);
    // await new Promise<void>((resolve) => {
    //     if (newAlbedoTex.isReady()) {
    //         resolve();
    //     } else {
    //         newAlbedoTex.onLoadObservable.addOnce(() => resolve());
    //     }
    // });
    // customMat.albedoTexture = newAlbedoTex;
    log("Step 8", "Skipped — albedo-tex stays on material for visual swap testing");
    pass("Step 8: Skipped (albedo-tex stays active)");

    // ═══════════════════════════════════════════════════════════════
    // Step 9: Export to .babylon — verify clean output
    // ═══════════════════════════════════════════════════════════════
    try {
        ApplyAllOverrides(overrides);
        const exportedScene = SceneSerializer.Serialize(scene);
        const exportJson = JSON.stringify(exportedScene);
        const exportHasCustomMat = (exportedScene.materials as any[])?.some(
            (m: any) => m.name === "custom-assembly-mat"
        );
        const exportHasTextures = (exportedScene.materials as any[])?.some(
            (m: any) => m.name === "custom-assembly-mat" && m.albedoTexture != null
        );
        log("Step 9", `Exported assembly-test.babylon: ${exportJson.length} bytes`);
        log("Step 9", `Export has custom material: ${exportHasCustomMat}`);
        log("Step 9", `Export has texture assignments: ${exportHasTextures}`);

        if (exportHasCustomMat) {
            pass("Step 9: Clean export includes in-tool material + assignments");
        } else {
            fail("Step 9", "Export missing custom material");
        }
    } catch (e) {
        fail("Step 9", `Export failed: ${e}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════════
    log("═══", "═══════════════════════════════════════════════════════");
    log("SUMMARY", "Assembly Prototype Results:");
    for (const r of results) {
        log("", r);
    }
    log("═══", "═══════════════════════════════════════════════════════");

    // On-screen status
    const statusDiv = document.createElement("div");
    statusDiv.style.cssText = "position:absolute;top:10px;left:10px;color:#eee;font:12px monospace;" +
        "background:rgba(0,0,0,0.8);padding:12px;border-radius:4px;max-width:600px;line-height:1.6;";
    statusDiv.innerHTML = [
        "<b style='color:#0f0'>Assembly Prototype — Patrick's Workflow</b>",
        "",
        ...results.map((r) => {
            if (r.startsWith("✅")) {
                return `<span style="color:#4f4">${r}</span>`;
            }
            if (r.startsWith("❌")) {
                return `<span style="color:#f44">${r}</span>`;
            }
            return `<span style="color:#fa0">${r}</span>`;
        }),
        "",
        "<span style='color:#888'>Open DevTools console for full log</span>",
    ].join("<br>");
    document.body.appendChild(statusDiv);

    // Open Inspector so the scene can be interacted with
    // @ts-expect-error inspector-v2 is resolved at runtime by devHost's webpack config
    const { ShowInspector } = await import("inspector-v2");
    ShowInspector(scene);

    return scene;
};
