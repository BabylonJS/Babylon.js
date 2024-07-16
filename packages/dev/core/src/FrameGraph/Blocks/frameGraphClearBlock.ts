import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuildState } from "../frameGraphBuildState";
import type { ThinTexture } from "../../Materials/Textures/thinTexture";

/**
 * Block used to clear a texture
 */
export class FrameGraphClearBlock extends FrameGraphBlock {
    /**
     * Create a new FrameGraphClearBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("texture", FrameGraphBlockConnectionPointTypes.Texture);
        this.registerOutput("output", FrameGraphBlockConnectionPointTypes.BasedOnInput);

        this.texture.addAcceptedConnectionPointTypes(FrameGraphBlockConnectionPointTypes.TextureAll);
        this.output._typeConnectionSource = this.texture;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "FrameGraphClearBlock";
    }
    /**
     * Gets the texture input component
     */
    public get texture(): FrameGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the texture output component
     */
    public get output(): FrameGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);
        this.output.value = this.texture.value;
    }

    protected override _execute(): void {
        const inputTextureCP = this.texture.connectedPoint;
        if (!inputTextureCP || !inputTextureCP.value || !inputTextureCP.value.isAnyTexture) {
            return;
        }
        const texture = inputTextureCP.value.value as ThinTexture;
    }
}

RegisterClass("BABYLON.FrameGraphClearBlock", FrameGraphClearBlock);
