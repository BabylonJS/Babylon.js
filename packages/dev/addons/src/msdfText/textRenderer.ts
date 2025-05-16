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
import { ThinMatrix } from "core/Maths/ThinMaths/thinMath.matrix";
import {
    CopyMatrixToArray,
    CopyMatrixToRef,
    IdentityMatrixToRef,
    InvertMatrixToRef,
    MultiplyMatricesToRef,
    ScalingMatrixToRef,
    TranslationMatrixToRef,
} from "core/Maths/ThinMaths/thinMath.matrix.functions";
import type { IColor4Like, IMatrixLike, IVector3Like } from "core/Maths";

/**
 * Abstract Node class from Babylon.js
 */
export interface INodeLike {
    getWorldMatrix(): ThinMatrix;
}

/**
 * Class used to render text using MSDF (Multi-channel Signed Distance Field) technique
 * Thanks a lot to the work of Bhushan_Wagh and zb_sj for their amazing work on MSDF for Babylon.js
 * #6RLCWP#16
 * Star wars scroller: #6RLCWP#29
 * With metrics: #6RLCWP#35
 * Thickness: #IABMEZ#3
 * Solar system: #9YCDYC#9
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
    private _isDirty = true;
    private _baseLine = 0;

    // Cache
    private _scalingMatrix = new ThinMatrix();
    private _fontScaleMatrix = new ThinMatrix();
    private _offsetMatrix = new ThinMatrix();
    private _translationMatrix = new ThinMatrix();
    private _baseMatrix = new ThinMatrix();
    private _scaledMatrix = new ThinMatrix();
    private _localMatrix = new ThinMatrix();
    private _finalMatrix = new ThinMatrix();
    private _lineMatrix = new ThinMatrix();
    private _parentWorldMatrix = new ThinMatrix();
    private _storedTranslation: IVector3Like = { x: 0, y: 0, z: 0 };

    /**
     * Gets or sets the color of the text
     */
    public color: IColor4Like = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };

    /**
     * Gets or sets the thickness of the text (0 means as defined in the font)
     * Value must be between -0.5 and 0.5
     */
    public thicknessControl = 0;

    private _parent: Nullable<INodeLike> = null;

    /**
     * Gets or sets the parent of the text renderer
     */
    public get parent(): Nullable<INodeLike> {
        return this._parent;
    }

    public set parent(value: Nullable<INodeLike>) {
        this._parent = value;
    }

    /**
     * Gets or sets if the text is billboarded
     */
    public isBillboard = false;

    /**
     * Gets the number of characters in the text renderer
     */
    public get characterCount(): number {
        return this._charMatrices.length / 16;
    }

    private constructor(engine: AbstractEngine, shaderLanguage: ShaderLanguage = ShaderLanguage.GLSL, font: FontAsset) {
        this._engine = engine;
        this._shaderLanguage = shaderLanguage;
        this._font = font;
        this._baseLine = font._font.common.lineHeight * font.scale;

        this._useVAO = engine.getCaps().vertexArrayObject && !engine.disableVertexArrayObjects;

        // Main vertex buffer
        const spriteData = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        this._spriteBuffer = new Buffer(engine, spriteData, false, 2);
        this._vertexBuffers["offsets"] = this._spriteBuffer.createVertexBuffer("offsets", 0, 2);

        // Instances
        this._resizeBuffers(128);
    }

    private _resizeBuffers(capacity: number) {
        if (this._worldBuffer) {
            this._worldBuffer.dispose();
            this._worldBuffer = null;
        }

        if (this._uvBuffer) {
            this._uvBuffer.dispose();
            this._uvBuffer = null;
        }

        this._worldBuffer = new Buffer(this._engine, new Float32Array(capacity * 16), true, 16);
        this._vertexBuffers["world0"] = this._worldBuffer.createVertexBuffer("world0", 0, 4, 16, true);
        this._vertexBuffers["world1"] = this._worldBuffer.createVertexBuffer("world1", 4, 4, 16, true);
        this._vertexBuffers["world2"] = this._worldBuffer.createVertexBuffer("world2", 8, 4, 16, true);
        this._vertexBuffers["world3"] = this._worldBuffer.createVertexBuffer("world3", 12, 4, 16, true);

        this._uvBuffer = new Buffer(this._engine, new Float32Array(capacity * 4), true, 4);
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
            ["parentWorld", "view", "projection", "uColor", "unitRange", "texelSize", "thickness"],
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
     * @param options define the options to use for the paragraph (optional)
     * @param worldMatrix define the world matrix to use for the paragraph (optional)
     */
    public addParagraph(text: string, options?: Partial<ParagraphOptions>, worldMatrix?: IMatrixLike) {
        const paragraph = new SdfTextParagraph(text, this._font, options);

        const fontScale = this._font.scale;

        const texWidth = this._font._font.common.scaleW;
        const texHeight = this._font._font.common.scaleH;
        const glyphs = paragraph.glyphs.filter((g) => g.char.page >= 0);

        let worldMatrixToUse = worldMatrix;

        if (!worldMatrixToUse) {
            const lineHeight = paragraph.lineHeight * fontScale;
            const lineOffset = (paragraph.lines.length * lineHeight) / 2;
            TranslationMatrixToRef(0, this._baseLine - lineOffset, 0, this._lineMatrix);
            worldMatrixToUse = this._lineMatrix;
        }

        ScalingMatrixToRef(fontScale, fontScale, 1.0, this._fontScaleMatrix);
        TranslationMatrixToRef(0.5, -0.5, 0, this._offsetMatrix);

        const charsUvsBase = this._charUvs.length;
        const matricesBase = this._charMatrices.length;
        glyphs.forEach((g, i) => {
            this._charUvs[charsUvsBase + i * 4 + 0] = g.char.x / texWidth;
            this._charUvs[charsUvsBase + i * 4 + 1] = g.char.y / texHeight;
            this._charUvs[charsUvsBase + i * 4 + 2] = g.char.width / texWidth;
            this._charUvs[charsUvsBase + i * 4 + 3] = g.char.height / texHeight;

            const x = g.x;
            const y = -g.y;

            ScalingMatrixToRef(g.char.width, g.char.height, 1.0, this._scalingMatrix);
            MultiplyMatricesToRef(this._offsetMatrix, this._scalingMatrix, this._baseMatrix);

            TranslationMatrixToRef(x * fontScale, y * fontScale, 0.0, this._translationMatrix);
            MultiplyMatricesToRef(this._baseMatrix, this._fontScaleMatrix, this._scaledMatrix);
            MultiplyMatricesToRef(this._scaledMatrix, this._translationMatrix, this._localMatrix);

            MultiplyMatricesToRef(this._localMatrix, worldMatrixToUse, this._finalMatrix);
            CopyMatrixToArray(this._finalMatrix, this._charMatrices, matricesBase + i * 16);
        });

        this._isDirty = true;

        this._baseLine -= paragraph.lineHeight * fontScale * paragraph.lines.length;
    }

    /**
     * Render the text using the provided view and projection matrices
     * @param viewMatrix define the view matrix to use
     * @param projectionMatrix define the projection matrix to use
     */
    public render(viewMatrix: IMatrixLike, projectionMatrix: IMatrixLike): void {
        const drawWrapper = this._drawWrapperBase;

        const effect = drawWrapper.effect!;

        // Check
        if (!effect.isReady()) {
            return;
        }
        const engine = this._engine;

        engine.setState(false);
        engine.enableEffect(drawWrapper);

        if (this.isBillboard) {
            // We will only consider translation for parent to simplify computation
            // Save parent translation
            if (this._parent) {
                const pwm = this._parent.getWorldMatrix().asArray();
                this._storedTranslation.x = pwm[12];
                this._storedTranslation.y = pwm[13];
                this._storedTranslation.z = pwm[14];
            } else {
                this._storedTranslation.x = 0;
                this._storedTranslation.y = 0;
                this._storedTranslation.z = 0;
            }
            // Cancel camera rotation
            const baseM = this._baseMatrix.asArray();
            CopyMatrixToArray(viewMatrix, baseM);
            baseM[12] = 0;
            baseM[13] = 0;
            baseM[14] = 0;
            InvertMatrixToRef(this._baseMatrix, this._parentWorldMatrix);

            // Restore translation
            const pwm = this._parentWorldMatrix.asArray();
            pwm[12] = this._storedTranslation.x;
            pwm[13] = this._storedTranslation.y;
            pwm[14] = this._storedTranslation.z;
        } else {
            if (this._parent) {
                CopyMatrixToRef(this._parent.getWorldMatrix(), this._parentWorldMatrix);
            } else {
                IdentityMatrixToRef(this._parentWorldMatrix);
            }
        }

        effect.setMatrix("parentWorld", this._parentWorldMatrix);
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
        effect.setFloat("thickness", this.thicknessControl * 0.9);

        const instanceCount = this._charMatrices.length / 16;

        // Need update?
        if (this._isDirty) {
            this._isDirty = false;

            if (this._worldBuffer!.getBuffer()!.capacity / 4 < instanceCount * 16) {
                this._resizeBuffers(instanceCount);
            }

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
     * @returns a promise that resolves to the created TextRenderer instance
     */
    public static async CreateTextRendererAsync(font: FontAsset, engine: AbstractEngine) {
        if (!engine.getCaps().instancedArrays || !engine._features.supportSpriteInstancing) {
            throw new Error("Instanced arrays are required for MSDF text rendering.");
        }

        let shaderLanguage = ShaderLanguage.GLSL;
        let vertex: string = "";
        let fragment: string = "";
        if (engine.isWebGPU) {
            shaderLanguage = ShaderLanguage.WGSL;
            vertex = (await import("./webgpu/vertex")).msdfVertexShader.shader;
            fragment = (await import("./webgpu/fragment")).msdfFragmentShader.shader;
        } else {
            vertex = (await import("./webgl/vertex")).msdfVertexShader.shader;
            fragment = (await import("./webgl/fragment")).msdfFragmentShader.shader;
        }

        const textRenderer = new TextRenderer(engine, shaderLanguage, font);
        textRenderer._setShaders(vertex, fragment);

        return textRenderer;
    }
}
