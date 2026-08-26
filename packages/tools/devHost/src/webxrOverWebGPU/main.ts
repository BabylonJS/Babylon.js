import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { WebXRLayers } from "core/XR/features/WebXRLayers";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Scene } from "core/scene";
import { WebXRExperienceHelper } from "core/XR/webXRExperienceHelper";
import { WebXRInput } from "core/XR/webXRInput";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { WebXRState } from "core/XR/webXRTypes";

interface IStatusPanel {
    root: HTMLDivElement;
    text: HTMLDivElement;
    toggleButton: HTMLButtonElement;
}

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

function CreateStatusPanel(container: HTMLElement): IStatusPanel {
    const root = document.createElement("div");
    root.style.cssText = "position:absolute;top:12px;left:12px;z-index:10;max-width:520px;padding:12px;background:#111c;color:#fff;font:14px/1.4 monospace;white-space:pre-wrap";
    const text = document.createElement("div");
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Enter immersive VR";
    toggleButton.style.marginTop = "8px";
    toggleButton.disabled = true;
    root.append(text, toggleButton);
    container.appendChild(root);
    return { root, text, toggleButton };
}

async function CreateSceneAsync(engine: WebGPUEngine, canvas: HTMLCanvasElement, statusPanel: IStatusPanel): Promise<Scene> {
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

    scene.onDisposeObservable.addOnce(() => statusPanel.root.remove());

    const capabilitySupported = WebXRSessionManager.IsWebGPUXRSupported;
    let state = WebXRState.NOT_IN_XR;
    let lastError = "";
    const renderStatus = () => {
        statusPanel.text.textContent = [
            "WebXR over WebGPU",
            `Engine: ${engine.name}`,
            `XRGPUBinding projection path: ${capabilitySupported ? "available" : "unavailable"}`,
            `State: ${GetStateName(state)}`,
            lastError ? `Last error: ${lastError}` : "Last error: none",
            "",
            "Headset checklist: stereo geometry, controller appearance, exit, and re-entry.",
        ].join("\n");
        statusPanel.toggleButton.textContent = state === WebXRState.IN_XR ? "Exit immersive VR" : "Enter immersive VR";
        statusPanel.toggleButton.disabled = state === WebXRState.ENTERING_XR || state === WebXRState.EXITING_XR;
    };
    renderStatus();

    let xr: WebXRExperienceHelper;
    try {
        xr = await WebXRExperienceHelper.CreateAsync(scene);
    } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        renderStatus();
        statusPanel.toggleButton.disabled = true;
        return scene;
    }

    const xrInput = new WebXRInput(xr.sessionManager, xr.camera);
    const renderTarget = xr.sessionManager.getWebXRRenderTarget();
    scene.onDisposeObservable.addOnce(() => {
        xrInput.dispose();
        renderTarget.dispose();
    });

    if (capabilitySupported) {
        xr.featuresManager.enableFeature(WebXRLayers.Name, "latest", {}, true, true);
    }
    xr.onStateChangedObservable.add((newState) => {
        state = newState;
        renderStatus();
    });

    const toggleXRAsync = async () => {
        lastError = "";
        renderStatus();
        try {
            if (state === WebXRState.IN_XR) {
                await xr.exitXRAsync();
            } else {
                await xr.enterXRAsync("immersive-vr", "local-floor", renderTarget);
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            renderStatus();
        }
    };
    statusPanel.toggleButton.addEventListener("click", () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        toggleXRAsync();
    });

    return scene;
}

/**
 * Entry point for the dedicated WebXR-over-WebGPU devhost experience.
 * @param _searchParams URL query parameters reserved for future example options
 */
export async function Main(_searchParams: URLSearchParams): Promise<void> {
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    canvas.id = "babylon-canvas";
    mainDiv.appendChild(canvas);
    const statusPanel = CreateStatusPanel(mainDiv);
    statusPanel.text.textContent = "WebXR over WebGPU\nEngine: initializing";

    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
    if (!webGPUSupported) {
        statusPanel.text.textContent = "WebXR over WebGPU\nEngine: unavailable\nLast error: WebGPU is not supported by this browser.";
        return;
    }

    const engine = new WebGPUEngine(canvas, { xrCompatible: true });
    try {
        await engine.initAsync();
    } catch (error) {
        statusPanel.text.textContent = `WebXR over WebGPU\nEngine: initialization failed\nLast error: ${error instanceof Error ? error.message : String(error)}`;
        engine.dispose();
        return;
    }
    const scene = await CreateSceneAsync(engine, canvas, statusPanel);
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}
