import { Nullable } from '../types';
import { Texture } from '../Materials/Textures/texture';
import { Engine } from '../Engines/engine';
import { VertexBuffer } from '../Meshes/buffer';
import { Viewport } from '../Maths/math';
import { Constants } from '../Engines/constants';
import { Observable } from '../Misc/observable';
import { Effect } from './effect';
import { DataBuffer } from '../Meshes/dataBuffer';

/**
 * Helper class to render one or more effects
 */
export class EffectRenderer {
    // Fullscreen quad buffers
    private static _Vertices = [1, 1, -1, 1, -1, -1, 1, -1];
    private static _Indices = [0, 1, 2, 0, 2, 3];
    private _vertexBuffers: {[key: string]: VertexBuffer};
    private _indexBuffer: DataBuffer;

    private _ringBufferIndex = 0;
    private _ringScreenBuffer: Nullable<Array<Texture>> = null;

    private _getNextFrameBuffer(incrementIndex = true) {
        if (!this._ringScreenBuffer) {
            this._ringScreenBuffer = [];
            for (var i = 0; i < 2; i++) {
                var internalTexture = this.engine.createRenderTargetTexture(
                    {
                        width: Math.floor(this.engine.getRenderWidth(true)),
                        height: Math.floor(this.engine.getRenderHeight(true)),
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
     */
    constructor(private engine: Engine) {
        this._vertexBuffers = {
            [VertexBuffer.PositionKind]: new VertexBuffer(engine, EffectRenderer._Vertices, VertexBuffer.PositionKind, false, false, 2),
        };
        this._indexBuffer = engine.createIndexBuffer(EffectRenderer._Indices);
    }

    /**
     * renders one or more effects to a specified texture
     * @param effectWrappers list of effects to renderer
     * @param outputTexture texture to draw to, if null it will render to the screen
     */
    render(effectWrappers: Array<EffectWrapper> | EffectWrapper, outputTexture: Nullable<Texture> = null) {
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
            }else {
                renderTo = outputTexture;
            }

            // Reset state
            this.engine.setViewport(new Viewport(0, 0, 1, 1));
            this.engine.enableEffect(effectWrapper.effect);

            // Bind buffers
            if (renderTo) {
                this.engine.bindFramebuffer(renderTo.getInternalTexture()!);
            }
            this.engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effectWrapper.effect);
            effectWrapper.onApplyObservable.notifyObservers({});

            // Render
            this.engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);
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
    constructor(creationOptions: {engine: Engine, fragmentShader: string, attributeNames: Array<string>, uniformNames: Array<string>, samplerNames: Array<string>}) {
        this.effect = new Effect({fragmentSource: creationOptions.fragmentShader, vertex: "postprocess"}, creationOptions.attributeNames, creationOptions.uniformNames, creationOptions.samplerNames, creationOptions.engine);
    }

     /**
     * Disposes of the effect wrapper
     */
    public dispose() {
        this.effect.dispose();
    }
}