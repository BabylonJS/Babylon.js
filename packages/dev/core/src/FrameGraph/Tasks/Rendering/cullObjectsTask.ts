import type { Scene } from "../../../scene";
import type { Camera } from "../../../Cameras/camera";
import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphObjectList } from "../../frameGraphObjectList";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphCullObjectsTask extends FrameGraphTask {
    public objectList: FrameGraphObjectList;

    public camera: Camera;

    public readonly outputObjectList: FrameGraphObjectList;

    private _scene: Scene;

    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph);
        this._scene = scene;
        this.outputObjectList = {
            meshes: [],
            particleSystems: [],
        };
    }

    public override record() {
        if (this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCullObjectsTask ${this.name}: objectList and camera are required`);
        }

        const pass = this._frameGraph.addCullPass(this.name);

        pass.setObjectList(this.outputObjectList);
        pass.setExecuteFunc((_context) => {
            this.outputObjectList.meshes = [];

            this.camera._updateFrustumPlanes();

            const frustumPlanes = this.camera._frustumPlanes;

            const meshes = this.objectList.meshes || this._scene.meshes;
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
                    this.outputObjectList.meshes.push(mesh);
                }
            }
        });

        const passDisabled = this._frameGraph.addCullPass(this.name + "_disabled", true);

        passDisabled.setObjectList(this.outputObjectList);
        passDisabled.setExecuteFunc((_context) => {
            this.outputObjectList.meshes = this.objectList.meshes;
            this.outputObjectList.particleSystems = this.objectList.particleSystems;
        });
    }
}
