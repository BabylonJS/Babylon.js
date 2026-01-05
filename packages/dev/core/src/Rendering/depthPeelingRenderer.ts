/**
 * Implementation based on https://medium.com/@shrekshao_71662/dual-depth-peeling-implementation-in-webgl-11baa061ba4b
 */
import { Constants } from "../Engines/constants";
import type { Scene } from "../scene";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import type { PrePassEffectConfiguration } from "./prePassEffectConfiguration";
import type { PrePassRenderer } from "./prePassRenderer";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Logger } from "../Misc/logger";
import { ThinDepthPeelingRenderer } from "./thinDepthPeelingRenderer";

class DepthPeelingEffectConfiguration implements PrePassEffectConfiguration {
    /**
     * Is this effect enabled
     */
    public enabled = true;

    /**
     * Name of the configuration
     */
    public name = "depthPeeling";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [Constants.PREPASS_COLOR_TEXTURE_TYPE];
}

/**
 * The depth peeling renderer that performs
 * Order independant transparency (OIT).
 * This should not be instanciated directly, as it is part of a scene component
 */
export class DepthPeelingRenderer extends ThinDepthPeelingRenderer {
    private _outputRT: RenderTargetTexture;

    private _prePassEffectConfiguration: DepthPeelingEffectConfiguration;

    private _blendBackTexture: InternalTexture;

    /**
     * Instanciates the depth peeling renderer
     * @param scene Scene to attach to
     * @param passCount Number of depth layers to peel
     * @returns The depth peeling renderer
     */
    constructor(scene: Scene, passCount: number = 5) {
        super(scene, passCount);

        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("Depth peeling for order independant transparency could not enable PrePass, aborting.");
            return;
        }

        this._prePassEffectConfiguration = new DepthPeelingEffectConfiguration();
        this._createTextures();
        this._createEffects("oitFinal", ["uFrontColor", "uBackColor"]);
    }

    protected override _createTextures() {
        super._createTextures();

        const size = this._getTextureSize();

        this._outputRT = new RenderTargetTexture("depthPeelingOutputRTT", size, this._scene, false);
    }

    // TODO : explore again MSAA with depth peeling when
    // we are able to fetch individual samples in a multisampled renderbuffer
    // public set samples(value: number) {
    //     for (let i = 0; i < 2; i++) {
    //         this._depthMrts[i].samples = value;
    //         this._colorMrts[i].samples = value;
    //     }
    //     this._scene.prePassRenderer!.samples = value;
    // }

    protected override _disposeTextures() {
        for (let i = 0; i < this._thinTextures.length; i++) {
            if (i === 6) {
                // Do not dispose the shared texture with the prepass
                continue;
            }
            this._thinTextures[i].dispose();
        }
        this._thinTextures = [];
        this._outputRT.dispose();

        super._disposeTextures();
    }

    private _updateTextures() {
        if (this._depthMrts[0].getSize().width !== this._engine.getRenderWidth() || this._depthMrts[0].getSize().height !== this._engine.getRenderHeight()) {
            this._disposeTextures();
            this._createTextures();
        }
        return this._updateTextureReferences();
    }

    private _updateTextureReferences() {
        const prePassRenderer = this._scene.prePassRenderer;

        if (!prePassRenderer) {
            return false;
        }

        // Retrieve opaque color texture
        const textureIndex = prePassRenderer.getIndex(Constants.PREPASS_COLOR_TEXTURE_TYPE);
        const prePassTexture = prePassRenderer.defaultRT.textures?.length ? prePassRenderer.defaultRT.textures[textureIndex].getInternalTexture() : null;

        if (!prePassTexture) {
            return false;
        }

        if (this._blendBackTexture !== prePassTexture) {
            this._blendBackTexture = prePassTexture;
            this._blendBackMrt.setInternalTexture(this._blendBackTexture, 0);

            if (this._thinTextures[6]) {
                this._thinTextures[6].dispose();
            }
            this._thinTextures[6] = new ThinTexture(this._blendBackTexture);

            prePassRenderer.defaultRT.renderTarget!.shareDepth(this._depthMrts[0].renderTarget!);
        }

        return true;
    }

    /**
     * Links to the prepass renderer
     * @param prePassRenderer The scene PrePassRenderer
     */
    public override setPrePassRenderer(prePassRenderer: PrePassRenderer) {
        prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
    }

    protected override _finalCompose(writeId: number) {
        const output = this._scene.prePassRenderer?.setCustomOutput(this._outputRT);
        if (output) {
            this._engine.bindFramebuffer(this._outputRT.renderTarget!);
        } else {
            this._engine.restoreDefaultFramebuffer();
        }

        this._engine.setAlphaMode(Constants.ALPHA_DISABLE);
        this._engine.applyStates();

        this._engine.enableEffect(this._finalEffectWrapper.drawWrapper);
        this._finalEffectWrapper.effect.setTexture("uFrontColor", this._thinTextures[writeId * 3 + 1]);
        this._finalEffectWrapper.effect.setTexture("uBackColor", this._thinTextures[6]);
        this._effectRenderer.render(this._finalEffectWrapper);
    }

    /**
     * Checks if the depth peeling renderer is ready to render transparent meshes
     * @returns true if the depth peeling renderer is ready to render the transparent meshes
     */
    public override isReady() {
        return super.isReady() && this._updateTextures();
    }

    protected override _beforeRender() {
        (this._scene.prePassRenderer! as any)._enabled = false;
    }

    protected override _afterRender() {
        (this._scene.prePassRenderer! as any)._enabled = true;
    }

    protected override _noTransparentMeshes() {
        this._engine.bindFramebuffer(this._colorMrts[1].renderTarget!);
        this._engine.bindAttachments(this._layoutCache[1]);
        this._engine.clear(this._colorCache[2], true, false, false);
        this._engine.unBindFramebuffer(this._colorMrts[1].renderTarget!);

        this._finalCompose(1);
    }
}
