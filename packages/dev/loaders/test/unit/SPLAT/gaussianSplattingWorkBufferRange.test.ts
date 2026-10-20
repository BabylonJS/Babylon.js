import { GaussianSplattingWorkBuffer } from "loaders/SPLAT/gaussianSplattingWorkBuffer";
import * as Shaders from "loaders/SPLAT/gaussianSplattingWorkBufferShaders";
import { describe, expect, it, vi } from "vitest";

const Proto = GaussianSplattingWorkBuffer.prototype as any;

const makeTexture = (): any => ({ getSize: () => ({ width: 64, height: 64 }) });

const makePack = (splatCount = 12): any => ({
    splatCount,
    version: 2,
    meansTextureL: makeTexture(),
    meansTextureU: makeTexture(),
    scalesTexture: makeTexture(),
    quatsTexture: makeTexture(),
    sh0Texture: makeTexture(),
    shLabelsTexture: makeTexture(),
    shCentroidsTexture: makeTexture(),
    meansMin: [0, 0, 0],
    meansMax: [1, 1, 1],
    shCoeffCount: 3,
});

const makeMaterial = (): any => ({
    setInt: vi.fn(),
    setTexture: vi.fn(),
    setVector3: vi.fn(),
    setVector4: vi.fn(),
    setFloat: vi.fn(),
    isReady: vi.fn(() => true),
});

const makeDecodeHost = (overrides: Record<string, unknown> = {}): any => ({
    _disposed: false,
    _capacity: 100,
    _textureSize: 10,
    _baseOffset: 0,
    _applyPack: vi.fn(),
    _applyShPack: vi.fn(),
    _applyRotPack: vi.fn(),
    _shMaterial: null,
    _shMrts: [],
    _rotMaterial: null,
    _rotMrt: null,
    _material: makeMaterial(),
    _quad: {},
    _mrt: { renderList: [], render: vi.fn() },
    _scene: { onBeforeRenderObservable: { addOnce: vi.fn() }, getEngine: () => ({ enableScissor: vi.fn(), disableScissor: vi.fn() }) },
    ...overrides,
});

describe("GaussianSplattingWorkBuffer range decode", () => {
    describe("decodeAsync validation", () => {
        it.each([
            ["source overflow", 0, 5, 10],
            ["destination overflow", 95, 0, 10],
            ["negative source offset", 0, -1, 2],
            ["negative count", 0, 0, -1],
            ["negative destination offset", -1, 0, 2],
            ["fractional source offset", 0, 1.5, 2],
            ["fractional count", 0, 0, 2.5],
            ["non-finite count", 0, 0, Infinity],
        ])("rejects a %s with a RangeError", async (_name, offset, sourceOffset, count) => {
            const host = makeDecodeHost();

            await expect(Proto.decodeAsync.call(host, makePack(12), offset, sourceOffset, count)).rejects.toBeInstanceOf(RangeError);
            expect(host._applyPack).not.toHaveBeenCalled();
        });

        it("resolves quietly for a disposed buffer even with an invalid range", async () => {
            const host = makeDecodeHost({ _disposed: true });

            await expect(Proto.decodeAsync.call(host, makePack(12), 0, 5, 10)).resolves.toBeUndefined();
            expect(host._applyPack).not.toHaveBeenCalled();
        });

        it("returns without work for an empty range", async () => {
            const host = makeDecodeHost();

            await expect(Proto.decodeAsync.call(host, makePack(12), 0, 4, 0)).resolves.toBeUndefined();
            expect(host._applyPack).not.toHaveBeenCalled();
        });

        it("does not validate the whole-file call", () => {
            const host = makeDecodeHost();
            const pack = makePack(12);

            void Proto.decodeAsync.call(host, pack, 500);

            expect(host._applyPack).toHaveBeenCalledWith(pack, 0, 12);
        });

        it("passes the range to every decode pass", () => {
            const host = makeDecodeHost({ _shMaterial: makeMaterial(), _shMrts: [{}], _rotMaterial: makeMaterial(), _rotMrt: {} });
            const pack = makePack(12);

            void Proto.decodeAsync.call(host, pack, 20, 3, 5);

            expect(host._applyPack).toHaveBeenCalledWith(pack, 3, 5);
            expect(host._applyShPack).toHaveBeenCalledWith(pack, 3, 5);
            expect(host._applyRotPack).toHaveBeenCalledWith(pack, 3, 5);
        });

        it("defaults the count to the rest of the pack when only a source offset is given", () => {
            const host = makeDecodeHost();
            const pack = makePack(12);

            void Proto.decodeAsync.call(host, pack, 0, 4);

            expect(host._applyPack).toHaveBeenCalledWith(pack, 4, 8);
        });

        it("scissors only the rows of the decoded range", async () => {
            const enableScissor = vi.fn();
            const host = makeDecodeHost({
                _scene: {
                    onBeforeRenderObservable: { addOnce: (callback: () => void) => callback() },
                    getEngine: () => ({ enableScissor, disableScissor: vi.fn() }),
                },
            });

            await Proto.decodeAsync.call(host, makePack(60), 25, 10, 30);

            expect(host._material.setInt).toHaveBeenCalledWith("uOffset", 25);
            expect(enableScissor).toHaveBeenCalledWith(0, 2, 10, 4);
        });
    });

    describe("source range uniforms", () => {
        it("binds the source offset and count in the decode material", () => {
            const host = { _material: makeMaterial(), _textureSize: 128 };

            Proto._applyPack.call(host, makePack(12), 7, 3);

            expect(host._material.setInt).toHaveBeenCalledWith("uSourceOffset", 7);
            expect(host._material.setInt).toHaveBeenCalledWith("uCount", 3);
        });

        it("binds the source offset and count in the SH material", () => {
            const host = { _shMaterial: makeMaterial(), _textureSize: 128 };

            Proto._applyShPack.call(host, makePack(12), 7, 3);

            expect(host._shMaterial.setInt).toHaveBeenCalledWith("uSourceOffset", 7);
            expect(host._shMaterial.setInt).toHaveBeenCalledWith("uCount", 3);
        });

        it("binds the source offset and count in the rotation material", () => {
            const host = { _rotMaterial: makeMaterial(), _textureSize: 128 };

            Proto._applyRotPack.call(host, makePack(12), 7, 3);

            expect(host._rotMaterial.setInt).toHaveBeenCalledWith("uSourceOffset", 7);
            expect(host._rotMaterial.setInt).toHaveBeenCalledWith("uCount", 3);
        });

        it("keeps a whole-pack decode at source offset 0 with the pack splat count", () => {
            const host = makeDecodeHost({ _shMaterial: makeMaterial(), _shMrts: [{}], _rotMaterial: makeMaterial(), _rotMrt: {} });
            const pack = makePack(12);
            void Proto.decodeAsync.call(host, pack, 0);
            const [, sourceOffset, count] = host._applyPack.mock.calls[0];
            const material = makeMaterial();

            Proto._applyPack.call({ _material: material, _textureSize: 128 }, pack, sourceOffset, count);

            expect(material.setInt).toHaveBeenCalledWith("uSourceOffset", 0);
            expect(material.setInt).toHaveBeenCalledWith("uCount", 12);
        });
    });

    describe("shader sources", () => {
        it.each([
            ["decode GLSL", Shaders.GaussianSplattingWorkBufferFragmentShaderGLSL, "uniform int uSourceOffset;", "int k = global - uOffset + uSourceOffset;"],
            [
                "decode WGSL",
                Shaders.GaussianSplattingWorkBufferFragmentShaderWGSL,
                "uniform uSourceOffset : i32;",
                "let k : i32 = global - uniforms.uOffset + uniforms.uSourceOffset;",
            ],
            ["rotation GLSL", Shaders.GaussianSplattingWorkBufferRotationDecodeFragmentShaderGLSL, "uniform int uSourceOffset;", "int k = global - uOffset + uSourceOffset;"],
            [
                "rotation WGSL",
                Shaders.GaussianSplattingWorkBufferRotationDecodeFragmentShaderWGSL,
                "uniform uSourceOffset : i32;",
                "let k : i32 = global - uniforms.uOffset + uniforms.uSourceOffset;",
            ],
            ["SH GLSL", Shaders.GaussianSplattingWorkBufferShDecodeFragmentShaderGLSL, "uniform int uSourceOffset;", "int kLocal = global - uOffset + uSourceOffset;"],
            [
                "SH WGSL",
                Shaders.GaussianSplattingWorkBufferShDecodeFragmentShaderWGSL,
                "uniform uSourceOffset : i32;",
                "let kLocal : i32 = global - uniforms.uOffset + uniforms.uSourceOffset;",
            ],
        ])("%s declares and applies uSourceOffset", (_name, source, declaration, index) => {
            expect(source).toContain(declaration);
            expect(source).toContain(index);
        });
    });
});
