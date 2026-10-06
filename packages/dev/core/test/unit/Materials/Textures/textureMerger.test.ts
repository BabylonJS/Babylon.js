import { describe, it, expect, vi, beforeEach } from "vitest";
import { Constants } from "core/Engines/constants";
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
    }
    return { ProceduralTexture: FakeProceduralTexture };
});

function makeFakeScene() {
    return { getEngine: () => ({ isWebGPU: false }) } as any;
}

function makeFakeTexture(props: Record<string, number>) {
    return {
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
        ...props,
    } as any;
}

describe("TextureMerger", () => {
    beforeEach(() => {
        _capturedPTs.length = 0;
    });

    it("copies the UV set, wrap modes and texture transform from the input texture", async () => {
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
            CreateRGBAConfiguration(CreateTextureInput(input, 0), CreateTextureInput(input, 1), CreateTextureInput(input, 2), CreateConstantInput(1)),
            makeFakeScene()
        );

        expect(result).toBe(_capturedPTs[0]);
        expect(result.coordinatesIndex).toBe(1);
        expect(result.wrapU).toBe(Constants.TEXTURE_CLAMP_ADDRESSMODE);
        expect(result.wrapV).toBe(Constants.TEXTURE_MIRROR_ADDRESSMODE);
        expect(result.uOffset).toBe(0.25);
        expect(result.vScale).toBe(2);
        expect(result.wAng).toBe(0.5);
    });
});
