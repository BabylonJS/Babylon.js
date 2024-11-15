// eslint-disable-next-line import/no-internal-modules
import type { NodeRenderGraphConnectionPoint, Scene, NodeRenderGraphBuildState, FrameGraphTextureHandle, FrameGraph, Camera } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { FrameGraphCircleOfConfusionTask } from "core/FrameGraph/Tasks/PostProcesses/circleOfConfusionTask";
import { ThinCircleOfConfusionPostProcess } from "core/PostProcesses/thinCircleOfConfusionPostProcess";

/**
 * Block that implements the circle of confusion post process
 */
export class NodeRenderGraphCircleOfConfusionPostProcessBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCircleOfConfusionTask;

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCircleOfConfusionPostProcessBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.Texture);
        this.registerInput("geomViewDepth", NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth);
        this.registerInput("destination", NodeRenderGraphBlockConnectionPointTypes.Texture, true);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.destination.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = () => {
            return this.destination.isConnected ? this.destination : this.source;
        };

        this._frameGraphTask = new FrameGraphCircleOfConfusionTask(
            this.name,
            frameGraph,
            new ThinCircleOfConfusionPostProcess(name, scene.getEngine(), { depthNotNormalized: true })
        );
    }

    /** Sampling mode used to sample from the source texture */
    @editableInPropertyPage("Source sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get sourceSamplingMode() {
        return this._frameGraphTask.sourceSamplingMode;
    }

    public set sourceSamplingMode(value: number) {
        this._frameGraphTask.sourceSamplingMode = value;
    }

    /** Sampling mode used to sample from the depth texture */
    @editableInPropertyPage("Depth sampling mode", PropertyTypeForEdition.SamplingMode, "PROPERTIES")
    public get depthSamplingMode() {
        return this._frameGraphTask.depthSamplingMode;
    }

    public set depthSamplingMode(value: number) {
        this._frameGraphTask.depthSamplingMode = value;
    }

    /** Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. The diameter of the resulting aperture can be computed by lensSize/fStop. */
    @editableInPropertyPage("Lens size", PropertyTypeForEdition.Float, "PROPERTIES")
    public get lensSize(): number {
        return this._frameGraphTask.postProcess.lensSize;
    }

    public set lensSize(value: number) {
        this._frameGraphTask.postProcess.lensSize = value;
    }

    /** F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop */
    @editableInPropertyPage("F-Stop", PropertyTypeForEdition.Float, "PROPERTIES")
    public get fStop(): number {
        return this._frameGraphTask.postProcess.fStop;
    }

    public set fStop(value: number) {
        this._frameGraphTask.postProcess.fStop = value;
    }

    /** Distance away from the camera to focus on in scene units/1000 (eg. millimeter) */
    @editableInPropertyPage("Focus distance", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focusDistance(): number {
        return this._frameGraphTask.postProcess.focusDistance;
    }

    public set focusDistance(value: number) {
        this._frameGraphTask.postProcess.focusDistance = value;
    }

    /** Focal length of the effect's camera in scene units/1000 (eg. millimeter) */
    @editableInPropertyPage("Focal length", PropertyTypeForEdition.Float, "PROPERTIES")
    public get focalLength(): number {
        return this._frameGraphTask.postProcess.focalLength;
    }

    public set focalLength(value: number) {
        this._frameGraphTask.postProcess.focalLength = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCircleOfConfusionPostProcessBlock";
    }

    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the geometry view depth input component
     */
    public get geomViewDepth(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the destination input component
     */
    public get destination(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
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

        this.output.value = this._frameGraphTask.outputTexture;

        const sourceConnectedPoint = this.source.connectedPoint;
        if (sourceConnectedPoint) {
            this._frameGraphTask.sourceTexture = sourceConnectedPoint.value as FrameGraphTextureHandle;
        }

        const geomViewDepthConnectedPoint = this.geomViewDepth.connectedPoint;
        if (geomViewDepthConnectedPoint) {
            this._frameGraphTask.depthTexture = geomViewDepthConnectedPoint.value as FrameGraphTextureHandle;
        }

        const destinationConnectedPoint = this.destination.connectedPoint;
        if (destinationConnectedPoint) {
            this._frameGraphTask.destinationTexture = destinationConnectedPoint.value as FrameGraphTextureHandle;
        }

        const cameraConnectedPoint = this.camera.connectedPoint;
        if (cameraConnectedPoint) {
            this._frameGraphTask.camera = cameraConnectedPoint.value as Camera;
        }
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.lensSize = ${this.lensSize};`);
        codes.push(`${this._codeVariableName}.fStop = ${this.fStop};`);
        codes.push(`${this._codeVariableName}.focusDistance = ${this.focusDistance};`);
        codes.push(`${this._codeVariableName}.focalLength = ${this.focalLength};`);
        codes.push(`${this._codeVariableName}.sourceSamplingMode = ${this.sourceSamplingMode};`);
        codes.push(`${this._codeVariableName}.depthSamplingMode = ${this.depthSamplingMode};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.lensSize = this.lensSize;
        serializationObject.fStop = this.fStop;
        serializationObject.focusDistance = this.focusDistance;
        serializationObject.focalLength = this.focalLength;
        serializationObject.sourceSamplingMode = this.sourceSamplingMode;
        serializationObject.depthSamplingMode = this.depthSamplingMode;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.lensSize = serializationObject.lensSize;
        this.fStop = serializationObject.fStop;
        this.focusDistance = serializationObject.focusDistance;
        this.focalLength = serializationObject.focalLength;
        this.sourceSamplingMode = serializationObject.sourceSamplingMode;
        this.depthSamplingMode = serializationObject.depthSamplingMode;
    }
}

RegisterClass("BABYLON.NodeRenderGraphCircleOfConfusionPostProcessBlock", NodeRenderGraphCircleOfConfusionPostProcessBlock);
