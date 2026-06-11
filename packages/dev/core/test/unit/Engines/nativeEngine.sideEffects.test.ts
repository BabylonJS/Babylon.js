/**
 * Regression test: importing `core/Engines/nativeEngine` (the full,
 * user-facing entry point used by Babylon Native hosts) must install
 * the `Buffers/buffer.align` side effects on `VertexBuffer.prototype`.
 *
 * Without that side effect, `NativeEngine.recordVertexBuffer` reads
 * `vertexBuffer.effectiveByteStride / effectiveByteOffset / effectiveBuffer`
 * (defined in `buffer.align.pure.ts` via `Object.defineProperty`) and
 * gets back `undefined` from the stubs in `buffer.pure.ts`, which then
 * coerces to `0` when passed to bgfx and causes the Native engine to
 * render nothing.
 *
 * Regression introduced by the `nativeEngine.pure` split (PR #18441,
 * v9.8.0): the user-facing `nativeEngine.ts` only re-exported the
 * `*.pure` chain and stopped reaching the side-effectful
 * `thinNativeEngine.ts` wrapper that pulls in `Buffers/buffer.align`.
 *
 * This test loads only `core/Engines/nativeEngine` plus the pure
 * `VertexBuffer` class (which does NOT itself pull `buffer.align`) so
 * that the assertion below is true ONLY when `nativeEngine.ts` itself
 * pulls the wrapper chain in.
 */
import "core/Engines/nativeEngine";
import { VertexBuffer } from "core/Buffers/buffer";
import { describe, expect, it } from "vitest";

describe("Engines/nativeEngine entry installs Buffers/buffer.align side effects", () => {
    it("installs real effective{ByteStride,ByteOffset,Buffer} getters on VertexBuffer.prototype", () => {
        const strideDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteStride");
        const offsetDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteOffset");
        const bufferDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveBuffer");

        expect(strideDescriptor?.get).toBeDefined();
        expect(offsetDescriptor?.get).toBeDefined();
        expect(bufferDescriptor?.get).toBeDefined();

        // Synthetic VertexBuffer-shaped object that exercises the real
        // getters from `buffer.align.pure.ts`. The pre-fix stubs from
        // `buffer.pure.ts` (installed via `_MissingSideEffectProperty`)
        // would return `undefined` for all three; the real getters must
        // return the wrapped fields below.
        const fakeUnderlyingBuffer = {};
        const fakeVertexBuffer = {
            byteStride: 12,
            byteOffset: 4,
            _alignedBuffer: undefined,
            _buffer: { getBuffer: () => fakeUnderlyingBuffer },
        };

        expect(strideDescriptor!.get!.call(fakeVertexBuffer)).toBe(12);
        expect(offsetDescriptor!.get!.call(fakeVertexBuffer)).toBe(4);
        expect(bufferDescriptor!.get!.call(fakeVertexBuffer)).toBe(fakeUnderlyingBuffer);
    });
});
