import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTaskOutputReference, IFrameGraphTask, FrameGraphObjectListId } from "../../frameGraphTypes";
import type { FrameGraphObjectList } from "../../frameGraphObjectList";

export class FrameGraphCullObjectsTask implements IFrameGraphTask {
    public objectList: FrameGraphObjectListId;

    public camera: Camera;

    public readonly outputObjectListReference: FrameGraphTaskOutputReference = [this, "output"];

    public disabled = false;

    private _scene: Scene;
    private _inputObjectList: FrameGraphObjectList;
    private _outputObjectList: FrameGraphObjectList;

    constructor(
        public name: string,
        scene: Scene
    ) {
        this._scene = scene;
        this._outputObjectList = {
            meshes: [],
            particleSystems: [],
        };
    }

    public isReadyFrameGraph() {
        return true;
    }

    public recordFrameGraph(frameGraph: FrameGraph) {
        if (this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCullObjectsTask ${this.name}: objectList and camera are required`);
        }

        this._inputObjectList = frameGraph.getObjectList(this.objectList);

        const pass = frameGraph.addCullPass(this.name);

        pass.setObjectList(this._outputObjectList);
        pass.setExecuteFunc((_context) => {
            this._outputObjectList.meshes = [];

            this.camera._updateFrustumPlanes();

            const frustumPlanes = this.camera._frustumPlanes;

            const meshes = this._inputObjectList.meshes || this._scene.meshes;
            for (let i = 0; i < meshes.length; i++) {
                const mesh = meshes[i];
                if (mesh.isBlocked || !mesh.isReady() || !mesh.isEnabled() || mesh.scaling.hasAZeroComponent) {
                    continue;
                }

                if (
                    mesh.isVisible &&
                    mesh.visibility > 0 &&
                    (mesh.layerMask & this.camera.layerMask) !== 0 &&
                    (this._scene.skipFrustumClipping || mesh.alwaysSelectAsActiveMesh || mesh.isInFrustum(frustumPlanes))
                ) {
                    this._outputObjectList.meshes.push(mesh);
                }
            }
        });

        const passDisabled = frameGraph.addCullPass(this.name + "_disabled", true);

        passDisabled.setObjectList(this._outputObjectList);
        passDisabled.setExecuteFunc((_context) => {
            this._outputObjectList.meshes = this._inputObjectList.meshes;
            this._outputObjectList.particleSystems = this._inputObjectList.particleSystems;
        });
    }

    public disposeFrameGraph(): void {}
}
