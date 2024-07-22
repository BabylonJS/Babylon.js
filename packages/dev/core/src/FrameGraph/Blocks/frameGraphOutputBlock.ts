import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuildState } from "../frameGraphBuildState";
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

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);

        if (!this._copyTexture) {
            this._copyTexture = new CopyTextureToTexture(state.engine);
        }
    }

    protected override _execute(): void {
        const inputTexture = this.texture.connectedPoint?.value;
        if (!inputTexture || !inputTexture.value) {
            return;
        }

        const internalTexture = inputTexture.getInternalTextureFromValue();
        if (this.disableBackBufferCopy || inputTexture.isBackBuffer || !internalTexture) {
            return;
        }

        this._copyTexture!.copy(internalTexture, null);
    }
}

RegisterClass("BABYLON.FrameGraphOutputBlock", FrameGraphOutputBlock);
