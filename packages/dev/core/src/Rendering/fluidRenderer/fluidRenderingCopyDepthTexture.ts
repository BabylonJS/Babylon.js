import { VertexBuffer } from "core/Buffers/buffer";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import { Constants } from "core/Engines/constants";
import type { Engine } from "core/Engines/engine";
import type { RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { EffectWrapper } from "core/Materials/effectRenderer";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";

/** @internal */
export class FluidRenderingCopyDepthTexture {
    private _engine: Engine;
    private _indexBuffer: Nullable<DataBuffer>;
    private _vertexBuffers: {
        [key: string]: Nullable<VertexBuffer>;
    } = {};
    private _depthRTWrapper: RenderTargetWrapper;
    private _copyEffectWrapper: EffectWrapper;

    public get depthRTWrapper() {
        return this._depthRTWrapper;
    }

    constructor(engine: Engine, width: number, height: number) {
        this._engine = engine;

        this._depthRTWrapper = this._engine.createRenderTargetTexture(
            { width, height },
            {
                generateMipMaps: false,
                type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                format: Constants.TEXTUREFORMAT_R,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                generateDepthBuffer: true,
                generateStencilBuffer: false,
                samples: 1,
                noColorTarget: true,
            }
        );
        this._depthRTWrapper.createDepthStencilTexture(0, false, false, 1);

        this._copyEffectWrapper = new EffectWrapper({
            engine: this._engine,
            useShaderStore: true,
            vertexShader: "fluidRenderingPassDepth",
            fragmentShader: "fluidRenderingPassDepth",
            attributeNames: ["position"],
            uniformNames: [],
            samplerNames: ["textureDepth"],
        });

        // VBO
        const vertices = [];
        vertices.push(1, 1);
        vertices.push(-1, 1);
        vertices.push(-1, -1);
        vertices.push(1, -1);

        this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(this._engine, vertices, VertexBuffer.PositionKind, false, false, 2);

        // Indices
        const indices = [];
        indices.push(0);
        indices.push(1);
        indices.push(2);

        indices.push(0);
        indices.push(2);
        indices.push(3);

        this._indexBuffer = this._engine.createIndexBuffer(indices);
    }

    public copy(source: InternalTexture): boolean {
        const effect = this._copyEffectWrapper.effect;

        if (!effect.isReady()) {
            return false;
        }

        this._engine.bindFramebuffer(this._depthRTWrapper!);

        this._engine.enableEffect(this._copyEffectWrapper._drawWrapper);

        const engineDepthFunc = this._engine.getDepthFunction();

        this._engine.setState(false);
        this._engine.setDepthBuffer(true);
        this._engine.setDepthWrite(true);
        this._engine.setDepthFunction(Constants.ALWAYS);
        this._engine.setColorWrite(false);

        this._engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);

        effect._bindTexture("textureDepth", source);

        this._engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 6);

        this._engine.setDepthFunction(engineDepthFunc!);
        this._engine.setColorWrite(true);

        this._engine.unBindFramebuffer(this._depthRTWrapper!);

        return true;
    }

    public dispose() {
        this._depthRTWrapper.dispose();

        this._vertexBuffers[VertexBuffer.PositionKind]?.dispose();
        this._vertexBuffers = {};

        if (this._indexBuffer) {
            this._engine._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
    }
}
