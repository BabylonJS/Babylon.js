import { Nullable } from '../types';
import { Texture } from '../Materials/Textures/texture';
import { ThinEngine } from '../Engines/thinEngine';
import { VertexBuffer } from '../Meshes/buffer';
import { Viewport } from '../Maths/math.viewport';
import { Constants } from '../Engines/constants';
import { Observable } from '../Misc/observable';
import { Effect } from './effect';
import { DataBuffer } from '../Meshes/dataBuffer';

import "../Engines/Extensions/engine.renderTarget";

// Prevents ES6 Crash if not imported.
import "../Shaders/postprocess.vertex";

/**
 * Effect Render Options
 */
export interface IEffectRendererOptions {
    /**
     * Defines the vertices positions.
     */
    positions?: number[];
    /**
     * Defines the indices.
     */
    indices?: number[];
}

/**
 * Helper class to render one or more effects
 */
export class EffectRenderer {
    // Fullscreen quad buffers by default.
    private static _DefaultOptions: IEffectRendererOptions = {
        positions: [1, 1, -1, 1, -1, -1, 1, -1],
        indices: [0, 1, 2, 0, 2, 3]
    };

    private _vertexBuffers: {[key: string]: VertexBuffer};
    private _indexBuffer: DataBuffer;

    private _ringBufferIndex = 0;
    private _ringScreenBuffer: Nullable<Array<Texture>> = null;
    private _fullscreenViewport = new Viewport(0, 0, 1, 1);

    private _getNextFrameBuffer(incrementIndex = true) {
        if (!this._ringScreenBuffer) {
            this._ringScreenBuffer = [];
            for (var i = 0; i < 2; i++) {
                var internalTexture = this.engine.createRenderTargetTexture(
                    {
                        width: this.engine.getRenderWidth(true),
                        height: this.engine.getRenderHeight(true),
                    },
                    {
                        generateDepthBuffer: false,
                        generateStencilBuffer: false,
                        generateMipMaps: false,
                        samplingMode: Constants.TEXTURE_NEAREST_NEAREST,
                    },
                );
                var texture = new Texture("", null);
                texture._texture = internalTexture;
                this._ringScreenBuffer.push(texture);
            }
        }
        var ret = this._ringScreenBuffer[this._ringBufferIndex];
        if (incrementIndex) {
            this._ringBufferIndex = (this._ringBufferIndex + 1) % 2;
        }
        return ret;
    }

    /**
     * Creates an effect renderer
     * @param engine the engine to use for rendering
     * @param options defines the options of the effect renderer
     */
    constructor(private engine: ThinEngine, options: IEffectRendererOptions = EffectRenderer._DefaultOptions) {
        options = {
            ...EffectRenderer._DefaultOptions,
            ...options,
        };

        this._vertexBuffers = {
            [VertexBuffer.PositionKind]: new VertexBuffer(engine, options.positions!, VertexBuffer.PositionKind, false, false, 2),
        };
        this._indexBuffer = engine.createIndexBuffer(options.indices!);

        // No need here for full screen render.
        engine.depthCullingState.depthTest = false;
        engine.stencilState.stencilTest = false;
    }

    /**
     * Sets the current viewport in normalized coordinates 0-1
     * @param viewport Defines the viewport to set (defaults to 0 0 1 1)
     */
    public setViewport(viewport = this._fullscreenViewport): void {
        this.engine.setViewport(viewport);
    }

    /**
     * Binds the embedded attributes buffer to the effect.
     * @param effect Defines the effect to bind the attributes for
     */
    public bindBuffers(effect: Effect): void {
        this.engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
    }

    /**
     * Sets the current effect wrapper to use during draw.
     * The effect needs to be ready before calling this api.
     * This also sets the default full screen position attribute.
     * @param effectWrapper Defines the effect to draw with
     */
    public applyEffectWrapper(effectWrapper: EffectWrapper): void {
        this.engine.enableEffect(effectWrapper.effect);
        this.bindBuffers(effectWrapper.effect);
        effectWrapper.onApplyObservable.notifyObservers({});
    }

    /**
     * Draws a full screen quad.
     */
    public draw(): void {
        this.engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);
    }

    /**
     * renders one or more effects to a specified texture
     * @param effectWrappers list of effects to renderer
     * @param outputTexture texture to draw to, if null it will render to the screen
     */
    public render(effectWrappers: Array<EffectWrapper> | EffectWrapper, outputTexture: Nullable<Texture> = null) {
        if (!Array.isArray(effectWrappers)) {
            effectWrappers = [effectWrappers];
        }

        // Ensure all effects are ready
        for (var wrapper of effectWrappers) {
            if (!wrapper.effect.isReady()) {
                return;
            }
        }

        effectWrappers.forEach((effectWrapper, i) => {
            var renderTo = outputTexture;

            // for any next effect make it's input the output of the previous effect
            if (i !== 0) {
                effectWrapper.effect.onBindObservable.addOnce(() => {
                    effectWrapper.effect.setTexture("textureSampler", this._getNextFrameBuffer(false));
                });
            }

            // Set the output to the next screenbuffer
            if ((effectWrappers as Array<EffectWrapper>).length > 1 && i != (effectWrappers as Array<EffectWrapper>).length - 1) {
                renderTo = this._getNextFrameBuffer();
            } else {
                renderTo = outputTexture;
            }

            // Reset state
            this.setViewport();

            if (renderTo) {
                this.engine.bindFramebuffer(renderTo.getInternalTexture()!);
            }

            this.applyEffectWrapper(effectWrapper);

            this.draw();

            if (renderTo) {
                this.engine.unBindFramebuffer(renderTo.getInternalTexture()!);
            }
        });
    }

    /**
     * Disposes of the effect renderer
     */
    dispose() {
        if (this._ringScreenBuffer) {
            this._ringScreenBuffer.forEach((b) => {
                b.dispose();
            });
            this._ringScreenBuffer = null;
        }

        var vertexBuffer = this._vertexBuffers[VertexBuffer.PositionKind];
        if (vertexBuffer) {
            vertexBuffer.dispose();
            delete this._vertexBuffers[VertexBuffer.PositionKind];
        }

        if (this._indexBuffer) {
            this.engine._releaseBuffer(this._indexBuffer);
        }
    }
}

/**
 * Options to create an EffectWrapper
 */
interface EffectWrapperCreationOptions {
    /**
     * Engine to use to create the effect
     */
    engine: ThinEngine;
    /**
     * Fragment shader for the effect
     */
    fragmentShader: string;
    /**
     * Vertex shader for the effect
     */
    vertexShader?: string;
    /**
     * Attributes to use in the shader
     */
    attributeNames?: Array<string>;
    /**
     * Uniforms to use in the shader
     */
    uniformNames?: Array<string>;
    /**
     * Texture sampler names to use in the shader
     */
    samplerNames?: Array<string>;
    /**
     * The friendly name of the effect displayed in Spector.
     */
    name?: string;
}

/**
 * Wraps an effect to be used for rendering
 */
export class EffectWrapper {
    /**
     * Event that is fired right before the effect is drawn (should be used to update uniforms)
     */
    public onApplyObservable = new Observable<{}>();
    /**
     * The underlying effect
     */
    public effect: Effect;

    /**
     * Creates an effect to be renderer
     * @param creationOptions options to create the effect
     */
    constructor(creationOptions: EffectWrapperCreationOptions) {
        let effectCreationOptions: any;
        const uniformNames = creationOptions.uniformNames || [];
        if (creationOptions.vertexShader) {
            effectCreationOptions = {
                fragmentSource: creationOptions.fragmentShader,
                vertexSource: creationOptions.vertexShader,
                spectorName: creationOptions.name || "effectWrapper"
            };
        }
        else {
            // Default scale to use in post process vertex shader.
            uniformNames.push("scale");

            effectCreationOptions = {
                fragmentSource: creationOptions.fragmentShader,
                vertex: "postprocess",
                spectorName: creationOptions.name || "effectWrapper"
            };

            // Sets the default scale to identity for the post process vertex shader.
            this.onApplyObservable.add(() => {
                this.effect.setFloat2("scale", 1, 1);
            });
        }

        this.effect = new Effect(effectCreationOptions,
            creationOptions.attributeNames || ["position"],
            uniformNames,
            creationOptions.samplerNames,
            creationOptions.engine);
    }

    /**
    * Disposes of the effect wrapper
    */
    public dispose() {
        this.effect.dispose();
    }
}