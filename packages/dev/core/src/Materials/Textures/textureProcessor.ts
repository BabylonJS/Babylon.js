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
 * Bitmask controlling which channels are written to the output texture by a processing operation.
 * Channels excluded from the mask receive a sensible default: `0.0` for RGB channels, `1.0` for alpha.
 * Use `ChannelMask.RGBA` (or omit the parameter) to pass all channels through unchanged.
 *
 * | Flag | Channels written | Excluded channels |
 * |------|-----------------|-------------------|
 * | R    | red             | G=0, B=0, A=1     |
 * | G    | green           | R=0, B=0, A=1     |
 * | B    | blue            | R=0, G=0, A=1     |
 * | A    | alpha           | R=0, G=0, B=0     |
 * | RGB  | red, green, blue | A=1              |
 * | RGBA | all four        | (none)            |
 */
export enum ChannelMask {
    /** Pass only the red channel; G=0, B=0, A=1. */
    R = 0x1,
    /** Pass only the green channel; R=0, B=0, A=1. */
    G = 0x2,
    /** Pass only the blue channel; R=0, G=0, A=1. */
    B = 0x4,
    /** Pass only the alpha channel; R=0, G=0, B=0. */
    A = 0x8,
    /** Pass red, green, and blue; alpha is forced to 1.0. */
    RGB = 0x7,
    /** Pass all four channels unchanged (default — no masking). */
    RGBA = 0xf,
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
 * Apply a channel swizzle to a constant Color4, matching the GPU behaviour for TextureChannel.
 */
function _ApplyChannelSwizzle(c: Color4, channel: TextureChannel): Color4 {
    switch (channel) {
        case TextureChannel.R:
            return new Color4(c.r, c.r, c.r, c.a);
        case TextureChannel.G:
            return new Color4(c.g, c.g, c.g, c.a);
        case TextureChannel.B:
            return new Color4(c.b, c.b, c.b, c.a);
        case TextureChannel.A:
            return new Color4(c.a, c.a, c.a, c.a);
        default:
            return c;
    }
}

/**
 * @internal
 * Build the OP_INVERT define plus per-channel INVERT_R/G/B/A defines from an ChannelMask bitmask.
 */
function _BuildInvertDefines(channels: ChannelMask): string[] {
    const defines: string[] = ["OP_INVERT"];
    if (channels & ChannelMask.R) {
        defines.push("INVERT_R");
    }
    if (channels & ChannelMask.G) {
        defines.push("INVERT_G");
    }
    if (channels & ChannelMask.B) {
        defines.push("INVERT_B");
    }
    if (channels & ChannelMask.A) {
        defines.push("INVERT_A");
    }
    return defines;
}

/**
 * @internal
 * Build OUTPUT_MASK_X_ZERO / OUTPUT_MASK_A_ONE defines for excluded channels.
 * Channels present in the mask pass through; excluded channels get defaults (0.0 for RGB, 1.0 for A).
 * Returns an empty array for ChannelMask.RGBA (no masking needed).
 */
function _BuildOutputChannelMaskDefines(mask: ChannelMask): string[] {
    const defines: string[] = [];
    if (!(mask & ChannelMask.R)) {
        defines.push("OUTPUT_MASK_R_ZERO");
    }
    if (!(mask & ChannelMask.G)) {
        defines.push("OUTPUT_MASK_G_ZERO");
    }
    if (!(mask & ChannelMask.B)) {
        defines.push("OUTPUT_MASK_B_ZERO");
    }
    if (!(mask & ChannelMask.A)) {
        defines.push("OUTPUT_MASK_A_ONE");
    }
    return defines;
}

/**
 * @internal
 * Apply a ChannelMask to a constant Color4: included channels pass through,
 * excluded color channels become 0, excluded alpha becomes 1.
 */
function _ApplyOutputChannelMask(c: Color4, mask: ChannelMask): Color4 {
    return new Color4(mask & ChannelMask.R ? c.r : 0, mask & ChannelMask.G ? c.g : 0, mask & ChannelMask.B ? c.b : 0, mask & ChannelMask.A ? c.a : 1);
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
function _CreateProcessorTexture(
    name: string,
    defines: string[],
    outputSize: TextureSize,
    scene: Scene,
    outputColorSpace: TextureColorSpace = TextureColorSpace.Linear
): ProceduralTexture {
    const options: IProceduralTextureCreationOptions = {
        type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
        format: Constants.TEXTUREFORMAT_RGBA,
        samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        generateDepthBuffer: false,
        generateMipMaps: false,
        gammaSpace: outputColorSpace === TextureColorSpace.SRGB,
        shaderLanguage: scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        extraInitializationsAsync: async () => {
            if (scene.getEngine().isWebGPU) {
                await Promise.all([import("../../ShadersWGSL/textureProcessor.fragment")]);
            } else {
                await Promise.all([import("../../Shaders/textureProcessor.fragment")]);
            }
        },
        // Opt out of scene-managed rendering. _shouldRender() would re-render the texture
        // on the first scene frame regardless of refreshRate (because _currentRefreshId starts
        // at -1 and is only advanced by _shouldRender() itself, not by a direct render() call).
        // That re-render would sample already-disposed input textures, producing blank output.
        skipSceneRegistration: true,
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
        pt.executeWhenReady(() => {
            try {
                pt.render();
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
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function MultiplyTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture) {
        const factor = _MultiplyConstants(_EvalConstant(a), _EvalConstant(b));
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(factor, outputChannelMask) : factor };
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

    const defines = [
        ..._BuildOperandDefines(a, "A", bakeTransform),
        ..._BuildOperandDefines(b, "B", bakeTransform),
        ...(outputChannelMask ? _BuildOutputChannelMaskDefines(outputChannelMask) : []),
    ];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b]), scene, outputColorSpace);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    try {
        await _RenderAsync(pt);
    } catch (error) {
        a.dispose?.();
        b.dispose?.();
        throw error;
    }

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
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function MaxTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture) {
        const factor = _MaxConstants(_EvalConstant(a), _EvalConstant(b));
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(factor, outputChannelMask) : factor };
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

    const defines = [
        "OP_MAX",
        ..._BuildOperandDefines(a, "A", bakeTransform),
        ..._BuildOperandDefines(b, "B", bakeTransform),
        ...(outputChannelMask ? _BuildOutputChannelMaskDefines(outputChannelMask) : []),
    ];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b]), scene, outputColorSpace);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    try {
        await _RenderAsync(pt);
    } catch (error) {
        a.dispose?.();
        b.dispose?.();
        throw error;
    }

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
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function LerpTexturesAsync(
    name: string,
    a: ITextureProcessOperand,
    b: ITextureProcessOperand,
    t: ITextureProcessOperand,
    scene: Scene,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!a.texture && !b.texture && !t.texture) {
        const factor = _LerpConstants(_EvalConstant(a), _EvalConstant(b), _EvalConstant(t));
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(factor, outputChannelMask) : factor };
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

    const defines = [
        "OP_LERP",
        ..._BuildOperandDefines(a, "A", bakeTransform),
        ..._BuildOperandDefines(b, "B", bakeTransform),
        ..._BuildLerpBlendDefines(t, bakeTransform),
        ...(outputChannelMask ? _BuildOutputChannelMaskDefines(outputChannelMask) : []),
    ];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([a, b, t]), scene, outputColorSpace);
    _SetOperandUniforms(pt, a, "textureA", "factorA", bakeTransform);
    _SetOperandUniforms(pt, b, "textureB", "factorB", bakeTransform);
    _SetLerpBlendUniforms(pt, t, bakeTransform);
    try {
        await _RenderAsync(pt);
    } catch (error) {
        a.dispose?.();
        b.dispose?.();
        t.dispose?.();
        throw error;
    }

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

/**
 * Invert selected channels of a texture operand: `result[ch] = 1 - input[ch]`.
 *
 * The `channels` bitmask selects which channels are inverted; unselected channels pass through
 * unchanged. Use `ChannelMask.RGB` for the common roughness↔smoothness conversion, or
 * `ChannelMask.RGBA` (the default) to invert the entire texture.
 *
 * This is a unary operation — only operand A is used. Any `colorSpace` or `channel` properties
 * on the input operand are honoured (sRGB linearization and channel swizzle applied before
 * the invert).
 *
 * If the input is constant (no texture), the invert is performed on the CPU.
 *
 * When the input is the result of a previous operation (i.e. it carries a `dispose` function),
 * its intermediate texture is automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param input - Operand to invert
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param channels - Bitmask of channels to invert. Defaults to `ChannelMask.RGBA`.
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function InvertTextureAsync(
    name: string,
    input: ITextureProcessOperand,
    scene: Scene,
    channels: ChannelMask = ChannelMask.RGBA,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!input.texture) {
        const c = _EvalConstant(input);
        const factor = new Color4(
            channels & ChannelMask.R ? 1 - c.r : c.r,
            channels & ChannelMask.G ? 1 - c.g : c.g,
            channels & ChannelMask.B ? 1 - c.b : c.b,
            channels & ChannelMask.A ? 1 - c.a : c.a
        );
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(factor, outputChannelMask) : factor };
    }

    // Single input: UV transform is always propagated (no bake needed).
    const defines = [..._BuildOperandDefines(input, "A", false), ..._BuildInvertDefines(channels), ...(outputChannelMask ? _BuildOutputChannelMaskDefines(outputChannelMask) : [])];
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([input]), scene, outputColorSpace);
    _SetOperandUniforms(pt, input, "textureA", "factorA", false);
    try {
        await _RenderAsync(pt);
    } catch (error) {
        input.dispose?.();
        throw error;
    }

    input.dispose?.();

    _CopyTextureMetadata(input.texture, pt, true);
    const result: ITextureProcessOperand = { texture: pt, dispose: () => pt.dispose() };
    if (outputColorSpace) {
        result.colorSpace = outputColorSpace;
    }
    return result;
}

/**
 * Extract the per-texel maximum channel value from a texture and broadcast it to all output
 * channels, producing a single-value (greyscale) texture in a single GPU pass.
 *
 * For each texel, computes `max(r, g, b)` — or `max(r, g, b, a)` when `includeAlpha` is true —
 * and writes that scalar to the output:
 * - `includeAlpha = false` (default): output is `(m, m, m, a)` where `m = max(r, g, b)`
 * - `includeAlpha = true`:            output is `(m, m, m, m)` where `m = max(r, g, b, a)`
 *
 * This is more efficient than chaining `ExtractChannelAsync` calls through `MaxTexturesAsync`,
 * which would require multiple intermediate textures and GPU passes.
 *
 * Any `colorSpace` or `channel` properties on the input operand are honoured (sRGB linearization
 * and channel swizzle applied before the max reduction).
 *
 * If the input is constant (no texture), the reduction is performed on the CPU.
 *
 * When the input is the result of a previous operation (i.e. it carries a `dispose` function),
 * its intermediate texture is automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param input - Operand to reduce
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param includeAlpha - When true, alpha participates in the max and is also set to the result.
 *   Defaults to false (alpha is preserved from the input).
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function ExtractMaxChannelAsync(
    name: string,
    input: ITextureProcessOperand,
    scene: Scene,
    includeAlpha: boolean = false,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!input.texture) {
        const c = _EvalConstant(input);
        const m = includeAlpha ? Math.max(c.r, c.g, c.b, c.a) : Math.max(c.r, c.g, c.b);
        const factor = new Color4(m, m, m, includeAlpha ? m : c.a);
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(factor, outputChannelMask) : factor };
    }

    // Single input: UV transform is always propagated (no bake needed).
    const defines = [..._BuildOperandDefines(input, "A", false), "OP_CHANNEL_MAX", ...(outputChannelMask ? _BuildOutputChannelMaskDefines(outputChannelMask) : [])];
    if (includeAlpha) {
        defines.push("CHANNEL_MAX_INCLUDE_ALPHA");
    }
    if (outputColorSpace) {
        defines.push("OUTPUT_SRGB");
    }
    const pt = _CreateProcessorTexture(name, defines, _ResolveOutputSize([input]), scene, outputColorSpace);
    _SetOperandUniforms(pt, input, "textureA", "factorA", false);
    try {
        await _RenderAsync(pt);
    } catch (error) {
        input.dispose?.();
        throw error;
    }

    input.dispose?.();

    _CopyTextureMetadata(input.texture, pt, true);
    const result: ITextureProcessOperand = { texture: pt, dispose: () => pt.dispose() };
    if (outputColorSpace) {
        result.colorSpace = outputColorSpace;
    }
    return result;
}

/**
 * Extract a single channel from a texture and broadcast it to RGB (or all four components for
 * `TextureChannel.A`), producing a new texture. This is a convenience wrapper over
 * `MultiplyTexturesAsync` with a `(1,1,1,1)` factor and the requested channel swizzle applied
 * to the input.
 *
 * Swizzle results per channel:
 * - `TextureChannel.R` → (r, r, r, a)
 * - `TextureChannel.G` → (g, g, g, a)
 * - `TextureChannel.B` → (b, b, b, a)
 * - `TextureChannel.A` → (a, a, a, a)
 *
 * If the input is constant (no texture), the swizzle is applied on the CPU.
 *
 * Any `colorSpace` property on the input operand is honoured (sRGB linearization applied before
 * the swizzle). Any existing `channel` on the input is replaced by the `channel` argument.
 *
 * When the input is the result of a previous operation (i.e. it carries a `dispose` function),
 * its intermediate texture is automatically released after the GPU pass completes.
 *
 * @param name - Name for the resulting procedural texture (used only when a GPU pass is needed)
 * @param input - Operand to extract the channel from
 * @param channel - The channel to extract and broadcast
 * @param scene - Scene to create the texture in (used only when a GPU pass is needed)
 * @param outputColorSpace - Optional output color space. When `TextureColorSpace.SRGB`, the linear
 *   result is converted to sRGB (IEC 61966-2-1) before being written. Defaults to `TextureColorSpace.Linear`.
 * @param outputChannelMask - Optional bitmask of channels to write. Excluded color channels are set to
 *   `0.0`; excluded alpha is set to `1.0`. Defaults to `ChannelMask.RGBA` (all channels written).
 * @returns An operand whose `texture` holds the GPU result, or whose `factor` holds the CPU-folded constant
 */
export async function ExtractChannelAsync(
    name: string,
    input: ITextureProcessOperand,
    channel: TextureChannel,
    scene: Scene,
    outputColorSpace?: TextureColorSpace,
    outputChannelMask?: ChannelMask
): Promise<ITextureProcessOperand> {
    if (!input.texture) {
        const swizzled = _ApplyChannelSwizzle(_EvalConstant(input), channel);
        return { texture: null, factor: outputChannelMask ? _ApplyOutputChannelMask(swizzled, outputChannelMask) : swizzled };
    }
    return await MultiplyTexturesAsync(name, { ...input, channel }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene, outputColorSpace, outputChannelMask);
}
