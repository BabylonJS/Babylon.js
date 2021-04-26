import { Control } from "../../2D/controls/control";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Nullable } from "babylonjs/types";
import { Control3D } from "./control3D";
import { Texture } from "babylonjs/Materials/Textures/texture";

/**
 * The base class for controls that display content
 */
export class ContentDisplay3D extends Control3D {
    private _content: Control;
    private _facadeTexture: Nullable<AdvancedDynamicTexture>;
    protected _contentResolution = 512;
    protected _contentScaleRatio = 2;

    /**
     * Gets or sets the GUI 2D content used to display the button's facade
     */
    public get content(): Control {
        return this._content;
    }

    public set content(value: Control) {
        this._content = value;

        if (!this._host || !this._host.utilityLayer) {
            return;
        }

        if (!this._facadeTexture) {
            this._facadeTexture = new AdvancedDynamicTexture(
                "Facade",
                this._contentResolution,
                this._contentResolution,
                this._host.utilityLayer.utilityLayerScene,
                true,
                Texture.TRILINEAR_SAMPLINGMODE
            );
            this._facadeTexture.rootContainer.scaleX = this._contentScaleRatio;
            this._facadeTexture.rootContainer.scaleY = this._contentScaleRatio;
            this._facadeTexture.premulAlpha = true;
        } else {
            this._facadeTexture.rootContainer.clearControls();
        }

        this._facadeTexture.addControl(value);

        this._applyFacade(this._facadeTexture);
    }

    /**
     * Gets or sets the texture resolution used to render content (512 by default)
     */
    public get contentResolution(): number {
        return this._contentResolution;
    }

    public set contentResolution(value: number) {
        if (this._contentResolution === value) {
            return;
        }

        this._contentResolution = value;
        this._resetContent();
    }

    protected _disposeFacadeTexture() {
        if (this._facadeTexture) {
            this._facadeTexture.dispose();
            this._facadeTexture = null;
        }
    }

    protected _resetContent() {
        this._disposeFacadeTexture();
        this.content = this._content;
    }

    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {}
}
