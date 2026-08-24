import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { type WebGPUEngine } from "core/Engines/webgpuEngine";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { WebXRDefaultExperience } from "core/XR/webXRDefaultExperience";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRState } from "core/XR/webXRTypes";

function GetStateName(state: WebXRState): string {
    switch (state) {
        case WebXRState.ENTERING_XR:
            return "ENTERING_XR";
        case WebXRState.EXITING_XR:
            return "EXITING_XR";
        case WebXRState.IN_XR:
            return "IN_XR";
        case WebXRState.NOT_IN_XR:
            return "NOT_IN_XR";
    }
}

/**
 * Creates the opt-in WebGPU-XR device-validation scene.
 * @param engine XR-compatible WebGPU engine
 * @param canvas rendering canvas
 * @returns configured scene
 */
export async function CreateWebGPUXRSceneAsync(engine: WebGPUEngine, canvas: HTMLCanvasElement): Promise<Scene> {
    const scene = new Scene(engine);
    scene.clearColor.set(0.03, 0.05, 0.08, 1);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 7, new Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const ground = MeshBuilder.CreateGround("ground", { width: 8, height: 8 }, scene);
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.12, 0.18, 0.24);
    ground.material = groundMaterial;

    const centerBox = MeshBuilder.CreateBox("centerBox", { size: 0.6 }, scene);
    centerBox.position.set(0, 1.2, 1.5);
    const centerMaterial = new StandardMaterial("centerMaterial", scene);
    centerMaterial.diffuseColor = new Color3(0.1, 0.8, 0.65);
    centerBox.material = centerMaterial;

    for (let x = -2; x <= 2; x += 2) {
        const marker = MeshBuilder.CreateSphere(`marker${x}`, { diameter: 0.45 }, scene);
        marker.position.set(x, 1, 2.5);
        const markerMaterial = new StandardMaterial(`markerMaterial${x}`, scene);
        markerMaterial.diffuseColor = x < 0 ? new Color3(0.9, 0.2, 0.25) : x > 0 ? new Color3(0.2, 0.45, 0.95) : new Color3(0.95, 0.75, 0.15);
        marker.material = markerMaterial;
    }

    scene.onBeforeRenderObservable.add(() => {
        centerBox.rotation.y += 0.01;
    });

    const statusPanel = document.createElement("div");
    statusPanel.style.cssText =
        "position:absolute;top:12px;left:12px;z-index:10;max-width:520px;padding:12px;background:#111c;color:#fff;font:14px/1.4 monospace;white-space:pre-wrap";
    const statusText = document.createElement("div");
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Enter immersive VR";
    toggleButton.style.marginTop = "8px";
    statusPanel.append(statusText, toggleButton);
    canvas.parentElement?.appendChild(statusPanel);
    scene.onDisposeObservable.addOnce(() => statusPanel.remove());

    const capabilitySupported = WebXRSessionManager.IsWebGPUXRSupported;
    let state = WebXRState.NOT_IN_XR;
    let lastError = "";
    const renderStatus = () => {
        statusText.textContent = [
            "WebGPU-XR testScene",
            `Engine: ${engine.name}`,
            `XRGPUBinding projection path: ${capabilitySupported ? "available" : "unavailable"}`,
            `State: ${GetStateName(state)}`,
            lastError ? `Last error: ${lastError}` : "Last error: none",
            "",
            "Quest checklist: stereo geometry, controller appearance, exit, and re-entry.",
        ].join("\n");
        toggleButton.textContent = state === WebXRState.IN_XR ? "Exit immersive VR" : "Enter immersive VR";
        toggleButton.disabled = state === WebXRState.ENTERING_XR || state === WebXRState.EXITING_XR;
    };
    renderStatus();

    const xr = await WebXRDefaultExperience.CreateAsync(scene, {
        disableDefaultUI: true,
        floorMeshes: [ground],
    });
    if (!xr.baseExperience) {
        lastError = "WebXR is not available in this browser.";
        renderStatus();
        toggleButton.setAttribute("disabled", "true");
        return scene;
    }

    if (capabilitySupported) {
        xr.baseExperience.featuresManager.enableFeature(WebXRLayers.Name, "latest", {}, true, true);
    }
    xr.baseExperience.onStateChangedObservable.add((newState) => {
        state = newState;
        renderStatus();
    });

    const toggleXRAsync = async () => {
        lastError = "";
        renderStatus();
        try {
            if (state === WebXRState.IN_XR) {
                await xr.baseExperience.exitXRAsync();
            } else {
                await xr.baseExperience.enterXRAsync("immersive-vr", "local-floor", xr.renderTarget);
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            renderStatus();
        }
    };
    toggleButton.addEventListener("click", () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        toggleXRAsync();
    });

    return scene;
}
