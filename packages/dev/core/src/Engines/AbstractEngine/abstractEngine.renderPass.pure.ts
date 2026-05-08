import { AbstractEngine } from "../abstractEngine.pure";
/** This file must only contain pure code and pure imports */

let _registered = false;
export function registerAbstractEngineRenderPass(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype.getRenderPassNames = function (): string[] {
        return this._renderPassNames;
    };

    AbstractEngine.prototype.getCurrentRenderPassName = function (): string {
        return this._renderPassNames[this.currentRenderPassId];
    };

    AbstractEngine.prototype.createRenderPassId = function (name?: string): number {
        // Note: render pass id == 0 is always for the main render pass
        const id = ++AbstractEngine._RenderPassIdCounter;
        this._renderPassNames[id] = name ?? "NONAME";
        return id;
    };

    AbstractEngine.prototype.releaseRenderPassId = function (id: number): void {
        this._renderPassNames[id] = undefined as any;

        for (let s = 0; s < this.scenes.length; ++s) {
            const scene = this.scenes[s];
            for (let m = 0; m < scene.meshes.length; ++m) {
                const mesh = scene.meshes[m];
                mesh._releaseRenderPassId(id);
                if (mesh.subMeshes) {
                    for (let b = 0; b < mesh.subMeshes.length; ++b) {
                        const subMesh = mesh.subMeshes[b];
                        subMesh._removeDrawWrapper(id);
                    }
                }
            }
        }
    };
}
