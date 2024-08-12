import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Enums/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";
import type { IFrameGraphCopyToBackbufferColorInputData } from "core/FrameGraph/Tasks/copyToBackbufferColorTask";
import { FrameGraphCopyToBackbufferColorTask } from "core/FrameGraph/Tasks/copyToBackbufferColorTask";

/**
 * Block used to generate the final graph
 */
export class RenderGraphOutputBlock extends NodeRenderGraphBlock {
    private _frameTask: FrameGraphCopyToBackbufferColorTask;
    private _taskParameters: IFrameGraphCopyToBackbufferColorInputData;

    /**
     * Create a new RenderGraphOutputBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this._isUnique = true;

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);

        this._frameTask = new FrameGraphCopyToBackbufferColorTask(name);
        this._taskParameters = {
            sourceTexture: undefined as any,
        };
    }

    /** Disables the copy of the input texture to the back buffer in case the input texture is not already the back buffer texture */
    @editableInPropertyPage("Disable back buffer copy", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public get disableBackBufferCopy() {
        return this._frameTask.disabledFromGraph;
    }

    public set disableBackBufferCopy(value: boolean) {
        this._frameTask.disabledFromGraph = value;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RenderGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        this._frameTask.name = this.name;

        const inputTexture = this.texture.connectedPoint?.value;
        if (inputTexture && NodeRenderGraphConnectionPoint.ValueIsTexture(inputTexture)) {
            this._taskParameters.sourceTexture = inputTexture;
        }

        state.frameGraph.addTask(this._frameTask, this._taskParameters);
    }

    protected override _dumpPropertiesCode() {
        const codes: string[] = [];
        codes.push(`${this._codeVariableName}.disableBackBufferCopy = ${this.disableBackBufferCopy};`);
        return super._dumpPropertiesCode() + codes.join("\n");
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.disableBackBufferCopy = this.disableBackBufferCopy;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.disableBackBufferCopy = serializationObject.disableBackBufferCopy;
    }
}

RegisterClass("BABYLON.RenderGraphOutputBlock", RenderGraphOutputBlock);
