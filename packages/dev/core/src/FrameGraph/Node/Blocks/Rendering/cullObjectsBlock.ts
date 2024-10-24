// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraph } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { FrameGraphCullObjectsTask } from "../../../Tasks/Rendering/cullObjectsTask";
import type { Camera } from "../../../../Cameras/camera";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";

/**
 * Block that culls a list of objects
 */
export class NodeRenderGraphCullObjectsBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCullObjectsTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCullObjectsBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("objects", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ObjectList);

        this._frameGraphTask = new FrameGraphCullObjectsTask(this.name, frameGraph, scene);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCullObjectsBlock";
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the objects input component
     */
    public get objects(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameGraphTask.name = this.name;

        this.output.value = this._frameGraphTask.outputObjectList;

        const cameraConnectedPoint = this.camera.connectedPoint;
        if (cameraConnectedPoint) {
            this._frameGraphTask.camera = cameraConnectedPoint.value as Camera;
        }

        const objectsConnectedPoint = this.objects.connectedPoint;
        if (objectsConnectedPoint) {
            this._frameGraphTask.objectList = objectsConnectedPoint.value as FrameGraphObjectList;
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
    }
}

RegisterClass("BABYLON.NodeRenderGraphCullObjectsBlock", NodeRenderGraphCullObjectsBlock);
