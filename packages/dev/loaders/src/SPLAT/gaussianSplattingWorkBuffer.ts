import { MultiRenderTarget } from "core/Materials/Textures/multiRenderTarget";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "core/Engines/constants";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import { Color4 } from "core/Maths/math.color";
import { Vector3, Vector4 } from "core/Maths/math.vector";
import { type Texture } from "core/Materials/Textures/texture";
import { type Scene } from "core/scene";
import { type ISogTexturePack } from "./splatDefs";
import {
    GaussianSplattingWorkBufferVertexShaderGLSL,
    GaussianSplattingWorkBufferFragmentShaderGLSL,
    GaussianSplattingWorkBufferVertexShaderWGSL,
    GaussianSplattingWorkBufferFragmentShaderWGSL,
} from "./gaussianSplattingWorkBufferShaders";

/**
 * A unified, GPU-decoded Gaussian Splatting work buffer.
 *
 * Holds a square MRT texture set (centers / covA / covB / colors) sized to a fixed splat capacity
 * (PlayCanvas-style: `ceil(sqrt(capacity))`). Each streamed SOG file is decoded directly on the GPU
 * (no CPU readback) into its allocated pixel range. The decoded textures are consumed unchanged by the
 * standard (non-SOG) Gaussian Splatting draw path.
 *
 * @experimental
 */
export class GaussianSplattingWorkBuffer {
    private readonly _scene: Scene;
    private readonly _mrt: MultiRenderTarget;
    private readonly _textureSize: number;
    private readonly _shaderLanguage: ShaderLanguage;
    private readonly _material: ShaderMaterial;
    private readonly _quad: Mesh;
    private _disposed = false;

    /**
     * Square edge length (in pixels) of the work-buffer textures.
     */
    public get textureSize(): number {
        return this._textureSize;
    }

    /**
     * The decoded work-buffer textures: [centers, covA, covB, colors].
     */
    public get textures(): Texture[] {
        return this._mrt.textures;
    }

    /**
     * Creates a work buffer sized to hold `capacity` splats.
     * @param scene hosting scene
     * @param capacity total number of splats the work buffer must address
     */
    constructor(scene: Scene, capacity: number) {
        this._scene = scene;
        this._shaderLanguage = scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
        this._textureSize = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, capacity))));

        this._mrt = new MultiRenderTarget(
            "gsWorkBuffer",
            { width: this._textureSize, height: this._textureSize },
            4,
            scene,
            {
                types: [Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_FLOAT, Constants.TEXTURETYPE_UNSIGNED_BYTE],
                samplingModes: [
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                ],
                formats: [Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTUREFORMAT_RGBA],
                generateDepthBuffer: false,
                generateDepthTexture: false,
                generateMipMaps: false,
            },
            ["gsWorkCenters", "gsWorkCovA", "gsWorkCovB", "gsWorkColors"]
        );
        this._mrt.clearColor = new Color4(0, 0, 0, 0);
        this._mrt.renderList = [];
        // Take over clearing (no-op) so each decode accumulates into the buffer instead of wiping
        // previously-decoded files. Undecoded regions are never sampled (only active intervals render).
        this._mrt.onClearObservable.add(() => {});

        // One persistent decode material + fullscreen-triangle quad, reused (with per-file uniforms)
        // for every decode so the shader is compiled only once.
        this._material = this._createMaterial();
        this._quad = this._createQuad();
        this._quad.material = this._material;
    }

    /**
     * Decodes one SOG file into the work buffer at the given splat offset (accumulating; previously
     * decoded files are preserved). Resolves once the GPU decode has been issued. The caller may
     * dispose the source pack textures after this resolves.
     * @param pack the SOG texture pack (GPU source textures + per-file decode parameters)
     * @param offset first splat index (pixel offset) for this file in the work buffer
     */
    public async decodeAsync(pack: ISogTexturePack, offset: number): Promise<void> {
        if (this._disposed) {
            return;
        }
        this._applyPack(pack, offset);
        // Render the decode pass at the start of a frame (the safe point for custom render targets),
        // once the shader is compiled — never re-entrantly from a promise/observable continuation.
        await new Promise<void>((resolve) => {
            const attempt = () => {
                if (this._disposed) {
                    resolve();
                    return;
                }
                if (!this._material.isReady(this._quad)) {
                    this._scene.onBeforeRenderObservable.addOnce(attempt);
                    return;
                }
                this._mrt.renderList = [this._quad];
                this._mrt.render();
                resolve();
            };
            this._scene.onBeforeRenderObservable.addOnce(attempt);
        });
    }

    /**
     * Disposes the work buffer and its decode resources.
     */
    public dispose(): void {
        this._disposed = true;
        this._quad.dispose();
        this._material.dispose(true, false);
        this._mrt.dispose();
    }

    private _createQuad(): Mesh {
        const quad = new Mesh("gsWorkBufferQuad", this._scene);
        const vertexData = new VertexData();
        // Fullscreen triangle in clip space (the vertex shader passes positions straight through).
        vertexData.positions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
        vertexData.indices = [0, 1, 2];
        vertexData.applyToMesh(quad);
        // Render only inside the work-buffer MRT, never in the main scene pass.
        this._scene.removeMesh(quad);
        return quad;
    }

    private _createMaterial(): ShaderMaterial {
        const isWGSL = this._shaderLanguage === ShaderLanguage.WGSL;
        const material = new ShaderMaterial(
            "gsSogDecode",
            this._scene,
            {
                vertexSource: isWGSL ? GaussianSplattingWorkBufferVertexShaderWGSL : GaussianSplattingWorkBufferVertexShaderGLSL,
                fragmentSource: isWGSL ? GaussianSplattingWorkBufferFragmentShaderWGSL : GaussianSplattingWorkBufferFragmentShaderGLSL,
            },
            {
                attributes: ["position"],
                uniforms: ["sogMeansMin", "sogMeansMax", "sogScalesMin", "sogScalesMax", "sogSh0Min", "sogSh0Max", "uVersion", "uOffset", "uCount", "uDestWidth", "uSrcWidth"],
                samplers: ["sogMeansLTex", "sogMeansUTex", "sogScalesTex", "sogQuatsTex", "sogSh0Tex", "sogCodebookTex"],
                shaderLanguage: this._shaderLanguage,
            }
        );
        material.backFaceCulling = false;
        material.disableDepthWrite = true;
        return material;
    }

    private _applyPack(pack: ISogTexturePack, offset: number): void {
        const material = this._material;
        const srcWidth = (pack.meansTextureL as Texture).getSize().width;

        material.setTexture("sogMeansLTex", pack.meansTextureL);
        material.setTexture("sogMeansUTex", pack.meansTextureU);
        material.setTexture("sogScalesTex", pack.scalesTexture);
        material.setTexture("sogQuatsTex", pack.quatsTexture);
        material.setTexture("sogSh0Tex", pack.sh0Texture);
        // Codebook only used for v2; bind a harmless placeholder otherwise so the sampler is always set.
        material.setTexture("sogCodebookTex", pack.codebookTexture ?? pack.sh0Texture);

        material.setVector3("sogMeansMin", new Vector3(pack.meansMin[0], pack.meansMin[1], pack.meansMin[2]));
        material.setVector3("sogMeansMax", new Vector3(pack.meansMax[0], pack.meansMax[1], pack.meansMax[2]));
        const sMin = pack.scalesMin ?? [0, 0, 0];
        const sMax = pack.scalesMax ?? [0, 0, 0];
        material.setVector3("sogScalesMin", new Vector3(sMin[0], sMin[1], sMin[2]));
        material.setVector3("sogScalesMax", new Vector3(sMax[0], sMax[1], sMax[2]));
        const c0Min = pack.sh0Min ?? [0, 0, 0, 0];
        const c0Max = pack.sh0Max ?? [0, 0, 0, 0];
        material.setVector4("sogSh0Min", new Vector4(c0Min[0], c0Min[1], c0Min[2], c0Min[3]));
        material.setVector4("sogSh0Max", new Vector4(c0Max[0], c0Max[1], c0Max[2], c0Max[3]));

        material.setInt("uVersion", pack.version);
        material.setInt("uOffset", offset);
        material.setInt("uCount", pack.splatCount);
        material.setInt("uDestWidth", this._textureSize);
        material.setInt("uSrcWidth", srcWidth);
    }
}
