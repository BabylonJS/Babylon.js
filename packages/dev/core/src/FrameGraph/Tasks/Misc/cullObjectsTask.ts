import type { Scene, Camera, FrameGraph, FrameGraphObjectList } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task used to cull objects that are not visible.
 */
export class FrameGraphCullObjectsTask extends FrameGraphTask {
    /**
     * The object list to cull.
     */
    public objectList: FrameGraphObjectList;

    /**
     * The camera to use for culling.
     */
    public camera: Camera;

    /**
     * The output object list containing the culled objects.
     */
    public readonly outputObjectList: FrameGraphObjectList;

    private readonly _scene: Scene;

    /**
     * Creates a new cull objects task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene to cull objects from.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph);
        this._scene = scene;
        this.outputObjectList = {
            meshes: null,
            particleSystems: null,
        };
    }

    public record() {
        if (this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphCullObjectsTask ${this.name}: objectList and camera are required`);
        }

        // Initial output values
        this.outputObjectList.meshes = this.objectList.meshes;
        this.outputObjectList.particleSystems = this.objectList.particleSystems;

        const pass = this._frameGraph.addObjectListPass(this.name);

        pass.setObjectList(this.outputObjectList);
        pass.setExecuteFunc((_context) => {
            // No culling on particle systems
            this.outputObjectList.particleSystems = this.objectList.particleSystems;

            if (this._scene._activeMeshesFrozen) {
                // If active meshes are frozen, we don't need culling: we keep the last list created before freezing
                return;
            }

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

        const passDisabled = this._frameGraph.addObjectListPass(this.name + "_disabled", true);

        passDisabled.setObjectList(this.outputObjectList);
        passDisabled.setExecuteFunc((_context) => {
            this.outputObjectList.meshes = this.objectList.meshes;
            this.outputObjectList.particleSystems = this.objectList.particleSystems;
        });
    }
}
