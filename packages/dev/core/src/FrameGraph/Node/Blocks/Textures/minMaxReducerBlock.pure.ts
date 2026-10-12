/** This file must only contain pure code and pure imports */

import { type FrameGraph, type FrameGraphTextureHandle, type NodeRenderGraphBuildState, type NodeRenderGraphConnectionPoint, type Scene } from "core/index";
import { Constants } from "core/Engines/constants";
import { DepthTextureType } from "core/Misc/thinMinMaxReducer";
import { FrameGraphMinMaxReducerTask } from "../../../Tasks/Misc/minMaxReducerTask";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeRenderGraphBlock } from "../../nodeRenderGraphBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "../../Types/nodeRenderGraphTypes";

/**
 * Block that reduces a color texture's red channel to its minimum and maximum values.
 * When using a geometry depth-as-color output, enable depthRedux and select the matching depthTextureType.
 * WebGPU depth/stencil attachments are reduced as screen depth automatically.
 * Connect the output to a downstream texture input or a dependency so the block is included in the graph.
 */
export class NodeRenderGraphMinMaxReducerBlock extends NodeRenderGraphBlock {
    protected override _frameGraphTask: FrameGraphMinMaxReducerTask;

    /**
     * Gets the frame graph task associated with this block.
     */
    public override get task() {
        return this._frameGraphTask;
    }

    /**
     * Creates a min/max reducer block.
     * @param name The block name.
     * @param frameGraph The hosting frame graph.
     * @param scene The hosting scene.
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("source", NodeRenderGraphBlockConnectionPointTypes.AutoDetect);
        this._addDependenciesInput();
        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this.source.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer & ~NodeRenderGraphBlockConnectionPointTypes.TextureMeshBlendTag
        );

        this._frameGraphTask = new FrameGraphMinMaxReducerTask(name, frameGraph);
    }

    /** Whether to ignore the depth clear value of a depth-as-color source. Depth/stencil attachments are handled automatically. */
    @editableInPropertyPage("Depth-as-color reduction", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get depthRedux(): boolean {
        return this._frameGraphTask.depthRedux;
    }

    public set depthRedux(value: boolean) {
        this._frameGraphTask.depthRedux = value;
    }

    /** The kind of depth values stored in a depth-as-color source when depth reduction is enabled. */
    @editableInPropertyPage("Depth-as-color type", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "Normalized view depth", value: DepthTextureType.NormalizedViewDepth },
            { label: "View depth", value: DepthTextureType.ViewDepth },
            { label: "Screen depth", value: DepthTextureType.ScreenDepth },
        ],
    })
    public get depthTextureType(): DepthTextureType {
        return this._frameGraphTask.depthTextureType;
    }

    public set depthTextureType(value: DepthTextureType) {
        this._frameGraphTask.depthTextureType = value;
    }

    /** The texture type used for the reduction steps and the 1x1 result. */
    @editableInPropertyPage("Texture type", PropertyTypeForEdition.List, "PROPERTIES", {
        options: [
            { label: "Half float", value: Constants.TEXTURETYPE_HALF_FLOAT },
            { label: "Float", value: Constants.TEXTURETYPE_FLOAT },
            { label: "Unsigned byte", value: Constants.TEXTURETYPE_UNSIGNED_BYTE },
        ],
    })
    public get textureType(): number {
        return this._frameGraphTask.textureType;
    }

    public set textureType(value: number) {
        this._frameGraphTask.textureType = value;
    }

    /** Wait for WebGPU readback before notifying observers, without blocking the render loop. */
    @editableInPropertyPage("Wait for readback", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get waitForReadback(): boolean {
        return this._frameGraphTask.waitForReadback;
    }

    public set waitForReadback(value: boolean) {
        this._frameGraphTask.waitForReadback = value;
    }

    /**
     * Gets the source texture input.
     */
    public get source(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the 1x1 RG texture containing the minimum in red and maximum in green.
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }

    public override getClassName() {
        return "NodeRenderGraphMinMaxReducerBlock";
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this.output.value = this._frameGraphTask.outputTexture;
        this._frameGraphTask.sourceTexture = this.source.connectedPoint?.value as FrameGraphTextureHandle;
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.depthRedux = ${this.depthRedux};`);
        codes.push(`${this._codeVariableName}.depthTextureType = ${this.depthTextureType};`);
        codes.push(`${this._codeVariableName}.textureType = ${this.textureType};`);
        codes.push(`${this._codeVariableName}.waitForReadback = ${this.waitForReadback};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.depthRedux = this.depthRedux;
        serializationObject.depthTextureType = this.depthTextureType;
        serializationObject.textureType = this.textureType;
        serializationObject.waitForReadback = this.waitForReadback;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.depthRedux = serializationObject.depthRedux ?? false;
        this.depthTextureType = serializationObject.depthTextureType ?? DepthTextureType.NormalizedViewDepth;
        this.textureType = serializationObject.textureType ?? Constants.TEXTURETYPE_HALF_FLOAT;
        this.waitForReadback = serializationObject.waitForReadback ?? false;
    }
}

let _Registered = false;
/**
 * Registers the min/max reducer block for node render graph deserialization.
 */
export function RegisterMinMaxReducerBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass("BABYLON.NodeRenderGraphMinMaxReducerBlock", NodeRenderGraphMinMaxReducerBlock);
}
