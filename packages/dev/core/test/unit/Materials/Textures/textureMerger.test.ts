import { describe, it, expect, vi, beforeEach } from "vitest";
import { Constants } from "core/Engines/constants";
import { Logger } from "core/Misc/logger";
import { Matrix } from "core/Maths/math.vector.pure";
import { CreateConstantInput, CreateRGBAConfiguration, CreateTextureInput, MergeTexturesAsync } from "core/Materials/Textures/textureMerger";

const _capturedPTs = vi.hoisted(() => [] as any[]);

vi.mock("core/Materials/Textures/Procedurals/proceduralTexture.pure", () => {
    class FakeProceduralTexture {
        defines = "";
        refreshRate = 1;
        coordinatesIndex = 0;
        wrapU = Constants.TEXTURE_WRAP_ADDRESSMODE;
        wrapV = Constants.TEXTURE_WRAP_ADDRESSMODE;
        uOffset = 0;
        vOffset = 0;
        uScale = 1;
        vScale = 1;
        uAng = 0;
        vAng = 0;
        wAng = 0;
        uRotationCenter = 0.5;
        vRotationCenter = 0.5;
        wRotationCenter = 0.5;
        matrices: Record<string, unknown> = {};

        constructor() {
            _capturedPTs.push(this);
        }

        executeWhenReady(func: () => void) {
            func();
        }
        render() {}
        setTexture() {}
        setInt() {}
        setFloat() {}
        setMatrix(name: string, value: unknown) {
            this.matrices[name] = value;
        }
    }
    return { ProceduralTexture: FakeProceduralTexture };
});

function makeFakeScene() {
    return { getEngine: () => ({ isWebGPU: false }) } as any;
}

function makeFakeTexture(props: Record<string, number>, matrix = Matrix.Identity()) {
    return {
        getTextureMatrix: () => matrix,
        getSize: () => ({ width: 4, height: 4 }),
        coordinatesIndex: 0,
        wrapU: Constants.TEXTURE_WRAP_ADDRESSMODE,
        wrapV: Constants.TEXTURE_WRAP_ADDRESSMODE,
        uOffset: 0,
        vOffset: 0,
        uScale: 1,
        vScale: 1,
        uAng: 0,
        vAng: 0,
        wAng: 0,
        uRotationCenter: 0.5,
        vRotationCenter: 0.5,
        wRotationCenter: 0.5,
        ...props,
    } as any;
}

describe("TextureMerger", () => {
    beforeEach(() => {
        _capturedPTs.length = 0;
    });

    it("copies the UV set, wrap modes and texture transform from the input texture with shared sampling", async () => {
        const input = makeFakeTexture({
            coordinatesIndex: 1,
            wrapU: Constants.TEXTURE_CLAMP_ADDRESSMODE,
            wrapV: Constants.TEXTURE_MIRROR_ADDRESSMODE,
            uOffset: 0.25,
            vScale: 2,
            wAng: 0.5,
        });

        const result = await MergeTexturesAsync(
            "merged",
            {
                ...CreateRGBAConfiguration(CreateTextureInput(input, 0), CreateTextureInput(input, 1), CreateTextureInput(input, 2), CreateConstantInput(1)),
                sharedSampling: true,
            },
            makeFakeScene()
        );

        expect(result).toBe(_capturedPTs[0]);
        expect(result.coordinatesIndex).toBe(1);
        expect(result.wrapU).toBe(Constants.TEXTURE_CLAMP_ADDRESSMODE);
        expect(result.wrapV).toBe(Constants.TEXTURE_MIRROR_ADDRESSMODE);
        expect(result.uOffset).toBe(0.25);
        expect(result.vScale).toBe(2);
        expect(result.wAng).toBe(0.5);
        expect(result.defines).not.toContain("_MATRIX");
    });

    it("copies the sampling metadata without shared sampling when all inputs agree", async () => {
        const input = makeFakeTexture({ coordinatesIndex: 1, wrapU: Constants.TEXTURE_CLAMP_ADDRESSMODE, uOffset: 0.25 });

        const result = await MergeTexturesAsync("merged", CreateRGBAConfiguration(CreateTextureInput(input, 0), CreateTextureInput(input, 1)), makeFakeScene());

        expect(result.coordinatesIndex).toBe(1);
        expect(result.wrapU).toBe(Constants.TEXTURE_CLAMP_ADDRESSMODE);
        expect(result.uOffset).toBe(0.25);
    });

    it("keeps default sampling metadata and every input without shared sampling when inputs differ", async () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const occlusion = makeFakeTexture({ coordinatesIndex: 1 });
        const roughness = makeFakeTexture({ coordinatesIndex: 0, uOffset: 0.25 }, Matrix.Translation(0.25, 0, 0));

        const result = await MergeTexturesAsync("merged", CreateRGBAConfiguration(CreateTextureInput(occlusion, 0), CreateTextureInput(roughness, 0)), makeFakeScene());

        expect(result.coordinatesIndex).toBe(0);
        expect(result.uOffset).toBe(0);
        expect(result.defines).toContain("USE_TEXTURE1");
        expect(result.defines).not.toContain("TEXTURE1_MATRIX");
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("takes the sampling metadata from the first input and drops inputs on other UV sets with shared sampling", async () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const baseColor = makeFakeTexture({ coordinatesIndex: 0 });
        const opacity = makeFakeTexture({ coordinatesIndex: 1, wrapU: Constants.TEXTURE_CLAMP_ADDRESSMODE });

        const result = await MergeTexturesAsync(
            "merged",
            {
                ...CreateRGBAConfiguration(CreateTextureInput(baseColor, 0), CreateTextureInput(baseColor, 1), CreateTextureInput(baseColor, 2), CreateTextureInput(opacity, 0)),
                sharedSampling: true,
            },
            makeFakeScene()
        );

        expect(result.coordinatesIndex).toBe(0);
        expect(result.wrapU).toBe(Constants.TEXTURE_WRAP_ADDRESSMODE);
        expect(result.defines).not.toContain("ALPHA_FROM_TEXTURE");
        expect(result.defines).not.toContain("USE_TEXTURE1");
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("different UV coordinates"));
        warn.mockRestore();
    });

    it("bakes differing input transforms with shared sampling", async () => {
        const scaled = Matrix.Scaling(2, 1, 1);
        const baseColor = makeFakeTexture({ uScale: 2 }, scaled);
        const opacity = makeFakeTexture({});

        const result = await MergeTexturesAsync(
            "merged",
            { ...CreateRGBAConfiguration(CreateTextureInput(baseColor, 0), CreateConstantInput(1), CreateConstantInput(1), CreateTextureInput(opacity, 0)), sharedSampling: true },
            makeFakeScene()
        );

        expect(result.defines).toContain("TEXTURE0_MATRIX");
        expect(result.defines).not.toContain("TEXTURE1_MATRIX");
        expect(result.matrices["inputTexture0Matrix"]).toBe(scaled);
        expect(result.uScale).toBe(1);
    });
});
