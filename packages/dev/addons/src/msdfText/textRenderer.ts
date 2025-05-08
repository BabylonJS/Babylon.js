import type { VertexBuffer } from "core/Buffers/buffer";
import { Buffer } from "core/Buffers/buffer";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { Constants } from "core/Engines/constants";
import type { ThinEngine } from "core/Engines/thinEngine";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IDisposable } from "core/scene";
import type { Nullable } from "core/types";
import { SdfTextParagraph } from "./sdf/paragraph";
import type { FontAsset } from "./fontAsset";
import type { ParagraphOptions } from "./paragraphOptions";
import { Matrix } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";

/**
 * Class used to render text using MSDF (Multi-channel Signed Distance Field) technique
 * Thanks a lot to the work of Bhushan_Wagh and zb_sj for their amazing work on MSDF for Babylon.js
 * #6RLCWP#16
 */
export class TextRenderer implements IDisposable {
    private readonly _useVAO: boolean = false;
    private _engine: AbstractEngine;
    private _shaderLanguage: ShaderLanguage;
    private _vertexBuffers: { [key: string]: VertexBuffer } = {};
    private _spriteBuffer: Nullable<Buffer>;
    private _worldBuffer: Nullable<Buffer>;
    private _uvBuffer: Nullable<Buffer>;
    private _drawWrapperBase: DrawWrapper;
    private _vertexArrayObject: WebGLVertexArrayObject;
    private _font: FontAsset;
    private _charMatrices = new Array<number>();
    private _charUvs = new Array<number>();
    private _isDirty = false;
    private _baseLine = 0;

    // Cache
    private _scalingMatrix: Matrix = Matrix.Identity();
    private _fontScaleMatrix: Matrix = Matrix.Identity();
    private _offsetMatrix: Matrix = Matrix.Identity();
    private _translationMatrix: Matrix = Matrix.Identity();
    private _baseMatrix: Matrix = Matrix.Identity();
    private _scaledMatrix: Matrix = Matrix.Identity();
    private _localMatrix: Matrix = Matrix.Identity();
    private _finalMatrix: Matrix = Matrix.Identity();
    private _lineMatrix: Matrix = Matrix.Identity();

    /**
     * Gets or sets the color of the text
     */
    public color = new Color4(1.0, 1.0, 1.0, 1.0);

    private constructor(engine: AbstractEngine, capacity: number, shaderLanguage: ShaderLanguage = ShaderLanguage.GLSL, font: FontAsset) {
        this._engine = engine;
        this._shaderLanguage = shaderLanguage;
        this._font = font;
        this._baseLine = font._font.common.lineHeight * font.scale;

        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;

        // Main vertex buffer
        const spriteData = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        this._spriteBuffer = new Buffer(engine, spriteData, false, 2);

        // Instances
        this._worldBuffer = new Buffer(engine, new Float32Array(capacity * 16), true, 16);
        this._vertexBuffers["offsets"] = this._spriteBuffer.createVertexBuffer("offsets", 0, 2);
        this._vertexBuffers["world0"] = this._worldBuffer.createVertexBuffer("world0", 0, 4, 16, true);
        this._vertexBuffers["world1"] = this._worldBuffer.createVertexBuffer("world1", 4, 4, 16, true);
        this._vertexBuffers["world2"] = this._worldBuffer.createVertexBuffer("world2", 8, 4, 16, true);
        this._vertexBuffers["world3"] = this._worldBuffer.createVertexBuffer("world3", 12, 4, 16, true);

        this._uvBuffer = new Buffer(engine, new Float32Array(capacity * 4), true, 4);
        this._vertexBuffers["uvs"] = this._uvBuffer.createVertexBuffer("uvs", 0, 4, 4, true);
    }

    private _setShaders(vertex: string, fragment: string) {
        this._drawWrapperBase?.dispose();

        this._drawWrapperBase = new DrawWrapper(this._engine);

        if (this._drawWrapperBase.drawContext) {
            this._drawWrapperBase.drawContext.useInstancing = true;
        }

        const defines = "";

        this._drawWrapperBase.effect = this._engine.createEffect(
            {
                vertexSource: vertex,
                fragmentSource: fragment,
            },
            ["offsets", "world0", "world1", "world2", "world3", "uvs"],
            ["view", "projection", "uColor", "unitRange", "texelSize"],
            ["fontAtlas"],
            defines,
            undefined,
            undefined,
            undefined,
            undefined,
            this._shaderLanguage
        );

        this._drawWrapperBase.effect._refCount++;
    }

    /**
     * Add a paragraph of text to the renderer
     * @param text define the text to add
     * @param worldMatrix define the world matrix to use for the paragraph (optional)
     * @param options define the options to use for the paragraph (optional)
     */
    public addParagraph(text: string, worldMatrix?: Matrix, options?: Partial<ParagraphOptions>) {
        const paragraph = new SdfTextParagraph(text, this._font, options);

        const fontScale = this._font.scale;

        const texWidth = this._font._font.common.scaleW;
        const texHeight = this._font._font.common.scaleH;
        const glyphs = paragraph.glyphs.filter((g) => g.char.page >= 0);
        const charUvs = new Float32Array(glyphs.length * 4);
        const matrices = new Float32Array(glyphs.length * 16);

        let worldMatrixToUse = worldMatrix;

        if (!worldMatrixToUse) {
            const lineHeight = paragraph.lineHeight * fontScale;
            const lineOffset = (paragraph.lines.length * lineHeight) / 2;
            Matrix.TranslationToRef(0, this._baseLine - lineOffset, 0, this._lineMatrix);
            worldMatrixToUse = this._lineMatrix;
        }

        Matrix.ScalingToRef(fontScale, fontScale, 1.0, this._fontScaleMatrix);
        Matrix.TranslationToRef(0.5, -0.5, 0, this._offsetMatrix);

        glyphs.forEach((g, i) => {
            charUvs[i * 4 + 0] = g.char.x / texWidth;
            charUvs[i * 4 + 1] = g.char.y / texHeight;
            charUvs[i * 4 + 2] = g.char.width / texWidth;
            charUvs[i * 4 + 3] = g.char.height / texHeight;

            const x = g.x;
            const y = -g.y;

            Matrix.ScalingToRef(g.char.width, g.char.height, 1.0, this._scalingMatrix);
            this._offsetMatrix.multiplyToRef(this._scalingMatrix, this._baseMatrix);

            Matrix.TranslationToRef(x * fontScale, y * fontScale, 0.0, this._translationMatrix);
            this._baseMatrix.multiplyToRef(this._fontScaleMatrix, this._scaledMatrix);
            this._scaledMatrix.multiplyToRef(this._translationMatrix, this._localMatrix);

            this._localMatrix.multiplyToRef(worldMatrixToUse, this._finalMatrix);
            this._finalMatrix.copyToArray(matrices, i * 16);
        });

        this._charUvs.push(...charUvs);
        this._charMatrices.push(...matrices);

        this._isDirty = true;

        this._baseLine -= paragraph.lineHeight * fontScale * paragraph.lines.length;
    }

    /**
     * Render the text using the provided view and projection matrices
     * @param viewMatrix define the view matrix to use
     * @param projectionMatrix define the projection matrix to use
     */
    public render(viewMatrix: Matrix, projectionMatrix: Matrix): void {
        const drawWrapper = this._drawWrapperBase;

        const effect = drawWrapper.effect!;

        // Check
        if (!effect.isReady()) {
            return;
        }
        const engine = this._engine;

        engine.setState(false);
        engine.enableEffect(drawWrapper);

        effect.setMatrix("view", viewMatrix);
        effect.setMatrix("projection", projectionMatrix);

        // Texture
        const textureWidth = this._font._font.common.scaleW;
        const textureHeight = this._font._font.common.scaleW;
        const distanceRange = this._font._font.distanceField.distanceRange;

        effect.setTexture("fontAtlas", this._font.textures[0]);
        effect.setFloat2("unitRange", distanceRange / textureWidth, distanceRange / textureHeight);
        effect.setFloat2("texelSize", 1.0 / textureWidth, 1.0 / textureHeight);
        effect.setDirectColor4("uColor", this.color);

        // Need update?
        if (this._isDirty) {
            this._isDirty = false;
            this._worldBuffer!.update(this._charMatrices);
            this._uvBuffer!.update(this._charUvs);
        }

        if (this._useVAO) {
            if (!this._vertexArrayObject) {
                this._vertexArrayObject = (engine as ThinEngine).recordVertexArrayObject(this._vertexBuffers, null, effect);
            }
            (engine as ThinEngine).bindVertexArrayObject(this._vertexArrayObject, null);
        } else {
            // VBOs
            engine.bindBuffers(this._vertexBuffers, null, effect);
        }

        engine.setAlphaMode(Constants.ALPHA_COMBINE);

        const instanceCount = this._charMatrices.length / 16;

        engine.drawArraysType(Constants.MATERIAL_TriangleStripDrawMode, 0, 4, instanceCount);

        engine.unbindInstanceAttributes();
    }

    /**
     * Release associated resources
     */
    public dispose(): void {
        if (this._worldBuffer) {
            this._worldBuffer.dispose();
            this._worldBuffer = null;
        }

        if (this._uvBuffer) {
            this._uvBuffer.dispose();
            this._uvBuffer = null;
        }

        if (this._spriteBuffer) {
            this._spriteBuffer.dispose();
            this._spriteBuffer = null;
        }

        if (this._vertexArrayObject) {
            (this._engine as ThinEngine).releaseVertexArrayObject(this._vertexArrayObject);
            (<any>this._vertexArrayObject) = null;
        }
    }

    /**
     * Creates a new TextRenderer instance asynchronously
     * @param font define the font asset to use
     * @param engine define the engine to use
     * @param capacity define the capacity of the text renderer (maximum number of characters)
     * @returns a promise that resolves to the created TextRenderer instance
     */
    public static async CreateTextRendererAsync(font: FontAsset, engine: AbstractEngine, capacity: number) {
        if (!engine.getCaps().instancedArrays || !engine._features.supportSpriteInstancing) {
            throw new Error("Instanced arrays are required for MSDF text rendering.");
        }

        let shaderLanguage = ShaderLanguage.GLSL;
        let vertex: string = "";
        let fragment: string = "";
        if (engine.isWebGPU) {
            shaderLanguage = ShaderLanguage.WGSL;
            //TODO!
        } else {
            vertex = (await import("./webgl/vertex")).msdfVertexShader.shader;
            fragment = (await import("./webgl/fragment")).msdfFragmentShader.shader;
        }

        const textRenderer = new TextRenderer(engine, capacity, shaderLanguage, font);
        textRenderer._setShaders(vertex, fragment);

        return textRenderer;
    }
}
