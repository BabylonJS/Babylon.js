import type { FrameGraph, FrameGraphObjectList, FrameGraphShadowGeneratorTask } from "core/index";
import { LightingVolume } from "core/Lights/lightingVolume";
import { DirectionalLight } from "core/Lights/directionalLight";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task used to create a lighting volume from a directional light's shadow generator.
 */
export class FrameGraphLightingVolumeTask extends FrameGraphTask {
    /**
     * The shadow generator used to create the lighting volume.
     */
    public shadowGenerator: FrameGraphShadowGeneratorTask;

    /**
     * The output object list containing the lighting volume mesh.
     * You can get the mesh by doing  outputMeshLightingVolume.meshes[0]
     */
    public readonly outputMeshLightingVolume: FrameGraphObjectList;

    /**
     * The lighting volume created by this task.
     */
    public readonly lightingVolume: LightingVolume;

    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this.lightingVolume) {
            this.lightingVolume.name = name;
        }
    }

    /**
     * Creates a new FrameGraphLightingVolumeTask.
     * @param name Name of the task.
     * @param frameGraph The frame graph instance.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.lightingVolume = new LightingVolume(name, frameGraph.scene);

        this.outputMeshLightingVolume = {
            meshes: [this.lightingVolume.mesh],
            particleSystems: [],
        };
    }

    public override isReady() {
        const isReady = this.lightingVolume.isReady();
        if (isReady) {
            this.lightingVolume._setComputeShaderFastMode(true);
        }
        return isReady;
    }

    public override getClassName(): string {
        return "FrameGraphLightingVolumeTask";
    }

    public record() {
        if (this.shadowGenerator === undefined) {
            throw new Error(`FrameGraphLightingVolumeTask ${this.name}: shadowGenerator is required`);
        }

        const light = this.shadowGenerator.light;

        if (!(light instanceof DirectionalLight)) {
            throw new Error(`FrameGraphLightingVolumeTask ${this.name}: light must be a directional light`);
        }

        this.lightingVolume.shadowGenerator = this.shadowGenerator.shadowGenerator;

        const pass = this._frameGraph.addObjectListPass(this.name);

        pass.setObjectList(this.outputMeshLightingVolume);
        pass.setExecuteFunc(() => {
            this.lightingVolume.update();
        });

        const passDisabled = this._frameGraph.addObjectListPass(this.name + "_disabled", true);

        passDisabled.setObjectList(this.outputMeshLightingVolume);
        passDisabled.setExecuteFunc(() => {});
    }

    public override dispose() {
        super.dispose();
        this.lightingVolume.dispose();
    }
}
