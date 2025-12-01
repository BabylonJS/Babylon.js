import type {
    Camera,
    DirectionalLight,
    FrameGraph,
    FrameGraphObjectList,
    FrameGraphTextureHandle,
    NodeRenderGraphBuildState,
    NodeRenderGraphConnectionPoint,
    Scene,
} from "core/index";
import { RegisterClass } from "../../../../Misc/typeStore";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { FrameGraphVolumetricLightingTask } from "core/FrameGraph/Tasks/PostProcesses/volumetricLightingTask";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";

/**
 * Block that implements the volumetric lighting post process
 */
export class NodeRenderGraphVolumetricLightingBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphVolumetricLightingTask;

    public override _additionalConstructionParameters: [boolean];

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphVolumetricLightingBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param enableExtinction defines whether to enable extinction coefficients
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, enableExtinction = false) {
        super(name, frameGraph, scene);

        this._additionalConstructionParameters = [enableExtinction];

        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("depth", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("camera", NodeRenderGraphBlockConnectionPointTypes.Camera);
        this.registerInput("lightingVolumeMesh", NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        this.registerInput("light", NodeRenderGraphBlockConnectionPointTypes.ShadowLight);
        this.registerInput("lightingVolumeTexture", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.lightingVolumeTexture.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);

        this.depth.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment | NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth
        );

        this._addDependenciesInput();

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = () => {
            return this.target;
        };

        this._frameGraphTask = new FrameGraphVolumetricLightingTask(name, frameGraph, enableExtinction);
    }

    private _createTask(enableExtinction: boolean) {
        const sourceSamplingMode = this._frameGraphTask.sourceSamplingMode;
        const phaseG = this._frameGraphTask.phaseG;
        const extinction = this._frameGraphTask.extinction;
        const lightPower = this._frameGraphTask.lightPower;

        this._frameGraphTask.dispose();

        this._frameGraphTask = new FrameGraphVolumetricLightingTask(this.name, this._frameGraph, enableExtinction);
        this._frameGraphTask.sourceSamplingMode = sourceSamplingMode;
        this._frameGraphTask.phaseG = phaseG;
        this._frameGraphTask.extinction = extinction;
        this._frameGraphTask.lightPower = lightPower;

        this._additionalConstructionParameters = [enableExtinction];
    }

    /** Gets or sets the phaseG parameter */
    @editableInPropertyPage("PhaseG", PropertyTypeForEdition.Float, "PROPERTIES", { min: -0.9, max: 0.9 })
    public get phaseG(): number {
        return this._frameGraphTask.phaseG;
    }

    public set phaseG(value: number) {
        this._frameGraphTask.phaseG = value;
    }

    /** If extinction coefficients should be used */
    @editableInPropertyPage("Enable extinction", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get enableExtinction(): boolean {
        return this._frameGraphTask.enableExtinction;
    }

    public set enableExtinction(value: boolean) {
        this._createTask(value);
    }

    /** Gets or sets the extinction color */
    @editableInPropertyPage("Extinction", PropertyTypeForEdition.Vector3, "PROPERTIES")
    public get extinction(): Vector3 {
        return this._frameGraphTask.extinction;
    }

    public set extinction(value: Vector3) {
        this._frameGraphTask.extinction = value;
    }

    /** Gets or sets the light power */
    @editableInPropertyPage("Light power", PropertyTypeForEdition.Color3, "PROPERTIES")
    public get lightPower(): Color3 {
        return this._frameGraphTask.lightPower;
    }

    public set lightPower(value: Color3) {
        this._frameGraphTask.lightPower = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphVolumetricLightingBlock";
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the depth texture input component
     */
    public get depth(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the camera input component
     */
    public get camera(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the lighting volume mesh input component
     */
    public get lightingVolumeMesh(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the light input component
     */
    public get light(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the lighting volume texture input component
     */
    public get lightingVolumeTexture(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;

        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.depthTexture = this.depth.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.camera = this.camera.connectedPoint?.value as Camera;
        this._frameGraphTask.lightingVolumeMesh = this.lightingVolumeMesh.connectedPoint?.value as FrameGraphObjectList;
        this._frameGraphTask.light = this.light.connectedPoint?.value as DirectionalLight;
        this._frameGraphTask.lightingVolumeTexture = this.lightingVolumeTexture.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.phaseG = ${this.phaseG};`);
        codes.push(`${this._codeVariableName}.extinction = new BABYLON.Vector3(${this.extinction.x}, ${this.extinction.y}, ${this.extinction.z});`);
        codes.push(`${this._codeVariableName}.lightPower = new Color3(${this.lightPower.r}, ${this.lightPower.g}, ${this.lightPower.b});`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.phaseG = this.phaseG;
        serializationObject.extinction = this.extinction.asArray();
        serializationObject.lightPower = this.lightPower.asArray();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.phaseG = serializationObject.phaseG;
        this.extinction = Vector3.FromArray(serializationObject.extinction);
        this.lightPower = Color3.FromArray(serializationObject.lightPower);
    }
}

RegisterClass("BABYLON.NodeRenderGraphVolumetricLightingBlock", NodeRenderGraphVolumetricLightingBlock);
