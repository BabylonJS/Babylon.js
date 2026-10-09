import { GaussianSplattingMaterial } from "core/Materials/GaussianSplatting/gaussianSplattingMaterial";
import { GaussianSplattingSizeMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingSizeMaterialPlugin";
import { GaussianSplattingOverdrawMaterialPlugin } from "core/Materials/GaussianSplatting/gaussianSplattingOverdrawMaterialPlugin";
import { type GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type Material } from "core/Materials/material";
import { type ShadowDepthWrapper } from "core/Materials/shadowDepthWrapper";
import { Observable, type Observer } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { type Node } from "core/node";

export type GaussianSplattingDebugMode = "normal" | "size" | "overdraw";

type DebugEntry = {
    original: Material;
    originalDisposed: boolean;
    originalObserver: Observer<Material>;
    temporary: GaussianSplattingMaterial;
    shadow: ShadowDepthWrapper;
    size: GaussianSplattingSizeMaterialPlugin;
    overdraw: GaussianSplattingOverdrawMaterialPlugin;
    mode: GaussianSplattingDebugMode;
    meshObserver: Observer<Node>;
    sceneObserver: Observer<Scene>;
    renderObserver: Observer<Scene>;
};

/** Owns Inspector-only per-mesh visualization materials for the lifetime of the properties service. */
export class GaussianSplattingDebugController {
    private readonly _entries = new Map<GaussianSplattingMesh, DebugEntry>();
    /** Notifies controls when a mesh's debug mode changes, including external material replacement. */
    public readonly onModeChangedObservable = new Observable<GaussianSplattingMesh>();

    /**
     * Gets the active per-mesh mode, releasing a material replaced by the application.
     * @param mesh Selected Gaussian mesh
     * @returns Active mode
     */
    public getMode(mesh: GaussianSplattingMesh): GaussianSplattingDebugMode {
        const entry = this._entries.get(mesh);
        if (entry && mesh.material !== entry.temporary) {
            this._release(mesh, false);
            return "normal";
        }
        return entry?.mode ?? "normal";
    }

    /**
     * Gets the two plugins on an Inspector-owned material.
     * @param mesh Selected Gaussian mesh
     * @returns Plugins when the mesh is being debugged
     */
    public getPlugins(mesh: GaussianSplattingMesh): { size: GaussianSplattingSizeMaterialPlugin; overdraw: GaussianSplattingOverdrawMaterialPlugin } | undefined {
        return this._entries.get(mesh);
    }

    /**
     * @param mesh Selected Gaussian mesh
     * @returns Whether its current material supports debugging
     */
    public canDebug(mesh: GaussianSplattingMesh): boolean {
        return this._entries.has(mesh) || mesh.material instanceof GaussianSplattingMaterial;
    }

    /**
     * Keeps Inspector edits to minimum pixel size on the source material while a visualization is active.
     * @param mesh Selected Gaussian mesh
     * @param value Minimum projected pixel size
     */
    public setMinPixelSize(mesh: GaussianSplattingMesh, value: number): void {
        const entry = this._entries.get(mesh);
        if (entry && !entry.originalDisposed && entry.original instanceof GaussianSplattingMaterial) {
            entry.original.minPixelSize = Math.max(0, value);
        }
    }

    /**
     * Selects the rendering mode without changing the application's source material.
     * @param mesh Gaussian mesh to visualize
     * @param mode Rendering mode
     */
    public setMode(mesh: GaussianSplattingMesh, mode: GaussianSplattingDebugMode): void {
        const current = this.getMode(mesh);
        if (mode === "normal") {
            if (current !== "normal") {
                this._release(mesh, true);
            }
            return;
        }
        let entry = this._entries.get(mesh);
        if (!entry) {
            const original = mesh.material;
            if (!(original instanceof GaussianSplattingMaterial) || mesh.isDisposed()) {
                return;
            }
            const scene = mesh.getScene();
            const temporary = new GaussianSplattingMaterial(`${mesh.name}_inspectorDebug`, scene);
            const shadow = temporary.shadowDepthWrapper!;
            temporary.doNotSerialize = true;
            temporary.reservedDataStore = { hidden: true };
            shadow.baseMaterial.reservedDataStore = { hidden: true };
            temporary.setSourceMesh(mesh);
            temporary.kernelSize = original.kernelSize;
            temporary.minPixelSize = original.minPixelSize;
            temporary.compensation = original.compensation;
            temporary.alpha = original.alpha;
            temporary.alphaMode = original.alphaMode;
            temporary.depthFunction = original.depthFunction;
            temporary.disableDepthWrite = original.disableDepthWrite;
            temporary.forceDepthWrite = original.forceDepthWrite;
            temporary.clipPlane = original.clipPlane;
            temporary.clipPlane2 = original.clipPlane2;
            temporary.clipPlane3 = original.clipPlane3;
            temporary.clipPlane4 = original.clipPlane4;
            temporary.clipPlane5 = original.clipPlane5;
            temporary.clipPlane6 = original.clipPlane6;
            temporary.useLogarithmicDepth = original.useLogarithmicDepth;
            const size = new GaussianSplattingSizeMaterialPlugin(temporary);
            const overdraw = new GaussianSplattingOverdrawMaterialPlugin(temporary);
            size.isEnabled = false;
            overdraw.isEnabled = false;
            entry = {
                original,
                originalDisposed: false,
                originalObserver: original.onDisposeObservable.add(() => {
                    const current = this._entries.get(mesh);
                    if (current) {
                        current.originalDisposed = true;
                    }
                }),
                temporary,
                shadow,
                size,
                overdraw,
                mode: "normal",
                meshObserver: mesh.onDisposeObservable.add(() => this._release(mesh, false)),
                sceneObserver: scene.onDisposeObservable.add(() => this._release(mesh, false)),
                renderObserver: scene.onBeforeRenderObservable.add(() => {
                    if (mesh.material !== temporary) {
                        this._release(mesh, false);
                    }
                }),
            };
            this._entries.set(mesh, entry);
            mesh.material = temporary;
        }
        entry.size.isEnabled = mode === "size";
        entry.overdraw.isEnabled = mode === "overdraw";
        entry.mode = mode;
        if (current !== mode) {
            this.onModeChangedObservable.notifyObservers(mesh);
        }
    }

    private _release(mesh: GaussianSplattingMesh, restore: boolean): void {
        const entry = this._entries.get(mesh);
        if (!entry) {
            return;
        }
        this._entries.delete(mesh);
        mesh.onDisposeObservable.remove(entry.meshObserver);
        entry.original.onDisposeObservable.remove(entry.originalObserver);
        const scene = mesh.getScene();
        scene.onDisposeObservable.remove(entry.sceneObserver);
        scene.onBeforeRenderObservable.remove(entry.renderObserver);
        if (restore && !mesh.isDisposed() && mesh.material === entry.temporary) {
            mesh.material = entry.originalDisposed ? null : entry.original;
        }
        entry.shadow.dispose();
        entry.shadow.baseMaterial.dispose(false, false);
        entry.temporary.dispose(false, false);
        this.onModeChangedObservable.notifyObservers(mesh);
    }

    /** Releases Inspector-owned materials, restoring a source material only if it remains alive. */
    public dispose(): void {
        for (const mesh of this._entries.keys()) {
            this._release(mesh, true);
        }
        this.onModeChangedObservable.clear();
    }
}
