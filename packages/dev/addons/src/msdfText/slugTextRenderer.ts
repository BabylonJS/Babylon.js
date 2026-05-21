import type { VertexBuffer } from "core/Buffers/buffer";
import { Buffer } from "core/Buffers/buffer";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import type { ThinEngine } from "core/Engines/thinEngine";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IDisposable, Scene } from "core/scene";
import type { Nullable } from "core/types";
import { ThinMatrix } from "core/Maths/ThinMaths/thinMath.matrix";
import { CopyMatrixToRef, MultiplyMatricesToRef, IdentityMatrixToRef } from "core/Maths/ThinMaths/thinMath.matrix.functions";
import type { IColor4Like, IMatrixLike } from "core/Maths/math.like";
import { DataBuffer } from "core/Buffers/dataBuffer";
import type { SlugFontAsset } from "./slug/slugFontAsset";
import { prepareText } from "./slug/slug";
import type { SlugTextData, SlugLayoutOptions } from "./slug/slug";

// Side-effect: augments AbstractEngine with createRawTexture
import "core/Engines/Extensions/engine.rawTexture";
import "core/Engines/WebGPU/Extensions/engine.rawTexture";

const FLOATS_PER_VERTEX = 20;

/**
 * Class used to render text using the Slug GPU font rendering algorithm.
 *
 * Unlike MSDF which requires pre-baked atlas textures, Slug renders text directly
 * from the font's Bézier curve data on the GPU, providing resolution-independent
 * text at any zoom level.
 *
 * Based on Eric Lengyel's Slug algorithm.
 *
 * @example
 * ```typescript
 * // Load font from TTF file
 * const font = await SlugFontAsset.CreateAsync("/fonts/MyFont.ttf");
 *
 * // Create renderer
 * const renderer = await SlugTextRenderer.CreateAsync(font, engine, scene);
 *
 * // Set text
 * renderer.setText("Hello, World!", 48);
 *
 * // In render loop
 * renderer.render(camera.getViewMatrix(), camera.getProjectionMatrix());
 * ```
 */
export class SlugTextRenderer implements IDisposable {
    private _engine: AbstractEngine;
    private _scene: Scene;
    private _shaderLanguage: ShaderLanguage;
    private _font: SlugFontAsset;
    private _drawWrapper: DrawWrapper;
    private _vertexArrayObject: Nullable<WebGLVertexArrayObject> = null;
    private _useVAO: boolean;

    // GPU resources
    private _vertexBuffer: Nullable<Buffer> = null;
    private _indexBuffer: Nullable<DataBuffer> = null;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _curveTexture: Nullable<RawTexture> = null;
    private _bandTexture: Nullable<RawTexture> = null;

    // State
    private _textData: Nullable<SlugTextData> = null;
    private _indexCount = 0;
    private _isDirty = false;

    // Matrices
    private _mvpMatrix = new ThinMatrix();
    private _tempMatrix = new ThinMatrix();
    private _worldMatrix = new ThinMatrix();

    /**
     * Gets or sets the text color. When `outlineWidth` is zero, this is the solid fill
     * color. When `outlineWidth > 0`, this is the rim color (the glyph interior is
     * hollowed out — see `outlineWidth`).
     */
    public color: IColor4Like = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    /**
     * Outline stroke width in pixels. When zero (default), glyphs render as a solid fill
     * in `color`. When greater than zero, the fragment shader switches to outline mode:
     * for each fragment it re-evaluates Slug's analytic coverage at 4 cardinal offsets
     * `outlineWidth` pixels away in em-space, and keeps the fragment only if at least
     * one of those neighbours falls outside the glyph (i.e. the fragment is within
     * `outlineWidth` pixels of a glyph boundary in some cardinal direction).
     *
     * Result: a uniform `outlineWidth`-wide rim of `color` traces the entire glyph
     * silhouette, with a transparent interior. Strokes thinner than `2 * outlineWidth`
     * never reach a hollow region and render as a solid `color` fill, which matches the
     * intuitive behaviour of a vector-graphics stroke (an outline can't be thinner than
     * half the local stroke width).
     */
    public outlineWidth = 0;

    /**
     * When true and `outlineWidth > 0`, the outline rim is rendered with a screen-space
     * stipple (small square dots on a regular grid) instead of a solid stroke. Useful
     * for "marching ants" / selection-style outlines. Ignored when `outlineWidth = 0`.
     */
    public stipple = false;

    /**
     * Gets or sets the world matrix applied to the text.
     */
    public get worldMatrix(): IMatrixLike {
        return this._worldMatrix;
    }

    public set worldMatrix(value: IMatrixLike) {
        CopyMatrixToRef(value, this._worldMatrix);
    }

    /**
     * Gets or sets if the text renderer should ignore the depth buffer.
     * Default is false.
     */
    public ignoreDepthBuffer = false;

    /**
     * Gets the font size used for the current text.
     */
    public fontSize = 0;

    /**
     * Gets the current text string.
     */
    public text = "";

    private constructor(engine: AbstractEngine, scene: Scene, shaderLanguage: ShaderLanguage, font: SlugFontAsset) {
        this._engine = engine;
        this._scene = scene;
        this._shaderLanguage = shaderLanguage;
        this._font = font;
        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;
        this._drawWrapper = new DrawWrapper(engine);
        IdentityMatrixToRef(this._worldMatrix);
    }

    /** @internal */
    public _setShaders(vertex: string, fragment: string) {
        this._drawWrapper?.dispose();
        this._drawWrapper = new DrawWrapper(this._engine);

        this._drawWrapper.effect = this._engine.createEffect(
            {
                vertexSource: vertex,
                fragmentSource: fragment,
            },
            ["slugPos", "slugTex", "slugMet", "slugBnd", "slugCol"],
            ["slugMatrix", "slugViewport", "slugColor", "slugOutline"],
            ["curveData", "bandData"],
            "",
            undefined,
            undefined,
            (effect, errors) => {
                // eslint-disable-next-line no-console
                console.error("Slug shader compilation error:", errors);
            },
            undefined,
            this._shaderLanguage
        );

        this._drawWrapper.effect._refCount++;
    }

    /**
     * Set the text string to render.
     * This processes the text through the Slug pipeline: extracts curves,
     * builds spatial bands, and prepares GPU-ready vertex/texture data.
     * @param text - The text string to render
     * @param fontSize - Desired font size in pixels
     * @param options - Layout options (maxWidth, lineHeight, textAlign, etc.)
     */
    public setText(text: string, fontSize: number, options?: SlugLayoutOptions): void {
        this.text = text;
        this.fontSize = fontSize;

        if (!text) {
            this._textData = null;
            this._indexCount = 0;
            return;
        }

        this._textData = prepareText(this._font.font, text, fontSize, options);
        this._indexCount = this._textData.indices.length;
        this._isDirty = true;
    }

    /**
     * Set pre-built text data directly, bypassing the text processing pipeline.
     * Use with mergeSlugTextData() to render multiple text blocks in one draw call.
     * @param data - Pre-built SlugTextData (e.g. from mergeSlugTextData)
     */
    public setTextData(data: SlugTextData): void {
        this._textData = data;
        this._indexCount = data.indices.length;
        this._isDirty = true;
    }

    private _uploadGPUData(): void {
        if (!this._textData || !this._isDirty) {
            return;
        }
        this._isDirty = false;

        const data = this._textData;

        // Clean up old resources
        this._disposeGPUResources();

        // Vertex buffer (interleaved, 80 bytes per vertex)
        this._vertexBuffer = new Buffer(this._engine, data.vertices, false, FLOATS_PER_VERTEX);
        this._vertexBuffers["slugPos"] = this._vertexBuffer.createVertexBuffer("slugPos", 0, 4, FLOATS_PER_VERTEX);
        this._vertexBuffers["slugTex"] = this._vertexBuffer.createVertexBuffer("slugTex", 4, 4, FLOATS_PER_VERTEX);
        this._vertexBuffers["slugMet"] = this._vertexBuffer.createVertexBuffer("slugMet", 8, 4, FLOATS_PER_VERTEX);
        this._vertexBuffers["slugBnd"] = this._vertexBuffer.createVertexBuffer("slugBnd", 12, 4, FLOATS_PER_VERTEX);
        this._vertexBuffers["slugCol"] = this._vertexBuffer.createVertexBuffer("slugCol", 16, 4, FLOATS_PER_VERTEX);

        // Index buffer
        const engine = this._engine as ThinEngine;
        this._indexBuffer = engine.createIndexBuffer(data.indices);

        // Curve texture (RGBA32Float)
        this._curveTexture = RawTexture.CreateRGBATexture(
            data.curveTexData,
            4096,
            data.curveTexHeight,
            this._scene,
            false, // no mipmaps
            false, // don't invert Y
            Constants.TEXTURE_NEAREST_NEAREST,
            Constants.TEXTURETYPE_FLOAT
        );

        // Band texture (RGBA32Float — integers stored as floats)
        this._bandTexture = RawTexture.CreateRGBATexture(
            data.bandTexData,
            4096,
            data.bandTexHeight,
            this._scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_NEAREST,
            Constants.TEXTURETYPE_FLOAT
        );

        // Reset VAO so it gets recreated with new buffers
        if (this._vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }
    }

    /**
     * Render the text with the given view and projection matrices.
     * @param viewMatrix - The camera view matrix
     * @param projectionMatrix - The camera projection matrix
     */
    public render(viewMatrix: IMatrixLike, projectionMatrix: IMatrixLike): void {
        if (!this._textData || this._indexCount === 0) {
            return;
        }

        const effect = this._drawWrapper.effect;
        if (!effect || !effect.isReady()) {
            return;
        }

        // Upload GPU data if dirty
        this._uploadGPUData();

        if (!this._curveTexture || !this._bandTexture) {
            return;
        }

        const engine = this._engine;

        // Compute MVP matrix: projection * view * world
        MultiplyMatricesToRef(this._worldMatrix, viewMatrix, this._tempMatrix);
        MultiplyMatricesToRef(this._tempMatrix, projectionMatrix, this._mvpMatrix);

        // Set state
        engine.setState(false);
        engine.enableEffect(this._drawWrapper);

        if (this.ignoreDepthBuffer) {
            engine.setDepthBuffer(false);
        }

        // Uniforms common to all passes
        effect.setMatrix("slugMatrix", this._mvpMatrix);
        const vpWidth = engine.getRenderWidth();
        const vpHeight = engine.getRenderHeight();
        effect.setFloat4("slugViewport", vpWidth, vpHeight, 0, 0);

        // Textures
        effect.setTexture("curveData", this._curveTexture);
        effect.setTexture("bandData", this._bandTexture);

        // Bind buffers
        if (this._useVAO) {
            if (!this._vertexArrayObject) {
                this._vertexArrayObject = (engine as ThinEngine).recordVertexArrayObject(this._vertexBuffers, this._indexBuffer, effect);
            }
            (engine as ThinEngine).bindVertexArrayObject(this._vertexArrayObject, this._indexBuffer);
        } else {
            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, effect);
        }

        engine.setAlphaMode(Constants.ALPHA_COMBINE);

        // Single draw call. Fragment shader applies outline carving when slugOutline.x > 0.
        const outlineWidth = Math.max(0, this.outlineWidth);
        const stippleFlag = outlineWidth > 0 && this.stipple ? 1 : 0;
        effect.setFloat4("slugColor", this.color.r, this.color.g, this.color.b, this.color.a);
        effect.setFloat4("slugOutline", outlineWidth, stippleFlag, 0, 0);
        engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, this._indexCount);

        engine.setAlphaMode(Constants.ALPHA_DISABLE);

        if (this.ignoreDepthBuffer) {
            engine.setDepthBuffer(true);
        }
    }

    private _disposeGPUResources(): void {
        if (this._vertexBuffer) {
            this._vertexBuffer.dispose();
            this._vertexBuffer = null;
        }
        if (this._indexBuffer) {
            this._engine._releaseBuffer(this._indexBuffer);
            this._indexBuffer = null;
        }
        if (this._curveTexture) {
            this._curveTexture.dispose();
            this._curveTexture = null;
        }
        if (this._bandTexture) {
            this._bandTexture.dispose();
            this._bandTexture = null;
        }
        this._vertexBuffers = {};
    }

    /**
     * Release all resources held by this renderer.
     */
    public dispose(): void {
        this._disposeGPUResources();

        if (this._vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(this._vertexArrayObject);
            this._vertexArrayObject = null;
        }

        if (this._drawWrapper) {
            this._drawWrapper.dispose();
        }
    }

    /**
     * Creates a new SlugTextRenderer instance asynchronously.
     * Loads the appropriate shaders for the current rendering backend (WebGPU or WebGL2).
     * @param font - The SlugFontAsset to use for rendering
     * @param engine - The Babylon.js engine instance
     * @param scene - The Babylon.js scene (needed for texture creation)
     * @returns A promise that resolves to the created SlugTextRenderer
     */
    public static async CreateAsync(font: SlugFontAsset, engine: AbstractEngine, scene: Scene): Promise<SlugTextRenderer> {
        let shaderLanguage = ShaderLanguage.GLSL;
        let vertex: string;
        let fragment: string;

        if (engine.isWebGPU) {
            shaderLanguage = ShaderLanguage.WGSL;
            vertex = (await import("./shadersWGSL/slug.vertex")).slugVertexShaderWGSL.shader;
            fragment = (await import("./shadersWGSL/slug.fragment")).slugPixelShaderWGSL.shader;
        } else {
            vertex = (await import("./shaders/slug.vertex")).slugVertexShader.shader;
            fragment = (await import("./shaders/slug.fragment")).slugPixelShader.shader;
        }

        const renderer = new SlugTextRenderer(engine, scene, shaderLanguage, font);
        renderer._setShaders(vertex, fragment);

        return renderer;
    }
}
