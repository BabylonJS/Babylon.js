import { FrameGraphBlock } from "../frameGraphBlock";
import type { FrameGraphConnectionPoint } from "../frameGraphBlockConnectionPoint";
import { RegisterClass } from "../../Misc/typeStore";
import { FrameGraphBlockConnectionPointTypes } from "../Enums/frameGraphBlockConnectionPointTypes";
import type { FrameGraphBuildState } from "../frameGraphBuildState";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Color4 } from "core/Maths/math.color";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../Decorators/nodeDecorator";

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

    /** Gets or sets the clear color */
    @editableInPropertyPage("Color", PropertyTypeForEdition.Color4, "PROPERTIES")
    public color = new Color4(0.2, 0.2, 0.3, 1);

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
     * Gets the output component
     */
    public get output(): FrameGraphConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock(state: FrameGraphBuildState) {
        super._buildBlock(state);

        this._propagateInputValueToOutput(this.texture, this.output);
    }

    protected override _execute(engine: AbstractEngine): void {
        const inputTexture = this.texture.connectedPoint?.value;
        if (!inputTexture || !inputTexture.isAnyTexture) {
            return;
        }

        const isBackBuffer = inputTexture.isBackBuffer;
        const isBackBufferDepthStencilAttachment = inputTexture.isBackBufferDepthStencilAttachment;
        const isDepthStencilAttachment = inputTexture.type === FrameGraphBlockConnectionPointTypes.TextureDepthStencilAttachment || isBackBufferDepthStencilAttachment;

        if (!isBackBuffer && !isBackBufferDepthStencilAttachment) {
            const rtWrapper = inputTexture.getValueAsRenderTargetWrapper();
            if (!rtWrapper) {
                return;
            }
            engine.bindFramebuffer(rtWrapper);
        }

        engine.clear(this.color, !isDepthStencilAttachment, isDepthStencilAttachment, isDepthStencilAttachment);

        if (!isBackBuffer && !isBackBufferDepthStencilAttachment) {
            engine.restoreDefaultFramebuffer();
        }
    }
}

RegisterClass("BABYLON.FrameGraphClearBlock", FrameGraphClearBlock);
