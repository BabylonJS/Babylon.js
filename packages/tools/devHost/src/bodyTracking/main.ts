/* eslint-disable no-console */
/**
 * Minimal WebXR body-tracking scene for testing on real headsets.
 *
 * Loads a rigged Mixamo character, enables the core WebXRBodyTracking feature
 * with `isMixamoModel: true`, and places the model ~1 unit in front of the
 * XR camera's initial position.
 *
 * Query params:
 *   - `model=<url>`             glTF URL to load (default: HVGirl from assets).
 *   - usebonedoffsets=false   Disable the bone-orientation offset correction.
 *   - preservebones=true      Keep bind-pose bone lengths (retarget rotations only).
 *   - scale=<num>             Extra uniform scale applied to the mesh root.
 *   - `jointaxis=<preset|axisDeg>`  Re-base XR joint axes before retargeting.
 *                                 Presets: zy|yz|xy|yx|xz|zx. Axis+deg: x-90, y45, z180.
 *                                 Use `zy` if "all limbs laid flat forward" (Z-along-bone → Y-along-bone).
 *   - snapshot=1              Replay captured Quest-3 joint matrices (no headset needed).
 *   - snapshotlhs=1           Use pre-flipped LHS matrices from the snapshot (skips RHS→LHS).
 *
 * Runtime (console): `setJointAxis("zy")`, `setJointAxis(null)` to reset.
 */

import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras/freeCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Vector3, Quaternion } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { SceneLoader } from "core/Loading/sceneLoader";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { WebXRDefaultExperience } from "core/XR/webXRDefaultExperience";
import { WebXRFeatureName } from "core/XR/webXRFeaturesManager";
// Importing this module also registers the "xr-body-tracking" feature on the WebXRFeaturesManager as a side effect.
import { type IWebXRBodyTrackingOptions, type WebXRBodyTracking, WebXRTrackedBody, _ResolveMixamoRigMapping, MixamoAimChildOverrides } from "core/XR/features/WebXRBodyTracking";

import "loaders/glTF/2.0/glTFLoader";

import { SnapshotData } from "./snapshotData";

const DefaultModelUrl = "https://assets.babylonjs.com/meshes/HVGirl.glb";

/**
 * Entry point for the body-tracking dev-host experience.
 * @param searchParams URL query parameters controlling the scene (see file header for flags).
 */
export async function Main(searchParams: URLSearchParams): Promise<void> {
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    canvas.id = "babylon-canvas";
    mainDiv.appendChild(canvas);

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, xrCompatible: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.12, 0.12, 0.14, 1);

    const camera = new FreeCamera("cam", new Vector3(0, 1.6, -3), scene);
    camera.setTarget(new Vector3(0, 1, 1));
    camera.attachControl(canvas, true);
    camera.minZ = 0.01;

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    const dir = new DirectionalLight("dir", new Vector3(-0.4, -1, -0.6), scene);
    dir.intensity = 0.6;

    const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    const groundMat = new StandardMaterial("gmat", scene);
    groundMat.diffuseColor = new Color3(0.2, 0.25, 0.3);
    ground.material = groundMat;

    const info = document.createElement("div");
    info.style.cssText =
        "position:absolute;top:10px;left:10px;color:#ddd;font:12px monospace;" +
        "background:rgba(0,0,0,0.64);padding:8px;border-radius:4px;max-width:70%;z-index:100;white-space:pre-wrap;";
    mainDiv.appendChild(info);
    const log = (msg: string): void => {
        info.textContent = msg;
        console.log(msg);
    };

    const modelUrl = searchParams.get("model") ?? DefaultModelUrl;
    log(`Loading model:\n${modelUrl}`);

    const slash = modelUrl.lastIndexOf("/");
    const rootUrl = slash >= 0 ? modelUrl.substring(0, slash + 1) : "";
    const fileName = slash >= 0 ? modelUrl.substring(slash + 1) : modelUrl;
    const loaded = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, scene);

    const modelRoot: AbstractMesh = loaded.meshes[0];
    const rigged = loaded.meshes.find((m) => m.skeleton) ?? loaded.meshes[0];
    log(`Loaded ${loaded.meshes.length} meshes. Skinned: ${rigged.name}`);

    // Stop any auto-playing animations — body tracking will own the skeleton.
    for (const ag of scene.animationGroups) {
        ag.stop();
    }

    // Auto-normalize character height using skeleton bone world positions
    // (the skinned mesh bounds returned by the AbstractMesh API don't reflect
    // bone-driven deformation, so we measure Head-to-foot via the skeleton).
    const skeleton = rigged.skeleton ?? loaded.skeletons[0];
    const findBone = (names: string[]) => {
        if (!skeleton) {
            return null;
        }
        for (const n of names) {
            const idx = skeleton.getBoneIndexByName(n);
            if (idx >= 0) {
                return skeleton.bones[idx];
            }
        }
        // Fallback: substring match.
        for (const b of skeleton.bones) {
            const lower = b.name.toLowerCase();
            if (names.some((n) => lower.endsWith(n.toLowerCase()))) {
                return b;
            }
        }
        return null;
    };
    const headBone = findBone(["mixamorig:Head", "Head"]);
    const footBone = findBone(["mixamorig:LeftFoot", "LeftFoot", "mixamorig:LeftToeBase", "LeftToeBase"]);

    const scaleParam = searchParams.get("scale");
    if (scaleParam !== null) {
        const s = parseFloat(scaleParam);
        if (s > 0) {
            modelRoot.scaling.scaleInPlace(s);
        }
    } else if (headBone && footBone) {
        // Force world-matrix refresh so bone absolute positions are current.
        scene.render();
        const headY = headBone.getAbsolutePosition(rigged).y;
        const footY = footBone.getAbsolutePosition(rigged).y;
        const currentHeight = headY - footY;
        if (currentHeight > 0.001) {
            const targetHeight = 1.7;
            const s = targetHeight / currentHeight;
            modelRoot.scaling.scaleInPlace(s);
        }
    }

    // Snap the feet to the ground and place the character 1 m in front of the
    // user. Measure the foot position AFTER scaling.
    scene.render();
    const footYAfter = footBone ? footBone.getAbsolutePosition(rigged).y : 0;
    modelRoot.position.copyFromFloats(0, -footYAfter, 1);

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        floorMeshes: [ground],
        optionalFeatures: true,
    });

    const preservePoseBones = searchParams.get("preservebones") === "true";
    const useBoneOffsets = searchParams.get("usebonedoffsets") !== "false";
    const useSnapshot = searchParams.get("snapshot") === "1" || searchParams.get("snapshot") === "true";

    // Parse joint-axis re-basing from URL.
    //   ?jointaxis=zy     → rotate -90° around X  (Z-along-bone → Y-along-bone)
    //   ?jointaxis=xy     → rotate +90° around Z  (X-along-bone → Y-along-bone)
    //   ?jointaxis=x-90   → rotate -90° around X
    //   ?jointaxis=y45    → rotate +45° around Y
    //   (omit to disable)
    const jointAxisParam = searchParams.get("jointaxis");
    const parseJointAxis = (raw: string | null): Quaternion | undefined => {
        if (!raw) {
            return undefined;
        }
        const presets: Record<string, [Vector3, number]> = {
            zy: [Vector3.Right(), -Math.PI / 2],
            yz: [Vector3.Right(), Math.PI / 2],
            xy: [Vector3.Forward(), Math.PI / 2],
            yx: [Vector3.Forward(), -Math.PI / 2],
            xz: [Vector3.Up(), Math.PI / 2],
            zx: [Vector3.Up(), -Math.PI / 2],
        };
        const key = raw.toLowerCase();
        if (presets[key]) {
            const [axis, angle] = presets[key];
            return Quaternion.RotationAxis(axis, angle);
        }
        // Axis + degrees form, e.g. "x-90", "y45".
        const m = /^([xyz])(-?\d+(?:\.\d+)?)$/.exec(key);
        if (m) {
            const axisMap: Record<string, Vector3> = { x: Vector3.Right(), y: Vector3.Up(), z: Vector3.Forward() };
            return Quaternion.RotationAxis(axisMap[m[1]], (parseFloat(m[2]) * Math.PI) / 180);
        }
        return undefined;
    };
    const initialJointOffset = parseJointAxis(jointAxisParam);

    const bodyTrackingOpts: IWebXRBodyTrackingOptions = {
        bodyMesh: rigged,
        isMixamoModel: true,
        useBoneOrientationOffsets: useBoneOffsets,
        preserveBindPoseBonePositions: preservePoseBones,
        jointLocalRotationOffset: initialJointOffset,
    };

    let bodyTracking: WebXRBodyTracking | undefined;
    let standaloneTrackedBody: WebXRTrackedBody | undefined;

    if (useSnapshot) {
        // Snapshot-replay mode: bypass the XR session entirely and drive the
        // retargeting pipeline directly from captured Quest-3 joint matrices.
        // This lets us A/B against the live session — same feature code, same
        // avatar, same rig; only the data source differs.
        const rigMapping = _ResolveMixamoRigMapping(rigged);
        standaloneTrackedBody = new WebXRTrackedBody(scene, rigged, rigMapping, 1.0, false, preservePoseBones, useBoneOffsets, MixamoAimChildOverrides, initialJointOffset);
        const snapshotIsLhs = searchParams.get("snapshotlhs") === "1";
        const src: Float32Array | number[] = snapshotIsLhs ? SnapshotData.jointMatricesLHS : SnapshotData.jointMatricesRHS;
        // Re-apply every frame so live knob changes are visible.
        scene.onBeforeRenderObservable.add(() => {
            standaloneTrackedBody!.replayRawJointMatrices(src, snapshotIsLhs);
        });
        log(
            `Snapshot-replay mode.\n` +
                `Model: ${modelUrl}\n` +
                `useBoneOrientationOffsets: ${useBoneOffsets}\n` +
                `preserveBindPoseBonePositions: ${preservePoseBones}\n` +
                `jointLocalRotationOffset: ${jointAxisParam ?? "(identity)"}\n` +
                `snapshot source: ${snapshotIsLhs ? "LHS" : "RHS"} (toggle with ?snapshotlhs=1)\n\n` +
                `No headset needed — the captured pose is applied every frame.`
        );
    } else {
        try {
            bodyTracking = xr.baseExperience.featuresManager.enableFeature(WebXRFeatureName.BODY_TRACKING, "latest", bodyTrackingOpts, true, false) as WebXRBodyTracking;
            log(
                `WebXR body tracking enabled.\n` +
                    `Model: ${modelUrl}\n` +
                    `useBoneOrientationOffsets: ${useBoneOffsets}\n` +
                    `preserveBindPoseBonePositions: ${preservePoseBones}\n` +
                    `jointLocalRotationOffset: ${jointAxisParam ?? "(identity)"}\n\n` +
                    `Put on your headset and press "Enter VR".\n` +
                    `Live-tweak axis from console: setJointAxis("zy") / setJointAxis("x-90") / setJointAxis(null)`
            );
        } catch (e) {
            log(`Failed to enable WebXR body tracking: ${e}`);
        }

        if (bodyTracking) {
            bodyTracking.onBodyTrackingStartedObservable.add(() => log("Body tracking started."));
            bodyTracking.onBodyTrackingEndedObservable.add(() => log("Body tracking ended."));
        }
    }

    // Live knob for iterating on-headset from browser devtools.
    const setJointAxis = (raw: string | null): string => {
        const q = parseJointAxis(raw);
        const tb = bodyTracking?.trackedBody ?? standaloneTrackedBody;
        if (tb) {
            tb.jointLocalRotationOffset = q ?? null;
        }
        return `jointLocalRotationOffset = ${q ? `(${q.x.toFixed(3)}, ${q.y.toFixed(3)}, ${q.z.toFixed(3)}, ${q.w.toFixed(3)})` : "identity"}`;
    };

    (window as any).bodyTrackingDebug = { scene, engine, camera, xr, bodyTracking, standaloneTrackedBody, modelRoot, rigged, setJointAxis };
    (window as any).setJointAxis = setJointAxis;

    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}
