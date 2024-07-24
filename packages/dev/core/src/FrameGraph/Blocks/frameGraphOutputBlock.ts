import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuilder } from "../frameGraphBuilder";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../Decorators/nodeDecorator";
import { CopyTextureToTexture } from "core/Misc";

/**
 * Block used to generate the final graph
 */
export class FrameGraphOutputBlock extends FrameGraphBlock {
    private _copyTexture: CopyTextureToTexture | undefined;

    /**
     * Create a new FrameGraphOutputBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isUnique = true;

        this.registerInput("texture", FrameGraphBlockConnectionPointTypes.Texture);

        this.texture.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAll);
    }

    /** Disables the copy of the input texture to the back buffer in case the input texture is not already the back buffer texture */
    @editableInPropertyPage("Disable back buffer copy", PropertyTypeForEdition.Boolean, "PROPERTIES")
    public disableBackBufferCopy = false;

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphOutputBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): FrameGraphConnectionPoint {
        return this._inputs[0];
    }

    public override dispose() {
        this._copyTexture?.dispose();
        this._copyTexture = undefined;

        super.dispose();
    }

    protected override _buildBlock(builder: FrameGraphBuilder) {
        super._buildBlock(builder);

        if (!this._copyTexture) {
            this._copyTexture = new CopyTextureToTexture(builder.engine);
        }

        const inputTexture = this.texture.connectedPoint?.value;
        if (!inputTexture || !inputTexture.value) {
            return;
        }

        const internalTexture = inputTexture.getInternalTextureFromValue();
        if (this.disableBackBufferCopy || inputTexture.isBackBuffer() || !internalTexture) {
            return;
        }

        builder.addExecuteFunction(() => {
            this._copyTexture!.copy(internalTexture, null);
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

RegisterClass("BABYLON.FrameGraphOutputBlock", FrameGraphOutputBlock);
