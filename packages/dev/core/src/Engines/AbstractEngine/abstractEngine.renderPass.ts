import { AbstractEngine } from "../abstractEngine";

declare module "../../Engines/abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Gets the names of the render passes that are currently created
         * @returns list of the render pass names
         */
        getRenderPassNames(): string[];

        /**
         * Gets the name of the current render pass
         * @returns name of the current render pass
         */
        getCurrentRenderPassName(): string;

        /**
         * Creates a render pass id
         * @param name Name of the render pass (for debug purpose only)
         * @returns the id of the new render pass
         */
        createRenderPassId(name?: string): number;

        /**
         * Releases a render pass id
         * @param id id of the render pass to release
         */
        releaseRenderPassId(id: number): void;
    }
}

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
            if (mesh.subMeshes) {
                for (let b = 0; b < mesh.subMeshes.length; ++b) {
                    const subMesh = mesh.subMeshes[b];
                    subMesh._removeDrawWrapper(id);
                }
            }
        }
    }
};
