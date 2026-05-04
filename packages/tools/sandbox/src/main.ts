/**
 * Vite entry point for the Babylon.js Sandbox.
 *
 * Dev mode: imports directly and calls Sandbox.Show immediately.
 * Production: the CDN bootstrap (public/index.js) loads Babylon from CDN,
 * then loads babylon.sandbox.js (a build-time-generated shim that injects
 * this module and registers a BABYLON.Sandbox.Show stub).  The stub captures
 * the Show args and dispatches a "babylonSandboxReady" event that we pick up
 * here to start the sandbox with the correct version info.
 */
// Register GLTF/GLB loader (2.0 sub-loader assigns GLTFFileLoader._CreateGLTF2Loader).
// The sandbox loads .glb/.gltf files directly via SceneLoader.
import "loaders/glTF/2.0/glTFLoader";
import { Sandbox } from "./sandbox";

const HostElement = document.getElementById("host-element") as HTMLElement;

if (import.meta.env.DEV) {
    // Dev mode — show immediately with minimal version info
    Sandbox.Show(HostElement, { version: "dev", bundles: [] });
} else {
    // Production — CDN bootstrap calls BABYLON.Sandbox.Show which stores args
    const win = window as unknown as Record<string, unknown>;
    if (Array.isArray(win["__viteSandboxArgs"])) {
        Sandbox.Show(
            (win["__viteSandboxArgs"] as [HTMLElement, { version: string; bundles: string[] }])[0],
            (win["__viteSandboxArgs"] as [HTMLElement, { version: string; bundles: string[] }])[1]
        );
    } else {
        window.addEventListener(
            "babylonSandboxReady",
            (e: Event) => {
                const args = (e as CustomEvent<{ args: [HTMLElement, { version: string; bundles: string[] }] }>).detail.args;
                Sandbox.Show(args[0], args[1]);
            },
            { once: true }
        );
    }
}
