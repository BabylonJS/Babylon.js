import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "../nodeRenderGraphBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Enums/nodeRenderGraphBlockConnectionPointTypes";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../Decorators/nodeDecorator";
import type { AbstractEngine } from "../../../Engines/abstractEngine";
import type { NodeRenderGraphBuildState } from "../nodeRenderGraphBuildState";

/**
 * Block used to generate the final graph
 */
export class NodeRenderGraphOutputBlock extends NodeRenderGraphBlock {
    /**
     * Create a new NodeRenderGraphOutputBlock
     * @param name defines the block name
     * @param engine defines the hosting engine
     */
    public constructor(name: string, engine: AbstractEngine) {
        super(name, engine);

        this._isUnique = true;

        this.registerInput("texture", NodeRenderGraphBlockConnectionPointTypes.Texture);

        this.texture.addAcceptedConnectionPointTypes(NodeRenderGraphBlockConnectionPointTypes.TextureAll);
    }

    /** Disables the copy of the input texture to the back buffer in case the input texture is not already the back buffer texture */
    @editableInPropertyPage("Disable back buffer copy", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public disableBackBufferCopy = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    protected override _buildBlock(state: NodeRenderGraphBuildState) {
        super._buildBlock(state);

        const inputTexture = this.texture.connectedPoint?.value;
        if (!inputTexture || !inputTexture.value) {
            return;
        }

        const internalTexture = inputTexture.getInternalTextureFromValue();
        if (this.disableBackBufferCopy || inputTexture.isBackBuffer() || !internalTexture) {
            return;
        }

        state.frameGraph.addExecuteFunction(() => {
            state.frameGraph.copyTextureToTexture(internalTexture, null);
        });
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

RegisterClass("BABYLON.NodeRenderGraphOutputBlock", NodeRenderGraphOutputBlock);
