import type { NodeRenderGraphConnectionPoint, Scene, FrameGraphTextureHandle, FrameGraph, NodeRenderGraphBuildState, IViewportLike } from "core/index";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";
import { FrameGraphCopyToTextureTask } from "../../../Tasks/Texture/copyToTextureTask";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";

/**
 * Block used to copy a texture
 */
export class NodeRenderGraphCopyTextureBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphCopyToTextureTask;

    protected _useCurrentViewport = false;
    protected _useFullScreenViewport = true;
    protected _viewport: IViewportLike = { x: 0, y: 0, width: 1, height: 1 };

    /**
     * Gets the frame graph task associated with this block
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Create a new NodeRenderGraphCopyTextureBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this.registerInput("target", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.BasedOnInput);

        this.source.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer);
        this.target.addExcludedConnectionPointFromAllowedTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.source;

        this._frameGraphTask = new FrameGraphCopyToTextureTask(name, frameGraph);
    }

    private _setViewport() {
        if (this._useCurrentViewport) {
            this._frameGraphTask.viewport = null;
        } else if (this._useFullScreenViewport) {
            this._frameGraphTask.viewport = undefined;
        } else {
            this._frameGraphTask.viewport = this._viewport;
        }
    }

    /** If true, the current viewport will be left unchanged. */
    @editableInPropertyPage("Use currently active viewport", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get useCurrentViewport(): boolean {
        return this._useCurrentViewport;
    }

    public set useCurrentViewport(value: boolean) {
        this._useCurrentViewport = value;
        this._setViewport();
    }

    /** If true, a full screen viewport will be used. */
    @editableInPropertyPage("Use full screen viewport", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get useFullScreenViewport(): boolean {
        return this._useFullScreenViewport;
    }

    public set useFullScreenViewport(value: boolean) {
        this._useFullScreenViewport = value;
        this._setViewport();
    }

    /** The viewport to use. */
    @editableInPropertyPage("Viewport", PropertyTypeForEdition.Viewport, "PROPERTIES")
    public get viewport(): IViewportLike {
        return this._viewport;
    }

    public set viewport(value: IViewportLike) {
        this._viewport = value;
        this._setViewport();
    }

    /** The LOD level to copy from the source texture (default: 0). */
    @editableInPropertyPage("LOD Level", PropertyTypeForEdition.Int, "PROPERTIES", { min: 0, max: 16 })
    public get lodLevel(): number {
        return this._frameGraphTask.lodLevel;
    }

    public set lodLevel(value: number) {
        this._frameGraphTask.lodLevel = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphCopyTextureBlock";
    }
    /**
     * Gets the source input component
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the target input component
     */
    public get target(): NodeRenderGraphConnectionPoint {
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

        this.output.value = this._frameGraphTask.outputTexture; // the value of the output connection point is the "output" texture of the task

        this._frameGraphTask.sourceTexture = this.source.connectedPoint?.value as FrameGraphTextureHandle;
        this._frameGraphTask.targetTexture = this.target.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.viewport = ${this._useCurrentViewport ? "null" : this._useFullScreenViewport ? "undefined" : JSON.stringify(this._viewport)};`);
        codes.push(`${this._codeVariableName}.lodLevel = ${this.lodLevel};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.useCurrentViewport = this._useCurrentViewport;
        serializationObject.useFullScreenViewport = this._useFullScreenViewport;
        serializationObject.viewport = this._viewport;
        serializationObject.lodLevel = this.lodLevel;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        if (serializationObject.useCurrentViewport !== undefined) {
            this._useCurrentViewport = serializationObject.useCurrentViewport;
            this._useFullScreenViewport = serializationObject.useFullScreenViewport;
            this._viewport = serializationObject.viewport;
        }
        this.lodLevel = serializationObject.lodLevel ?? 0;
        this._setViewport();
    }
}

RegisterClass("BABYLON.NodeRenderGraphCopyTextureBlock", NodeRenderGraphCopyTextureBlock);
