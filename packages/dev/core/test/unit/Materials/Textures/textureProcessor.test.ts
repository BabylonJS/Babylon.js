/**
 * Tests for textureProcessor.ts.
 *
 * The processor has two execution paths:
 *
 *   CPU path  – both operands are constant (texture: null). All math happens in JavaScript
 *               and no ProceduralTexture is ever created. Tests here need no engine or scene.
 *
 *   GPU path  – at least one operand carries a texture. A ProceduralTexture is created,
 *               shader defines and uniforms are set, then the texture is rendered.
 *               ProceduralTexture is mocked below so these tests run without a WebGL context.
 *               Pixel-level correctness (OUTPUT_SRGB waveform, bilinear accuracy, etc.)
 *               requires a real GPU and belongs in the visualization test suite.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Color4 } from "core/Maths/math.color";
import {
    MultiplyTexturesAsync,
    MaxTexturesAsync,
    LerpTexturesAsync,
    InvertTextureAsync,
    ExtractMaxChannelAsync,
    ExtractChannelAsync,
    CreateFactorOperand,
    ChannelMask,
    TextureChannel,
    TextureColorSpace,
    type ITextureProcessOperand,
} from "core/Materials/Textures/textureProcessor";

// ── sRGB helpers (IEC 61966-2-1, mirrors the shader formulas) ─────────────────

/**
 * sRGB → linear (matches OPERAND_X_SRGB in the fragment shader)
 * @param v - sRGB-encoded value in [0, 1]
 * @returns Linear value
 */
function srgbToLinear(v: number): number {
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/**
 * linear → sRGB (matches OUTPUT_SRGB in the fragment shader)
 * @param v - Linear value in [0, 1]
 * @returns sRGB-encoded value
 */
function linearToSrgb(v: number): number {
    return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

// ── ProceduralTexture mock ─────────────────────────────────────────────────────
//
// Vitest hoists vi.mock() calls before any imports execute, so variables referenced
// inside the factory must also be hoisted with vi.hoisted().

const _capturedPTs = vi.hoisted(() => [] as InstanceType<ReturnType<typeof _makeFakePTClass>>[]); // filled by constructor

// Factory separated so TypeScript can infer the instance type for assertions.
function _makeFakePTClass() {
    const fakeEffect = {
        executeWhenCompiled(cb: (e: unknown) => void) {
            cb(fakeEffect);
        },
        isReady: () => true,
    };

    class FakeProceduralTexture {
        name: string;
        defines: string = "";
        refreshRate: number = 1;

        // UV-transform metadata copied by _CopyTextureMetadata
        coordinatesIndex: number = 0;
        wrapU: number = 1;
        wrapV: number = 1;
        uOffset: number = 0;
        vOffset: number = 0;
        uScale: number = 1;
        vScale: number = 1;
        wAng: number = 0;

        disposed: boolean = false;

        constructor(name: string, _size: unknown, _shader: string, _scene: unknown, _options: unknown) {
            this.name = name;
            _capturedPTs.push(this);
        }

        isReady() {
            return true;
        }
        getEffect() {
            return fakeEffect;
        }
        /**
         * Return null so _RenderAsync skips the scene.proceduralTextures splice.
         * @returns null
         */
        getScene() {
            return null;
        }
        render() {}
        dispose() {
            this.disposed = true;
        }

        // Required when this PT is later passed as an operand to another operation.
        getSize() {
            return { width: 4, height: 4 };
        }
        getTextureMatrix() {
            // Identity — no UV transform on a freshly-created output texture.
            return { isIdentity: () => true, equals: (other: any) => other === this.getTextureMatrix() };
        }

        setTexture(_name: string, _tex: unknown) {}
        setColor4(_name: string, _val: unknown) {}
        setMatrix(_name: string, _mat: unknown) {}

        /**
         * Parse the #define block into a plain string array for convenient assertions.
         * @returns Array of define names
         */
        getDefines(): string[] {
            return this.defines
                .split("\n")
                .map((l) => l.replace(/^#define\s+/, "").trim())
                .filter(Boolean);
        }
    }

    return FakeProceduralTexture;
}

vi.mock("core/Materials/Textures/Procedurals/proceduralTexture", () => ({
    ProceduralTexture: _makeFakePTClass(),
}));

// ── Fake scene / engine helpers ───────────────────────────────────────────────

/**
 * Minimal scene stub required by _CreateProcessorTexture.
 * Only `scene.getEngine().isWebGPU` is accessed before the ProceduralTexture
 * constructor (which is mocked), so this is the only thing we need.
 * @returns Minimal scene-like object
 */
function makeFakeScene() {
    return {
        getEngine: () => ({ isWebGPU: false }),
    } as any;
}

// ── Fake-texture helper ───────────────────────────────────────────────────────

interface FakeTextureOpts {
    /** UV translation x (non-zero makes the transform non-identity) */
    uOffset?: number;
    vOffset?: number;
    uScale?: number;
    vScale?: number;
    wAng?: number;
    /** Unique id used by equals() – two textures with the same id share the same transform */
    matId?: number;
}

let _nextMatId = 0;

/**
 * Create a minimal texture-like object that satisfies the surface checked by textureProcessor
 * internals (_HasNonIdentityTransform, _AllTransformsMatch, _CopyTextureMetadata, _ResolveOutputSize).
 * @param opts - Optional UV transform and identity overrides
 * @returns Minimal texture-like object
 */
function makeFakeTexture(opts: FakeTextureOpts = {}): ITextureProcessOperand["texture"] {
    const uOffset = opts.uOffset ?? 0;
    const vOffset = opts.vOffset ?? 0;
    const uScale = opts.uScale ?? 1;
    const vScale = opts.vScale ?? 1;
    const wAng = opts.wAng ?? 0;
    const matId = opts.matId ?? _nextMatId++;

    const isId = uOffset === 0 && vOffset === 0 && uScale === 1 && vScale === 1 && wAng === 0;

    // Fake Matrix: only isIdentity() and equals() are called by textureProcessor.
    const mat: { isIdentity: () => boolean; equals: (other: any) => boolean; _matId: number } = {
        isIdentity: () => isId,
        equals: (other: typeof mat) => other._matId === matId,
        _matId: matId,
    };

    return {
        getSize: () => ({ width: 4, height: 4 }),
        getTextureMatrix: () => mat,
        // Properties read by _CopyTextureMetadata
        coordinatesIndex: 0,
        wrapU: 1,
        wrapV: 1,
        uOffset,
        vOffset,
        uScale,
        vScale,
        wAng,
    } as unknown as ITextureProcessOperand["texture"];
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("TextureProcessor", () => {
    let scene: any;

    beforeEach(() => {
        _capturedPTs.length = 0;
        _nextMatId = 0;
        scene = makeFakeScene();
    });

    // ── 1. CPU constant fold ───────────────────────────────────────────────────

    describe("CPU constant fold — no GPU pass", () => {
        it("Multiply: computes component-wise product and returns texture:null", async () => {
            const a = CreateFactorOperand(new Color4(0.5, 0.4, 0.3, 0.2));
            const b = CreateFactorOperand(new Color4(2.0, 0.5, 1.0, 0.0));
            const r = await MultiplyTexturesAsync("t", a, b, scene);

            expect(r.texture).toBeNull();
            expect(r.dispose).toBeUndefined();
            expect(r.factor?.r).toBeCloseTo(1.0); // 0.5 * 2.0
            expect(r.factor?.g).toBeCloseTo(0.2); // 0.4 * 0.5
            expect(r.factor?.b).toBeCloseTo(0.3); // 0.3 * 1.0
            expect(r.factor?.a).toBeCloseTo(0.0); // 0.2 * 0.0
            expect(_capturedPTs).toHaveLength(0); // no GPU pass
        });

        it("Max: computes component-wise maximum", async () => {
            const a = CreateFactorOperand(new Color4(0.2, 0.8, 0.1, 0.5));
            const b = CreateFactorOperand(new Color4(0.6, 0.3, 0.9, 0.5));
            const r = await MaxTexturesAsync("t", a, b, scene);

            expect(r.texture).toBeNull();
            expect(r.factor?.r).toBeCloseTo(0.6);
            expect(r.factor?.g).toBeCloseTo(0.8);
            expect(r.factor?.b).toBeCloseTo(0.9);
            expect(r.factor?.a).toBeCloseTo(0.5);
        });

        it("Lerp: t=0 returns a", async () => {
            const a = CreateFactorOperand(new Color4(0.2, 0.4, 0.6, 0.8));
            const b = CreateFactorOperand(new Color4(1.0, 1.0, 1.0, 1.0));
            const t = CreateFactorOperand(new Color4(0.0, 0.0, 0.0, 0.0));
            const r = await LerpTexturesAsync("t", a, b, t, scene);

            expect(r.texture).toBeNull();
            expect(r.factor?.r).toBeCloseTo(0.2);
            expect(r.factor?.g).toBeCloseTo(0.4);
            expect(r.factor?.b).toBeCloseTo(0.6);
            expect(r.factor?.a).toBeCloseTo(0.8);
        });

        it("Lerp: t=1 returns b", async () => {
            const a = CreateFactorOperand(new Color4(0.0, 0.0, 0.0, 0.0));
            const b = CreateFactorOperand(new Color4(0.3, 0.6, 0.9, 0.5));
            const t = CreateFactorOperand(new Color4(1.0, 1.0, 1.0, 1.0));
            const r = await LerpTexturesAsync("t", a, b, t, scene);

            expect(r.factor?.r).toBeCloseTo(0.3);
            expect(r.factor?.g).toBeCloseTo(0.6);
            expect(r.factor?.b).toBeCloseTo(0.9);
            expect(r.factor?.a).toBeCloseTo(0.5);
        });

        it("Lerp: t=0.5 returns midpoint", async () => {
            const a = CreateFactorOperand(new Color4(0.0, 0.0, 0.0, 0.0));
            const b = CreateFactorOperand(new Color4(1.0, 1.0, 1.0, 1.0));
            const t = CreateFactorOperand(new Color4(0.5, 0.5, 0.5, 0.5));
            const r = await LerpTexturesAsync("t", a, b, t, scene);

            expect(r.factor?.r).toBeCloseTo(0.5);
            expect(r.factor?.g).toBeCloseTo(0.5);
            expect(r.factor?.b).toBeCloseTo(0.5);
            expect(r.factor?.a).toBeCloseTo(0.5);
        });

        it("Invert: RGBA (default) inverts all four channels", async () => {
            const r = await InvertTextureAsync("t", CreateFactorOperand(new Color4(0.2, 0.4, 0.6, 0.8)), scene);

            expect(r.texture).toBeNull();
            expect(r.factor?.r).toBeCloseTo(0.8);
            expect(r.factor?.g).toBeCloseTo(0.6);
            expect(r.factor?.b).toBeCloseTo(0.4);
            expect(r.factor?.a).toBeCloseTo(0.2);
        });

        it("Invert: ChannelMask.R inverts only R, leaves G B A unchanged", async () => {
            const r = await InvertTextureAsync("t", CreateFactorOperand(new Color4(0.2, 0.4, 0.6, 0.8)), scene, ChannelMask.R);

            expect(r.factor?.r).toBeCloseTo(0.8); // 1 − 0.2
            expect(r.factor?.g).toBeCloseTo(0.4); // unchanged
            expect(r.factor?.b).toBeCloseTo(0.6); // unchanged
            expect(r.factor?.a).toBeCloseTo(0.8); // unchanged
        });

        it("Invert: ChannelMask.RGB inverts R G B, leaves A unchanged", async () => {
            const r = await InvertTextureAsync("t", CreateFactorOperand(new Color4(0.2, 0.4, 0.6, 0.8)), scene, ChannelMask.RGB);

            expect(r.factor?.r).toBeCloseTo(0.8);
            expect(r.factor?.g).toBeCloseTo(0.6);
            expect(r.factor?.b).toBeCloseTo(0.4);
            expect(r.factor?.a).toBeCloseTo(0.8); // unchanged
        });

        it("ExtractMaxChannel: broadcasts max(r,g,b) to RGB, preserves alpha", async () => {
            const r = await ExtractMaxChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.7, 0.5, 0.9)), scene);

            expect(r.texture).toBeNull();
            expect(r.factor?.r).toBeCloseTo(0.7);
            expect(r.factor?.g).toBeCloseTo(0.7);
            expect(r.factor?.b).toBeCloseTo(0.7);
            expect(r.factor?.a).toBeCloseTo(0.9); // alpha preserved
        });

        it("ExtractMaxChannel: includeAlpha=true includes alpha in max and broadcasts to all", async () => {
            const r = await ExtractMaxChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.7, 0.5, 0.9)), scene, true);

            expect(r.factor?.r).toBeCloseTo(0.9); // max(0.3, 0.7, 0.5, 0.9) = 0.9
            expect(r.factor?.a).toBeCloseTo(0.9); // broadcast to alpha too
        });

        it("ExtractChannel: R broadcasts r to RGB, preserves alpha", async () => {
            const r = await ExtractChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.5, 0.7, 0.9)), TextureChannel.R, scene);

            expect(r.texture).toBeNull();
            expect(r.factor?.r).toBeCloseTo(0.3);
            expect(r.factor?.g).toBeCloseTo(0.3);
            expect(r.factor?.b).toBeCloseTo(0.3);
            expect(r.factor?.a).toBeCloseTo(0.9); // alpha preserved
        });

        it("ExtractChannel: G broadcasts g to RGB, preserves alpha", async () => {
            const r = await ExtractChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.5, 0.7, 0.9)), TextureChannel.G, scene);

            expect(r.factor?.r).toBeCloseTo(0.5);
            expect(r.factor?.g).toBeCloseTo(0.5);
            expect(r.factor?.b).toBeCloseTo(0.5);
            expect(r.factor?.a).toBeCloseTo(0.9);
        });

        it("ExtractChannel: A broadcasts alpha to all four channels", async () => {
            const r = await ExtractChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.5, 0.7, 0.9)), TextureChannel.A, scene);

            expect(r.factor?.r).toBeCloseTo(0.9);
            expect(r.factor?.g).toBeCloseTo(0.9);
            expect(r.factor?.b).toBeCloseTo(0.9);
            expect(r.factor?.a).toBeCloseTo(0.9);
        });

        describe("outputChannelMask", () => {
            it("ChannelMask.RGBA passes all channels unchanged", async () => {
                const r = await MultiplyTexturesAsync(
                    "t",
                    CreateFactorOperand(new Color4(0.5, 0.6, 0.7, 0.8)),
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    scene,
                    undefined,
                    ChannelMask.RGBA
                );
                expect(r.factor?.r).toBeCloseTo(0.5);
                expect(r.factor?.g).toBeCloseTo(0.6);
                expect(r.factor?.b).toBeCloseTo(0.7);
                expect(r.factor?.a).toBeCloseTo(0.8);
            });

            it("ChannelMask.RGB forces alpha to 1.0", async () => {
                const r = await MultiplyTexturesAsync(
                    "t",
                    CreateFactorOperand(new Color4(0.5, 0.5, 0.5, 0.5)),
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    scene,
                    undefined,
                    ChannelMask.RGB
                );
                expect(r.factor?.r).toBeCloseTo(0.5);
                expect(r.factor?.g).toBeCloseTo(0.5);
                expect(r.factor?.b).toBeCloseTo(0.5);
                expect(r.factor?.a).toBe(1.0);
            });

            it("ChannelMask.R zeros G and B, forces alpha to 1.0", async () => {
                const r = await MultiplyTexturesAsync(
                    "t",
                    CreateFactorOperand(new Color4(0.5, 0.6, 0.7, 0.8)),
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    scene,
                    undefined,
                    ChannelMask.R
                );
                expect(r.factor?.r).toBeCloseTo(0.5);
                expect(r.factor?.g).toBe(0);
                expect(r.factor?.b).toBe(0);
                expect(r.factor?.a).toBe(1.0);
            });

            it("ChannelMask.A zeros RGB", async () => {
                const r = await MultiplyTexturesAsync(
                    "t",
                    CreateFactorOperand(new Color4(0.5, 0.6, 0.7, 0.8)),
                    CreateFactorOperand(new Color4(1, 1, 1, 1)),
                    scene,
                    undefined,
                    ChannelMask.A
                );
                expect(r.factor?.r).toBe(0);
                expect(r.factor?.g).toBe(0);
                expect(r.factor?.b).toBe(0);
                expect(r.factor?.a).toBeCloseTo(0.8);
            });

            it("outputChannelMask applies to Invert CPU path", async () => {
                // Invert all, then mask to RGB only → alpha becomes 1
                const r = await InvertTextureAsync("t", CreateFactorOperand(new Color4(0.2, 0.4, 0.6, 0.8)), scene, ChannelMask.RGBA, undefined, ChannelMask.RGB);
                expect(r.factor?.r).toBeCloseTo(0.8);
                expect(r.factor?.g).toBeCloseTo(0.6);
                expect(r.factor?.b).toBeCloseTo(0.4);
                expect(r.factor?.a).toBe(1.0);
            });

            it("outputChannelMask applies to ExtractMaxChannel CPU path", async () => {
                // Max channel of (0.3, 0.7, 0.5) = 0.7; mask to RGB → alpha 1
                const r = await ExtractMaxChannelAsync("t", CreateFactorOperand(new Color4(0.3, 0.7, 0.5, 0.9)), scene, false, undefined, ChannelMask.RGB);
                expect(r.factor?.r).toBeCloseTo(0.7);
                expect(r.factor?.a).toBe(1.0);
            });
        });
    });

    // ── 2. sRGB formula round-trip ─────────────────────────────────────────────
    //
    // These tests verify the IEC 61966-2-1 formulas used in the shaders are
    // mathematically correct. Pixel-level GPU correctness requires a visualization test.

    describe("sRGB formula round-trip (IEC 61966-2-1)", () => {
        const keyValues = [0, 0.04045, 0.5, 1.0];

        for (const v of keyValues) {
            it(`linearToSrgb(srgbToLinear(${v})) ≈ ${v}`, () => {
                expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 5);
            });
        }

        it("srgbToLinear: 0 → 0, 1 → 1", () => {
            expect(srgbToLinear(0)).toBeCloseTo(0);
            expect(srgbToLinear(1)).toBeCloseTo(1);
        });

        it("linearToSrgb: 0 → 0, 1 → 1", () => {
            expect(linearToSrgb(0)).toBeCloseTo(0);
            expect(linearToSrgb(1)).toBeCloseTo(1);
        });

        it("srgbToLinear is monotonically increasing", () => {
            const samples = [0, 0.04045, 0.1, 0.5, 0.9, 1.0];
            for (let i = 1; i < samples.length; i++) {
                expect(srgbToLinear(samples[i])).toBeGreaterThan(srgbToLinear(samples[i - 1]));
            }
        });
    });

    // ── 3. GPU path structure ──────────────────────────────────────────────────
    //
    // These tests use a mocked ProceduralTexture so they run without WebGL.
    // They verify that the correct shader defines are set and that the result
    // carries a texture and a dispose function.

    describe("GPU path structure (single-texture operand)", () => {
        it("returns non-null texture and dispose function", async () => {
            const tex = makeFakeTexture();
            const r = await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(r.texture).not.toBeNull();
            expect(typeof r.dispose).toBe("function");
            expect(r.factor).toBeUndefined();
            expect(_capturedPTs).toHaveLength(1); // exactly one GPU pass
        });

        it("dispose() releases the underlying ProceduralTexture", async () => {
            const tex = makeFakeTexture();
            const r = await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].disposed).toBe(false);
            r.dispose!();
            expect(_capturedPTs[0].disposed).toBe(true);
        });

        it("emits OUTPUT_SRGB define when outputColorSpace=SRGB", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene, TextureColorSpace.SRGB);

            expect(_capturedPTs[0].getDefines()).toContain("OUTPUT_SRGB");
        });

        it("does not emit OUTPUT_SRGB define when outputColorSpace is omitted", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].getDefines()).not.toContain("OUTPUT_SRGB");
        });

        it("sets result.colorSpace when outputColorSpace=SRGB", async () => {
            const tex = makeFakeTexture();
            const r = await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene, TextureColorSpace.SRGB);

            expect(r.colorSpace).toBe(TextureColorSpace.SRGB);
        });

        it("emits OPERAND_A_TEXTURE define for texture operand", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].getDefines()).toContain("OPERAND_A_TEXTURE");
        });

        it("emits OPERAND_A_SRGB define when input colorSpace=SRGB", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex, colorSpace: TextureColorSpace.SRGB }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].getDefines()).toContain("OPERAND_A_SRGB");
        });

        it("emits OPERAND_A_CHANNEL_G define when input channel=G", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex, channel: TextureChannel.G }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].getDefines()).toContain("OPERAND_A_CHANNEL_G");
        });

        it("emits OUTPUT_MASK_A_ONE define for ChannelMask.RGB", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene, undefined, ChannelMask.RGB);

            const defs = _capturedPTs[0].getDefines();
            expect(defs).toContain("OUTPUT_MASK_A_ONE");
            expect(defs).not.toContain("OUTPUT_MASK_R_ZERO");
            expect(defs).not.toContain("OUTPUT_MASK_G_ZERO");
            expect(defs).not.toContain("OUTPUT_MASK_B_ZERO");
        });

        it("emits no output-mask defines for ChannelMask.RGBA", async () => {
            const tex = makeFakeTexture();
            await MultiplyTexturesAsync("t", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene, undefined, ChannelMask.RGBA);

            const defs = _capturedPTs[0].getDefines();
            expect(defs).not.toContain("OUTPUT_MASK_R_ZERO");
            expect(defs).not.toContain("OUTPUT_MASK_G_ZERO");
            expect(defs).not.toContain("OUTPUT_MASK_B_ZERO");
            expect(defs).not.toContain("OUTPUT_MASK_A_ONE");
        });

        it("InvertTextureAsync emits OP_INVERT and per-channel defines", async () => {
            const tex = makeFakeTexture();
            await InvertTextureAsync("t", { texture: tex }, scene, ChannelMask.RGB);

            const defs = _capturedPTs[0].getDefines();
            expect(defs).toContain("OP_INVERT");
            expect(defs).toContain("INVERT_R");
            expect(defs).toContain("INVERT_G");
            expect(defs).toContain("INVERT_B");
            expect(defs).not.toContain("INVERT_A");
        });

        it("ExtractMaxChannelAsync emits OP_CHANNEL_MAX, no CHANNEL_MAX_INCLUDE_ALPHA by default", async () => {
            const tex = makeFakeTexture();
            await ExtractMaxChannelAsync("t", { texture: tex }, scene);

            const defs = _capturedPTs[0].getDefines();
            expect(defs).toContain("OP_CHANNEL_MAX");
            expect(defs).not.toContain("CHANNEL_MAX_INCLUDE_ALPHA");
        });

        it("ExtractMaxChannelAsync emits CHANNEL_MAX_INCLUDE_ALPHA when requested", async () => {
            const tex = makeFakeTexture();
            await ExtractMaxChannelAsync("t", { texture: tex }, scene, true);

            expect(_capturedPTs[0].getDefines()).toContain("CHANNEL_MAX_INCLUDE_ALPHA");
        });

        it("auto-disposes intermediate texture when result is consumed as operand", async () => {
            const tex = makeFakeTexture();

            // Pass first result directly as operand to second operation.
            const intermediate = await MultiplyTexturesAsync("pass1", { texture: tex }, CreateFactorOperand(new Color4(1, 1, 1, 1)), scene);

            expect(_capturedPTs[0].disposed).toBe(false);

            const tex2 = makeFakeTexture();
            await MultiplyTexturesAsync("pass2", intermediate, { texture: tex2 }, scene);

            // The intermediate PT should have been disposed by the second pass.
            expect(_capturedPTs[0].disposed).toBe(true);
        });
    });

    // ── 4. UV-transform propagation ────────────────────────────────────────────

    describe("UV transform propagation", () => {
        it("matching transforms: UV offset is propagated to result, no MATRIX defines", async () => {
            // Both operands share the same texture (and therefore the same transform).
            const tex = makeFakeTexture({ uOffset: 0.25, vOffset: 0.1 });
            const r = await MultiplyTexturesAsync("t", { texture: tex }, { texture: tex }, scene);

            // _CopyTextureMetadata is called with includeTransform=true
            const pt = _capturedPTs[0];
            expect(pt.uOffset).toBeCloseTo(0.25);
            expect(pt.vOffset).toBeCloseTo(0.1);

            // bakeTransform=false → no MATRIX defines emitted
            expect(pt.getDefines()).not.toContain("OPERAND_A_MATRIX");
            expect(pt.getDefines()).not.toContain("OPERAND_B_MATRIX");

            // The result operand should carry the texture (not be a constant)
            expect(r.texture).not.toBeNull();
        });

        it("differing transforms: result has identity UV, defines include MATRIX for both operands", async () => {
            // Two textures with different (non-identity) UV transforms.
            const texA = makeFakeTexture({ uOffset: 0.25, matId: 1 });
            const texB = makeFakeTexture({ uOffset: 0.5, matId: 2 });
            await MultiplyTexturesAsync("t", { texture: texA }, { texture: texB }, scene);

            const pt = _capturedPTs[0];

            // _CopyTextureMetadata is called with includeTransform=false → UV stays at defaults
            expect(pt.uOffset).toBe(0);
            expect(pt.vOffset).toBe(0);

            // bakeTransform=true → MATRIX defines are emitted so the shader applies them
            expect(pt.getDefines()).toContain("OPERAND_A_MATRIX");
            expect(pt.getDefines()).toContain("OPERAND_B_MATRIX");
        });

        it("single-texture operand: UV transform always propagated (InvertTextureAsync)", async () => {
            const tex = makeFakeTexture({ uOffset: 0.3 });
            await InvertTextureAsync("t", { texture: tex }, scene);

            const pt = _capturedPTs[0];
            expect(pt.uOffset).toBeCloseTo(0.3);
            // Single operand → bakeTransform=false always, no MATRIX define
            expect(pt.getDefines()).not.toContain("OPERAND_A_MATRIX");
        });
    });
});
