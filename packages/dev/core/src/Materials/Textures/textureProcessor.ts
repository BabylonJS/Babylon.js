import { type Scene } from "../../scene";
import { type IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { ProceduralTexture } from "./Procedurals/proceduralTexture";
import { type BaseTexture } from "./baseTexture";
import { type Nullable } from "../../types";
import { type Texture } from "./texture";
import { type TextureSize } from "./textureCreationOptions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "../../Engines/constants";
import { Color4 } from "core/Maths/math.color";

const _ShaderName = "textureProcessor";

/**
 * Specifies the color space of a texture operand.
 * When `sRGB` is set the sampled RGB values are converted to linear space before any channel
 * swizzle, factor multiplication, or arithmetic operation. Alpha is always treated as linear.
 */
export enum TextureColorSpace {
    /** Texture data is already in linear space (default). No conversion applied. */
    Linear = 0,
    /** Texture data is in sRGB (gamma) space. RGB channels are linearized (IEC 61966-2-1) before use. */
    SRGB = 1,
}

/**
 * Specifies which channel of a texture to read for an operation.
 * When a single channel is selected its scalar value is broadcast to RGB; alpha
 * is either preserved from the original sample or replicated when `A` is chosen.
 *
 * | Value | Swizzle |
 * |-------|---------|
 * | RGBA  | (r, g, b, a) — no swizzle (default) |
 * | R     | (r, r, r, a) |
 * | G     | (g, g, g, a) |
 * | B     | (b, b, b, a) |
 * | A     | (a, a, a, a) |
 */
export enum TextureChannel {
    /** Use all four channels as sampled (default). */
    RGBA = 0,
    /** Broadcast the red channel to RGB; preserve alpha: RRRA. */
    R = 1,
    /** Broadcast the green channel to RGB; preserve alpha: GGGA. */
    G = 2,
    /** Broadcast the blue channel to RGB; preserve alpha: BBBA. */
    B = 3,
    /** Broadcast the alpha channel to all four components: AAAA. */
    A = 4,
}

/**
 * Represents an operand for a texture processing operation, or the result of one.
 *
 * As an operand, the value evaluates to a vec4 per texel:
 * - `texture` only → `sample(texture)`
 * - `factor` only → `factor` (constant)
 * - both → `sample(texture) * factor`
 *
 * As a result returned by a processing function:
 * - `texture` holds the GPU-processed output; `dispose()` releases it when no longer needed.
 * - `factor` holds a CPU-folded constant when all inputs were texture-free; no `dispose` is set.
 *
 * Results are directly usable as operands to subsequent operations. When a result with a
 * `dispose` function is passed as an operand, the next operation automatically calls `dispose`
 * after consuming it, so intermediate textures are cleaned up without manual tracking.
 *
 * At least one of `texture` or `factor` must be provided when used as an operand.
 */
export interface ITextureProcessOperand {
    /**
     * Texture to sample. When combined with `factor`, the sampled value is multiplied
     * component-wise by the factor. Null when the operand or result is a constant.
     */
    texture: Nullable<BaseTexture>;
    /**
     * Optional constant RGBA factor. If `texture` is also set, the sampled value is
     * multiplied by this factor. If `texture` is not set, this becomes the constant output.
     * When omitted and `texture` is set, defaults to (1, 1, 1, 1) — no scaling.
     */
    factor?: Color4;
    /**
     * Optional channel selection applied to the sampled texture value before any factor
     * multiplication. When omitted or set to `TextureChannel.RGBA`, the sample is used
     * as-is. When set to a single channel, that channel's scalar is broadcast to RGB
     * (or all four components for `TextureChannel.A`). Only meaningful when `texture` is set.
     */
    channel?: TextureChannel;

    /**
     * Color space of the texture data. When set to `TextureColorSpace.SRGB`, the sampled
     * RGB channels are converted from sRGB to linear space (IEC 61966-2-1) before the channel
     * swizzle, factor multiplication, and any arithmetic operation. Alpha is always linear.
     * Defaults to `TextureColorSpace.Linear` (no conversion). Only meaningful when `texture` is set.
     */
    colorSpace?: TextureColorSpace;

    /**
     * Disposes the texture produced by a processing operation. Only present on results
     * returned by the texture processing functions. When a result is passed as an operand
     * to the next operation in a chain, its `dispose` is called automatically after the
     * GPU pass completes. Call `dispose` explicitly on the final result when the texture
     * is no longer needed (or skip it if transferring ownership to a material).
     */
    dispose?: () => void;
}

/**
 * Create an operand from a texture alone (no constant factor scaling).
 * @param texture - The texture to sample, or null to produce an identity (1,1,1,1) constant operand
 * @param channel - Optional channel selection. When set, the sampled value is swizzled before use
 *   (e.g. `TextureChannel.R` → RRRA). Defaults to `TextureChannel.RGBA` (no swizzle).
 * @param colorSpace - Optional color space. When `TextureColorSpace.SRGB`, the sampled RGB channels
 *   are linearized before use. Defaults to `TextureColorSpace.Linear`.
 * @returns An operand that evaluates to the sampled texture value
 */
export function CreateTextureOperand(texture: Nullable<BaseTexture>, channel?: TextureChannel, colorSpace?: TextureColorSpace): ITextureProcessOperand {
    const op: ITextureProcessOperand = { texture };
    if (channel) {
        op.channel = channel;
    }
    if (colorSpace) {
        op.colorSpace = colorSpace;
    }
    return op;
}

/**
 * Create an operand from a constant RGBA factor with no texture.
 * @param factor - The constant RGBA value
 * @returns An operand that evaluates to the constant factor
 */
export function CreateFactorOperand(factor: Color4): ITextureProcessOperand {
    return { texture: null, factor };
}

/**
 * Create an operand from a texture multiplied by a constant RGBA factor.
 * This is the standard glTF pattern (e.g. baseColorTexture * baseColorFactor).
 * If `texture` is null, returns a factor-only operand.
 * @param texture - The texture to sample, or null to use the factor alone
 * @param factor - The constant factor to multiply by
 * @param channel - Optional channel selection. When set, the sampled value is swizzled before
 *   factor multiplication (e.g. `TextureChannel.G` → GGGA, then multiplied by factor).
 *   Defaults to `TextureChannel.RGBA` (no swizzle).
 * @param colorSpace - Optional color space. When `TextureColorSpace.SRGB`, the sampled RGB channels
 *   are linearized before factor multiplication. Defaults to `TextureColorSpace.Linear`.
 * @returns An operand that evaluates to `sample(texture) * factor`, or `factor` if texture is null
 */
export function CreateTextureWithFactorOperand(texture: Nullable<BaseTexture>, factor: Color4, channel?: TextureChannel, colorSpace?: TextureColorSpace): ITextureProcessOperand {
    const op: ITextureProcessOperand = { texture, factor };
    if (channel) {
        op.channel = channel;
    }
    if (colorSpace) {
        op.colorSpace = colorSpace;
    }
    return op;
}

/**
 * @internal
 * Evaluate the effective constant Color4 of an operand.
 * When a texture-only operand omits factor, the implicit value is (1, 1, 1, 1).
 */
function _EvalConstant(op: ITextureProcessOperand): Color4 {
    return op.factor ?? new Color4(1, 1, 1, 1);
}

/** @internal */
function _MultiplyConstants(a: Color4, b: Color4): Color4 {
    return new Color4(a.r * b.r, a.g * b.g, a.b * b.b, a.a * b.a);
}

/** @internal */
function _MaxConstants(a: Color4, b: Color4): Color4 {
    return new Color4(Math.max(a.r, b.r), Math.max(a.g, b.g), Math.max(a.b, b.b), Math.max(a.a, b.a));
}

/** @internal */
function _LerpConstants(a: Color4, b: Color4, t: Color4): Color4 {
    return new Color4(a.r + (b.r - a.r) * t.r, a.g + (b.g - a.g) * t.g, a.b + (b.b - a.b) * t.b, a.a + (b.a - a.a) * t.a);
}

/**
 * @internal
 * Determine the output texture size from a list of operands, using the largest input texture.
 */
function _ResolveOutputSize(operands: ITextureProcessOperand[]): TextureSize {
    let maxDim = 0;
    let result: TextureSize = 512;
    for (const op of operands) {
        if (op.texture) {
            const size = op.texture.getSize();
            const dim = Math.max(size.width, size.height);
            if (dim > maxDim) {
                maxDim = dim;
                result = size.width === size.height ? dim : size;
            }
        }
    }
    return result;
}

/**
 * @internal
 * Returns true when the texture has a non-identity UV transform (offset, scale, or rotation).
 */
function _HasNonIdentityTransform(texture: BaseTexture): boolean {
    return !texture.getTextureMatrix().isIdentity();
}

/**
 * @internal
 * Returns true when every texture in the list shares the same UV transform matrix.
 * A single texture (or empty list) trivially satisfies this.
 */
function _AllTransformsMatch(textures: BaseTexture[]): boolean {
    if (textures.length <= 1) {
        return true;
    }
    const ref = textures[0].getTextureMatrix();
    for (let i = 1; i < textures.length; i++) {
        if (!ref.equals(textures[i].getTextureMatrix())) {
            return false;
        }
    }
    return true;
}

/**
 * @internal
 * Copy sampling metadata from a source texture onto the output ProceduralTexture.
 * `coordinatesIndex` and wrap modes are always copied.
 * When `includeTransform` is true the UV offset/scale/rotation are also copied
 * (used when all inputs share the same transform and it is propagated rather than baked).
 */
function _CopyTextureMetadata(from: BaseTexture, to: ProceduralTexture, includeTransform: boolean): void {
    to.coordinatesIndex = from.coordinatesIndex;
    to.wrapU = from.wrapU;
    to.wrapV = from.wrapV;
    if (includeTransform) {
        const src = from as Texture;
        to.uOffset = src.uOffset ?? 0;
        to.vOffset = src.vOffset ?? 0;
        to.uScale = src.uScale ?? 1;
        to.vScale = src.vScale ?? 1;
        to.wAng = src.wAng ?? 0;
    }
}

/**
 * @internal
 * Return the shader define suffix for a TextureChannel (e.g. TextureChannel.R → "R").
 * Returns an empty string for RGBA (no swizzle needed).
 */
function _ChannelDefine(channel: TextureChannel): string {
    switch (channel) {
        case TextureChannel.R:
            return "R";
        case TextureChannel.G:
            return "G";
        case TextureChannel.B:
            return "B";
        case TextureChannel.A:
            return "A";
        default:
            return "";
    }
}

/**
 * @internal
 * Build shader defines for a standard A/B operand.
 * When `bakeTransform` is true and the texture has a non-identity UV transform,
 * the OPERAND_X_MATRIX define is emitted so the shader applies the matrix when sampling.
 */
function _BuildOperandDefines(operand: ITextureProcessOperand, prefix: "A" | "B", bakeTransform: boolean): string[] {
    const defines: string[] = [];
    if (operand.texture) {
        defines.push(`OPERAND_${prefix}_TEXTURE`);
        if (bakeTransform && _HasNonIdentityTransform(operand.texture)) {
            defines.push(`OPERAND_${prefix}_MATRIX`);
        }
        if (operand.colorSpace) {
            defines.push(`OPERAND_${prefix}_SRGB`);
        }
        if (operand.channel) {
            defines.push(`OPERAND_${prefix}_CHANNEL_${_ChannelDefine(operand.channel)}`);
        }
    }
    if (operand.factor !== undefined || !operand.texture) {
        defines.push(`OPERAND_${prefix}_FACTOR`);
    }
    return defines;
}

/**
 * @internal
 * Build shader defines for the lerp blend operand.
 * When `bakeTransform` is true and the texture has a non-identity UV transform,
 * the LERP_T_MATRIX define is emitted.
 */
function _BuildLerpBlendDefines(t: ITextureProcessOperand, bakeTransform: boolean): string[] {
    const defines: string[] = [];
    if (t.texture) {
        defines.push("LERP_T_TEXTURE");
        if (bakeTransform && _HasNonIdentityTransform(t.texture)) {
            defines.push("LERP_T_MATRIX");
        }
        if (t.factor !== undefined) {
            defines.push("LERP_T_FACTOR");
        }
        if (t.colorSpace) {
            defines.push("LERP_T_SRGB");
        }
        if (t.channel) {
            defines.push(`LERP_T_CHANNEL_${_ChannelDefine(t.channel)}`);
        }
    }
    // factor-only: no additional defines needed; the shader uses factorT when LERP_T_TEXTURE is absent.
    return defines;
}

/**
 * @internal
 * Set uniforms and textures for a standard A/B operand on a procedural texture.
 * When `bakeTransform` is true and the texture has a non-identity UV matrix,
 * that matrix is uploaded as `<textureName>Matrix` for the shader to apply when sampling.
 */
function _SetOperandUniforms(pt: ProceduralTexture, operand: ITextureProcessOperand, textureName: string, factorName: string, bakeTransform: boolean): void {
    if (operand.texture) {
        pt.setTexture(textureName, operand.texture as Texture);
        if (bakeTransform && _HasNonIdentityTransform(operand.texture)) {
            pt.setMatrix(`${textureName}Matrix`, operand.texture.getTextureMatrix());
        }
    }
    const needsFactor = operand.factor !== undefined || !operand.texture;
    if (needsFactor) {
        pt.setColor4(factorName, _EvalConstant(operand));
    }
}

/**
 * @internal
 * Set uniforms and textures for the lerp blend operand.
 * When `bakeTransform` is true and the texture has a non-identity UV matrix,
 * that matrix is uploaded as `textureTMatrix`.
 */
function _SetLerpBlendUniforms(pt: ProceduralTexture, t: ITextureProcessOperand, bakeTransform: boolean): void {
    if (t.texture) {
        pt.setTexture("textureT", t.texture as Texture);
        if (bakeTransform && _HasNonIdentityTransform(t.texture)) {
            pt.setMatrix("textureTMatrix", t.texture.getTextureMatrix());
        }
        if (t.factor !== undefined) {
            pt.setColor4("factorT", t.factor);
        }
    } else {
        pt.setColor4("factorT", _EvalConstant(t));
    }
}

/**
 * @internal
 * Create a textureProcessor procedural texture with the given defines. The returned texture
 * is not yet rendered — uniforms must be set on it before calling _RenderAsync.
 */
function _CreateProcessorTexture(name: string, defines: string[], outputSize: TextureSize, scene: Scene): ProceduralTexture {
    const options: IProceduralTextureCreationOptions = {
        type: Constants.TEXTURETYPE_HALF_FLOAT,
        format: Constants.TEXTUREFORMAT_RGBA,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        generateDepthBuffer: false,
        generateMipMaps: false,
        shaderLanguage: scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        extraInitializationsAsync: async () => {
            if (scene.getEngine().isWebGPU) {
                await Promise.all([import("../../ShadersWGSL/textureProcessor.fragment")]);
            } else {
                await Promise.all([import("../../Shaders/textureProcessor.fragment")]);
            }
        },
    };

    const pt = new ProceduralTexture(name, outputSize, _ShaderName, scene, options);
    pt.refreshRate = -1; // render on demand only
    pt.defines = defines.length > 0 ? "#define " + defines.join("\n#define ") + "\n" : "";
    return pt;
}

/**
 * @internal
 * Wait for a procedural texture's shader to compile then render it. Uniforms must be set
 * on the texture before calling this.
 */
async function _RenderAsync(pt: ProceduralTexture): Promise<void> {
    return await new Promise<void>((resolve, reject) => {
        // Force effect creation by calling isReady() so getEffect() will return non-null.
        pt.isReady();

        const effect = pt.getEffect();
        if (!effect) {
            pt.dispose();
            reject(new Error(`TextureProcessor: failed to create shader effect for "${pt.name}"`));
            return;
        }

        effect.executeWhenCompiled(() => {
            if (!effect.isReady()) {
                const errors = effect.getCompilationError();
                pt.dispose();
                reject(new Error(`TextureProcessor: shader compilation failed for "${pt.name}"${errors ? `: ${errors}` : ""}`));
                return;
            }
            try {
                pt.render();
                // Remove from scene.proceduralTextures immediately after rendering.
                // ProceduralTexture's constructor pushes itself onto scene.proceduralTextures,
                // and with refreshRate = -1, _currentRefreshId stays -1 after our explicit
                // render() call (render() does not call _shouldRender()). This means the
                // scene render loop would call _shouldRender() → true, then re-render the
                // PT on the next frame — potentially with already-disposed input textures,
                // producing a black result. Removing it here prevents that re-render.
                const scene = pt.getScene();
                if (scene) {
                    const idx = scene.proceduralTextures.indexOf(pt);
                    if (idx >= 0) {
                        scene.proceduralTextures.splice(idx, 1);
                    }
                }
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    });
}

/**
 * Multiply two texture operands together, component-wise: `result = a * b`.
 *
 * Each operand can be a texture, a constant factor, or a texture scaled by a factor.
 * This is useful for applying glTF-style factors to textures (e.g. `baseColorTexture * baseColorFactor`),
 * or for modulating one texture by another.
 *
 * If both operands are constant (no textures), the multiplication is performed on the CPU and
 * the result is returned as a factor-only operand with no texture allocated.
 *
 * When operands are results of previous operations (i.e. they carry a `dispose` function),
 * their intermediate textures are automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param a - First operand
 * @param b - Second operand
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function MultiplyTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture) {
        return { texture: null, factor: _MultiplyConstants(_EvalConstant(a), _EvalConstant(b)) };
    }

    const allTextures: BaseTexture[] = [];
    if (a.texture) {
        allTextures.push(a.texture);
    }
    if (b.texture) {
        allTextures.push(b.texture);
    }
    const canPropagate = _AllTransformsMatch(allTextures);
    const bakeTransform = !canPropagate;

    const defines = [..._BuildOperandDefines(a, "A", bakeTransform), ..._BuildOperandDefines(b, "B", bakeTransform)];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b]), scene);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    await _RenderAsync(pt);

    a.dispose?.();
    b.dispose?.();

    _CopyTextureMetadata(allTextures[0], pt, canPropagate);
    const result: ITextureProcessOperand = { texture: pt, dispose: () => pt.dispose() };
    if (outputColorSpace) {
        result.colorSpace = outputColorSpace;
    }
    return result;
}

/**
 * Take the component-wise maximum of two texture operands: `result = max(a, b)`.
 *
 * Each operand can be a texture, a constant factor, or a texture scaled by a factor.
 * Useful for operations such as combining ambient occlusion maps or taking the
 * brightest contribution from two sources.
 *
 * If both operands are constant (no textures), the operation is performed on the CPU and
 * the result is returned as a factor-only operand with no texture allocated.
 *
 * When operands are results of previous operations (i.e. they carry a `dispose` function),
 * their intermediate textures are automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param a - First operand
 * @param b - Second operand
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function MaxTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture) {
        return { texture: null, factor: _MaxConstants(_EvalConstant(a), _EvalConstant(b)) };
    }

    const allTextures: BaseTexture[] = [];
    if (a.texture) {
        allTextures.push(a.texture);
    }
    if (b.texture) {
        allTextures.push(b.texture);
    }
    const canPropagate = _AllTransformsMatch(allTextures);
    const bakeTransform = !canPropagate;

    const defines = ["OP_MAX", ..._BuildOperandDefines(a, "A", bakeTransform), ..._BuildOperandDefines(b, "B", bakeTransform)];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b]), scene);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    await _RenderAsync(pt);

    a.dispose?.();
    b.dispose?.();

    _CopyTextureMetadata(allTextures[0], pt, canPropagate);
    const result: ITextureProcessOperand = { texture: pt, dispose: () => pt.dispose() };
    if (outputColorSpace) {
        result.colorSpace = outputColorSpace;
    }
    return result;
}

/**
 * Linearly interpolate between two texture operands: `result = mix(a, b, t)`.
 *
 * Each operand can be a texture, a constant factor, or a texture scaled by a factor.
 * The `t` operand controls the blend weight per texel, per channel — a value of 0 returns `a`,
 * a value of 1 returns `b`. Use a grayscale texture or a scalar `Color4(v, v, v, v)` for
 * uniform blending across all channels.
 *
 * If all three operands are constant (no textures), the interpolation is performed on the CPU and
 * the result is returned as a factor-only operand with no texture allocated.
 *
 * When operands are results of previous operations (i.e. they carry a `dispose` function),
 * their intermediate textures are automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param a - Start value operand (returned when t = 0)
 * @param b - End value operand (returned when t = 1)
 * @param t - Blend weight operand. Each channel independently controls the blend for the corresponding output channel.
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function LerpTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    t: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture && !t.texture) {
        return { texture: null, factor: _LerpConstants(_EvalConstant(a), _EvalConstant(b), _EvalConstant(t)) };
    }

    const allTextures: BaseTexture[] = [];
    if (a.texture) {
        allTextures.push(a.texture);
    }
    if (b.texture) {
        allTextures.push(b.texture);
    }
    if (t.texture) {
        allTextures.push(t.texture);
    }
    const canPropagate = _AllTransformsMatch(allTextures);
    const bakeTransform = !canPropagate;

    const defines = ["OP_LERP", ..._BuildOperandDefines(a, "A", bakeTransform), ..._BuildOperandDefines(b, "B", bakeTransform), ..._BuildLerpBlendDefines(t, bakeTransform)];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b, t]), scene);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    _SetLerpBlendUniforms(pt, t, bakeTransform);
    await _RenderAsync(pt);

    a.dispose?.();
    b.dispose?.();
    t.dispose?.();

    _CopyTextureMetadata(allTextures[0], pt, canPropagate);
    const result: ITextureProcessOperand = { texture: pt, dispose: () => pt.dispose() };
    if (outputColorSpace) {
        result.colorSpace = outputColorSpace;
    }
    return result;
}
