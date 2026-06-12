/**
 * Regression test: `ThinNativeEngine`'s constructor must install the
 * `Buffers/buffer.align` side effects on `VertexBuffer.prototype`.
 *
 * `ThinNativeEngine._recordVertexArrayObject` (called for every draw via
 * `bindBuffers`) reads `vertexBuffer.effectiveBuffer / effectiveByteOffset /
 * effectiveByteStride` — getters defined in `buffer.align.pure.ts`. Without
 * `RegisterBufferAlign()` running, the prototype only has the missing-side-
 * effect stubs from `buffer.pure.ts` that return `undefined`, every
 * `recordVertexBuffer(...)` call sees zero stride/offset and a null buffer,
 * and bgfx renders nothing — even though clear color still works.
 *
 * Regression introduced by PR #18441 ("Tree-shaking - the pure barrel",
 * v9.8.0): before the split, `thinNativeEngine.ts` performed
 * `import "../Buffers/buffer.align";` at the top and was the only engine
 * module. After the split the user-facing `nativeEngine.ts` only re-exports
 * the `*.pure` chain, which never reaches that side-effect import.
 *
 * Fix: `ThinNativeEngine`'s shared init (`_initializeNativeEngine`) calls
 * `RegisterBufferAlign()` (idempotent), making the engine self-sufficient.
 *
 * Verification strategy: invoke `_initializeNativeEngine` directly via the
 * prototype, with no global `_native` stub. The initializer throws when it
 * later tries to construct `_native.Engine`, but by then `RegisterBufferAlign()`
 * has already executed — exactly the property we want to assert.
 */
import { ThinNativeEngine } from "core/Engines/thinNativeEngine.pure";
import { VertexBuffer } from "core/Buffers/buffer.pure";
import { describe, expect, it } from "vitest";

type InitFn = (this: object, adaptToDeviceRatio: boolean) => void;

describe("ThinNativeEngine constructor installs Buffers/buffer.align side effects", () => {
    it("installs real effective{ByteStride,ByteOffset,Buffer} getters on VertexBuffer.prototype", () => {
        const fakeInstance = Object.create(ThinNativeEngine.prototype);
        const initialize = (ThinNativeEngine.prototype as unknown as { _initializeNativeEngine: InitFn })._initializeNativeEngine;

        try {
            initialize.call(fakeInstance, false);
        } catch {
            // Expected: no `_native` global is stubbed in this Node test env, so
            // initializer throws when it reaches `new _native.Engine(...)`.
            // `RegisterBufferAlign()` runs first, before any `_native` access,
            // so the prototype getters are already installed by the time we
            // reach the throw.
        }

        const strideDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteStride");
        const offsetDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveByteOffset");
        const bufferDescriptor = Object.getOwnPropertyDescriptor(VertexBuffer.prototype, "effectiveBuffer");

        expect(strideDescriptor?.get).toBeDefined();
        expect(offsetDescriptor?.get).toBeDefined();
        expect(bufferDescriptor?.get).toBeDefined();

        // Synthetic VertexBuffer-shaped object that exercises the real getters
        // from `buffer.align.pure.ts`. The pre-registration stubs from
        // `buffer.pure.ts` (installed via `_MissingSideEffectProperty`) would
        // return `undefined` for all three; the real getters must return the
        // wrapped fields below.
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
