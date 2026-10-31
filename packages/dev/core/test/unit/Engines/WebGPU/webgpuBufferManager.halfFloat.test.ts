import { Constants } from "core/Engines/constants";
import { WebGPUBufferManager } from "core/Engines/WebGPU/webgpuBufferManager";
import { FromHalfFloat } from "core/Misc/textureTools";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// readDataFromBuffer on a mapped GPU buffer holding the given bytes: the engine and the device are not used on this path
const read = async (bytes: ArrayBuffer, width: number, height: number, bytesPerRow: number, bytesPerRowAligned: number, buffer: Float32Array | null = null) => {
    const manager = new WebGPUBufferManager({ uniqueId: 1, isDisposed: false } as any, {} as any);
    const gpuBuffer = { mapAsync: async () => {}, getMappedRange: () => bytes, unmap: () => {}, destroy: () => {} } as unknown as GPUBuffer;
    return (await manager.readDataFromBuffer(
        gpuBuffer,
        bytes.byteLength,
        width,
        height,
        bytesPerRow,
        bytesPerRowAligned,
        Constants.TEXTURETYPE_HALF_FLOAT,
        0,
        buffer,
        false
    )) as Float32Array;
};

// Float16Array is missing from some supported runtimes (Node 22): the cases that need the native one are skipped there, the fallback's
// always run
const hasFloat16Array = typeof (globalThis as any).Float16Array !== "undefined";

describe("WebGPU half-float readback", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.skipIf(!hasFloat16Array)("converts with the browser's Float16Array where it exists, once per readback", async () => {
        const native = (globalThis as any).Float16Array;
        let made = 0;
        vi.stubGlobal(
            "Float16Array",
            class extends native {
                constructor(...args: any[]) {
                    super(...args);
                    made++;
                }
            }
        );

        await read(new Uint16Array([0x3c00, 0x4000, 0x4200, 0x4400]).buffer, 1, 1, 8, 8);

        expect(made).toBe(1);
    });
});

// every case runs with the browser's Float16Array and with the loop used where Float16Array is missing
describe.each([
    ["with Float16Array", false],
    ["without Float16Array", true],
])("WebGPU half-float readback, %s", (_, withoutFloat16Array) => {
    // with Float16Array: only where the runtime has it
    const skipNative = !withoutFloat16Array && !hasFloat16Array;

    beforeEach(() => {
        if (withoutFloat16Array) {
            vi.stubGlobal("Float16Array", undefined);
        }
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.skipIf(skipNative)("converts every half-float bit pattern to the value FromHalfFloat gives", async () => {
        const patterns = Uint16Array.from({ length: 65536 }, (_, i) => i);
        // 16384 RGBA texels in one row
        const data = await read(patterns.buffer, 16384, 1, 16384 * 8, 16384 * 8);

        expect(data).toBeInstanceOf(Float32Array);
        expect(data.length).toBe(65536);
        let differing = 0;
        for (let i = 0; i < 65536; i++) {
            if (!Object.is(data[i], FromHalfFloat(i))) {
                differing++;
            }
        }
        expect(differing).toBe(0);
    });

    it.skipIf(skipNative)("gives zeros, infinities, NaN, subnormals and the largest values", async () => {
        const values = new Uint16Array([0x0000, 0x8000, 0x7c00, 0xfc00, 0x7e00, 0x0001, 0x8001, 0x03ff, 0x0400, 0x7bff, 0xfbff, 0x3c00]);
        const data = await read(values.buffer, 3, 1, 24, 24);

        expect(Object.is(data[0], 0)).toBe(true);
        expect(Object.is(data[1], -0)).toBe(true);
        expect(data[2]).toBe(Infinity);
        expect(data[3]).toBe(-Infinity);
        expect(data[4]).toBeNaN();
        expect(data[5]).toBe(2 ** -24);
        expect(data[6]).toBe(-(2 ** -24));
        expect(data[7]).toBe(1023 * 2 ** -24);
        expect(data[8]).toBe(2 ** -14);
        expect(data[9]).toBe(65504);
        expect(data[10]).toBe(-65504);
        expect(data[11]).toBe(1);
    });

    it.skipIf(skipNative)("writes into a given destination as many values as it holds", async () => {
        const values = Uint16Array.from({ length: 8 }, (_, i) => 0x3c00 + i);
        const destination = new Float32Array(6).fill(-7);

        const data = await read(values.buffer, 2, 1, 16, 16, destination);

        expect(data).toBe(destination);
        expect(Array.from(destination)).toEqual(Array.from(values.subarray(0, 6), (value) => FromHalfFloat(value)));
    });

    it.skipIf(skipNative)("drops the padding of rows aligned to 256 bytes", async () => {
        // 2 rows of 3 RGBA texels (24 bytes), each row starting every 256 bytes; the padding holds NaN
        const width = 3,
            height = 2,
            aligned = 256;
        const bytes = new Uint16Array((aligned * height) / 2).fill(0x7e00);
        for (let y = 0; y < height; y++) {
            for (let i = 0; i < width * 4; i++) {
                bytes[(y * aligned) / 2 + i] = 0x3c00 + y * 16 + i;
            }
        }

        const data = await read(bytes.buffer, width, height, width * 8, aligned);

        expect(data.length).toBe(width * 4 * height);
        for (let y = 0; y < height; y++) {
            for (let i = 0; i < width * 4; i++) {
                expect(data[y * width * 4 + i]).toBe(FromHalfFloat(0x3c00 + y * 16 + i));
            }
        }
    });
});
