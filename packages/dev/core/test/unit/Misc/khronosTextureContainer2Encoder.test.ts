import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EncodeTextureToKTX2Async, KhronosTextureContainer2Encoder, _GetKTX2TextureFlipY, type IKTX2EncoderOptions } from "core/Misc/khronosTextureContainer2Encoder";
import { NullEngine } from "core/Engines/nullEngine";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools.pure";
import { AutoReleaseWorkerPool } from "core/Misc/workerPool";

async function ExpectAbortAsync(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
}

async function ExpectErrorAsync(promise: Promise<unknown>, message: string | RegExp) {
    await expect(promise).rejects.toThrow(message);
}

function StubEncoder(encode: (rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions) => Uint8Array, initialize = async () => {}) {
    class Encoder {
        public static JSModule: unknown = "existing factory";
        public static WasmBinary: ArrayBuffer | null = new ArrayBuffer(2);
        public static JSModuleURL = "existing.js";
        public static WasmModuleURL = "existing.wasm";
        public readonly configuration = {
            JSModule: Encoder.JSModule,
            WasmBinary: Encoder.WasmBinary,
            JSModuleURL: Encoder.JSModuleURL,
            WasmModuleURL: Encoder.WasmModuleURL,
        };
        public _initializeAsync = initialize;
        public async encode(rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions) {
            return encode(rgba, width, height, options);
        }
    }
    vi.stubGlobal("KTX2ENCODER", { KTX2Encoder: Encoder });
    return Encoder;
}

class FakeWorker {
    public static instances: FakeWorker[] = [];
    public messages: { action: string; id: number; rgba?: Uint8Array; options?: IKTX2EncoderOptions }[] = [];
    public terminated = false;
    public transfers: Transferable[][] = [];
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;
    public onmessageerror: ((event: Event) => void) | null = null;

    constructor() {
        FakeWorker.instances.push(this);
    }

    public postMessage(message: { action: string; id: number; rgba?: Uint8Array }, transfer: Transferable[] = []) {
        this.messages.push(message);
        this.transfers.push(transfer);
        if (message.action === "init") {
            queueMicrotask(() => this.reply({ action: "init", id: message.id }));
        }
    }

    public reply(message: object) {
        this.onmessage?.(new MessageEvent("message", { data: message }));
    }

    public finish() {
        const message = this.messages.at(-1)!;
        this.reply({ action: "encoded", id: message.id, data: new Uint8Array([1, 2, 3]) });
    }

    public terminate() {
        this.terminated = true;
    }
}

describe("KhronosTextureContainer2Encoder", () => {
    let encoder: KhronosTextureContainer2Encoder;

    beforeEach(() => {
        FakeWorker.instances = [];
        vi.stubGlobal("Worker", FakeWorker);
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:encoder");
        vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        encoder = new KhronosTextureContainer2Encoder({ numWorkers: 1, wasmBinary: new ArrayBuffer(8) });
    });

    afterEach(() => {
        encoder.dispose();
        KhronosTextureContainer2Encoder.ResetDefault();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("releases idle workers, keeps active workers, and recreates them on demand", async () => {
        vi.useFakeTimers();
        const idleTime = AutoReleaseWorkerPool.DefaultOptions.idleTimeElapsedBeforeRelease;
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        await vi.advanceTimersByTimeAsync(0);
        const worker = FakeWorker.instances[0];
        worker.finish();
        await first;
        await vi.advanceTimersByTimeAsync(idleTime - 1);
        expect(worker.terminated).toBe(false);
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" });
        await vi.advanceTimersByTimeAsync(idleTime);
        expect(worker.terminated).toBe(false);
        worker.finish();
        await second;
        await vi.advanceTimersByTimeAsync(idleTime);
        expect(worker.terminated).toBe(true);
        const third = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "normal" });
        await vi.advanceTimersByTimeAsync(0);
        expect(FakeWorker.instances).toHaveLength(2);
        FakeWorker.instances[1].finish();
        await third;
        encoder.dispose();
        expect(vi.getTimerCount()).toBe(0);
    });

    it("releases an idle worker while its sibling is still encoding", async () => {
        vi.useFakeTimers();
        encoder.dispose();
        encoder = new KhronosTextureContainer2Encoder({ numWorkers: 2, wasmBinary: new ArrayBuffer(8) });
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" });
        await vi.advanceTimersByTimeAsync(0);
        const [idle, active] = FakeWorker.instances;
        idle.finish();
        await first;
        await vi.advanceTimersByTimeAsync(AutoReleaseWorkerPool.DefaultOptions.idleTimeElapsedBeforeRelease);
        try {
            expect(idle.terminated).toBe(true);
            expect(active.terminated).toBe(false);
        } finally {
            active.finish();
            await second;
        }
    });

    it("queues encodes behind the active worker and transfers their pixel buffers", async () => {
        const rgba = new Uint8Array(64);
        const first = encoder.encodeAsync(rgba, 4, 4, { usage: "color" });
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" });
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        const worker = FakeWorker.instances[0];
        expect(worker.transfers[1]).toEqual([rgba.buffer]);
        worker.finish();
        await expect(first).resolves.toEqual(new Uint8Array([1, 2, 3]));
        await vi.waitFor(() => expect(worker.messages).toHaveLength(3));
        worker.finish();
        await expect(second).resolves.toEqual(new Uint8Array([1, 2, 3]));
        expect(FakeWorker.instances).toHaveLength(1);
    });

    it("removes a cancelled queued job without terminating the active worker", async () => {
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        const abort = new AbortController();
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data", signal: abort.signal });
        const rejected = ExpectAbortAsync(second);
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        abort.abort();
        await rejected;
        expect(FakeWorker.instances[0].terminated).toBe(false);
        FakeWorker.instances[0].finish();
        await first;
        expect(FakeWorker.instances[0].messages).toHaveLength(2);
    });

    it("terminates a cancelled running worker and uses a replacement for the next job", async () => {
        const abort = new AbortController();
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color", signal: abort.signal });
        const rejected = ExpectAbortAsync(first);
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" });
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        abort.abort();
        await rejected;
        await vi.waitFor(() => expect(FakeWorker.instances[1]?.messages).toHaveLength(2));
        expect(FakeWorker.instances[0].terminated).toBe(true);
        FakeWorker.instances[1].finish();
        await second;
    });

    it.each(["error", "messageerror"])("rejects a worker %s and replaces the worker", async (event) => {
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        const rejected = ExpectErrorAsync(first, /worker/);
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" });
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        const worker = FakeWorker.instances[0];
        (event === "error" ? worker.onerror : worker.onmessageerror)?.(new Event(event));
        await rejected;
        await vi.waitFor(() => expect(FakeWorker.instances[1]?.messages).toHaveLength(2));
        FakeWorker.instances[1].finish();
        await second;
        expect(FakeWorker.instances[0].terminated).toBe(true);
    });

    it("rejects init failures with the worker's message", async () => {
        vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message) {
            this.messages.push(message);
            queueMicrotask(() => this.reply({ action: "error", id: message.id, message: "Basis initialization failed" }));
        });
        await expect(encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })).rejects.toThrow("Basis initialization failed");
        expect(FakeWorker.instances[0].terminated).toBe(true);
    });

    it("keeps the initialized worker after an encode error and ignores mismatched replies", async () => {
        const first = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        const rejected = ExpectErrorAsync(first, "invalid dimensions");
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        const worker = FakeWorker.instances[0];
        worker.reply({ action: "encoded", id: -1, data: new Uint8Array() });
        worker.reply({ action: "error", id: worker.messages[1].id, message: "invalid dimensions" });
        await rejected;
        const second = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        await vi.waitFor(() => expect(worker.messages).toHaveLength(3));
        worker.finish();
        await second;
        expect(worker.terminated).toBe(false);
    });

    it("rejects running and queued jobs on dispose and revokes its Blob URL once", async () => {
        const jobs = Array.from({ length: 64 }, () => encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" }));
        const rejected = jobs.map(async (job) => await ExpectErrorAsync(job, "disposed"));
        await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
        encoder.dispose();
        encoder.dispose();
        await Promise.all(rejected);
        expect(FakeWorker.instances[0].terminated).toBe(true);
        expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:encoder");
        await expect(encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })).rejects.toThrow("disposed");
    });

    it("rejects an already-aborted signal before allocating resources", async () => {
        const abort = new AbortController();
        abort.abort();
        await expect(encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color", signal: abort.signal })).rejects.toMatchObject({ name: "AbortError" });
        expect(FakeWorker.instances).toHaveLength(0);
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it.each([-1, 0.5, NaN, Infinity])("rejects invalid worker count %s", (numWorkers) => {
        expect(() => new KhronosTextureContainer2Encoder({ numWorkers })).toThrow("non-negative integer");
    });

    it("creates workers only when used and resets the default instance", () => {
        const first = KhronosTextureContainer2Encoder.Default;
        expect(KhronosTextureContainer2Encoder.Default).toBe(first);
        KhronosTextureContainer2Encoder.ResetDefault();
        expect(KhronosTextureContainer2Encoder.Default).not.toBe(first);
        expect(FakeWorker.instances).toHaveLength(0);
    });

    it("rejects float textures before readback", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Float32Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false, false, undefined, Constants.TEXTURETYPE_FLOAT);
        const readPixels = vi.spyOn(texture, "readPixels");
        try {
            await expect(EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder)).rejects.toThrow(/unsigned byte/);
            expect(readPixels).not.toHaveBeenCalled();
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each(["isCube", "is3D", "is2DArray", "_premulAlpha"] as const)("rejects textures with %s before readback", async (flag) => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()![flag] = true;
        const readPixels = vi.spyOn(texture, "readPixels");
        try {
            await expect(EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder)).rejects.toThrow(/2D textures|premultiplied/);
            expect(readPixels).not.toHaveBeenCalled();
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each([
        [3, 4],
        [4, 7],
        [4096, 4096],
        [16388, 4],
        [4, 16388],
    ])("rejects %s by %s textures before readback", async (width, height) => {
        const engine = new NullEngine();
        const texture = new RawTexture(null, width, height, Constants.TEXTUREFORMAT_RGBA, engine);
        const readPixels = vi.spyOn(texture, "readPixels");
        try {
            await expect(EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder)).rejects.toThrow(/multiples of 4|12,582,912|16,384/);
            expect(readPixels).not.toHaveBeenCalled();
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it("rejects engine-backed compressed textures before readback with a descriptive error", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()!.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
        const readPixels = vi.spyOn(texture, "readPixels");
        try {
            await expect(EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder)).rejects.toThrow("requires a scene");
            expect(readPixels).not.toHaveBeenCalled();
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each([
        [false, undefined, false],
        [true, undefined, true],
        [false, true, true],
        [true, false, false],
    ] as const)("uses source mipmaps %s with override %s to produce %s", async (sourceMips, generateMipmaps, expected) => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, sourceMips);
        texture.getInternalTexture()!.isReady = true;
        vi.spyOn(texture, "readPixels").mockResolvedValue(new Uint8Array(64));
        try {
            const result = EncodeTextureToKTX2Async(texture, { usage: "data", generateMipmaps }, encoder);
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
            expect(FakeWorker.instances[0].messages[1].options?.generateMipmaps).toBe(expected);
            FakeWorker.instances[0].finish();
            await result;
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each(["abort", "load error", "dispose"] as const)("settles readiness on %s", async (reason) => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()!.isReady = false;
        const abort = new AbortController();
        const readPixels = vi.spyOn(texture, "readPixels");
        try {
            if (reason === "load error") {
                vi.spyOn(texture, "loadingError", "get").mockReturnValue(true);
                vi.spyOn(texture, "errorObject", "get").mockReturnValue({ message: "load failed" });
            }
            const result = EncodeTextureToKTX2Async(texture, { usage: "data", signal: abort.signal }, encoder);
            const rejected = reason === "abort" ? ExpectAbortAsync(result) : ExpectErrorAsync(result, /load failed|disposed/);
            if (reason === "abort") {
                abort.abort();
            } else if (reason === "dispose") {
                texture.dispose();
            }
            await rejected;
            expect(readPixels).not.toHaveBeenCalled();
            expect(FakeWorker.instances).toHaveLength(0);
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it("rejects readiness when its encoder is disposed", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()!.isReady = false;
        const abort = new AbortController();
        const result = EncodeTextureToKTX2Async(texture, { usage: "data", signal: abort.signal }, encoder);
        try {
            encoder.dispose();
            await expect(Promise.race([result, new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("Readiness still pending")), 100))])).rejects.toThrow(
                "disposed"
            );
        } finally {
            abort.abort();
            texture.dispose();
            engine.dispose();
        }
    });

    it("waits for loading to finish before reading level zero", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()!.isReady = false;
        const readPixels = vi.spyOn(texture, "readPixels").mockResolvedValue(new Uint8Array(64));
        try {
            const result = EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder);
            expect(readPixels).not.toHaveBeenCalled();
            texture.getInternalTexture()!.isReady = true;
            texture.onLoadObservable.notifyObservers(texture);
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.messages).toHaveLength(2));
            expect(readPixels).toHaveBeenCalledWith(0, 0);
            FakeWorker.instances[0].finish();
            await result;
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it("aborts while GPU readback is pending", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        texture.getInternalTexture()!.isReady = true;
        const abort = new AbortController();
        vi.spyOn(texture, "readPixels").mockImplementation(async () => await new Promise(() => {}));
        try {
            const result = EncodeTextureToKTX2Async(texture, { usage: "data", signal: abort.signal }, encoder);
            const rejected = ExpectAbortAsync(result);
            await vi.waitFor(() => expect(texture.readPixels).toHaveBeenCalled());
            abort.abort();
            await rejected;
            expect(FakeWorker.instances).toHaveLength(0);
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each<{
        name: string;
        extension?: string;
        compressed?: boolean;
        invertY?: boolean;
        invertVScale?: boolean;
        renderTarget?: boolean;
        webGPU?: boolean;
        expected: boolean;
    }>([
        { name: "KTX2 fallback without upload flip", extension: ".ktx2", expected: false },
        { name: "KTX2 fallback with upload flip", extension: ".ktx2", invertY: true, expected: true },
        { name: "compressed KTX2", extension: ".ktx2", compressed: true, invertY: true, expected: false },
        { name: "compressed DDS", extension: ".dds", compressed: true, invertY: true, expected: false },
        { name: "compressed KTX1 with UV compensation", extension: ".ktx", compressed: true, invertVScale: true, expected: false },
        { name: "compressed KTX1 without UV compensation", extension: ".ktx", compressed: true, invertY: true, expected: false },
        { name: "WebGL without upload flip", expected: false },
        { name: "WebGL with upload flip", invertY: true, expected: true },
        { name: "WebGL UV compensation", invertVScale: true, expected: false },
        { name: "WebGPU with upload flip", webGPU: true, invertY: true, expected: true },
        { name: "WebGPU without upload flip", webGPU: true, expected: false },
        { name: "WebGL render target", renderTarget: true, expected: true },
        { name: "WebGPU render target", webGPU: true, renderTarget: true, expected: true },
    ])("normalizes orientation for $name", ({ extension, compressed, invertY = false, invertVScale = false, renderTarget = false, webGPU = false, expected }) => {
        const engine = new NullEngine();
        Object.defineProperty(engine, "hasOriginBottomLeft", { value: !webGPU });
        Object.defineProperty(engine, "isWebGPU", { value: webGPU });
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false, invertY);
        const internalTexture = texture.getInternalTexture()!;
        internalTexture._invertVScale = invertVScale;
        internalTexture._extension = extension ?? "";
        if (compressed) {
            internalTexture.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
        }
        texture.isRenderTarget = renderTarget;
        try {
            expect(_GetKTX2TextureFlipY(texture)).toBe(expected);
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });

    it.each([0, 1])("uses main-thread fallback with numWorkers=%s when workers are disabled or unavailable", async (numWorkers) => {
        vi.stubGlobal("Worker", numWorkers === 0 ? FakeWorker : undefined);
        const encode = vi.fn().mockReturnValue(new Uint8Array([9]));
        StubEncoder(encode);
        vi.spyOn(Tools, "LoadBabylonScriptAsync").mockResolvedValue(undefined);
        const mainThread = new KhronosTextureContainer2Encoder({ numWorkers, wasmBinary: new ArrayBuffer(8) });
        try {
            const rgba = new Uint8Array(64);
            await expect(mainThread.encodeAsync(rgba, 4, 4, { usage: "color" })).resolves.toEqual(new Uint8Array([9]));
            expect(rgba.byteLength).toBe(64);
            expect(FakeWorker.instances).toHaveLength(0);
        } finally {
            mainThread.dispose();
        }
    });

    it("isolates adapter resources and restores all standalone settings before awaiting initialization", async () => {
        const captured: Array<{ JSModule: unknown; WasmBinary: ArrayBuffer | null; JSModuleURL: string; WasmModuleURL: string }> = [];
        const encode = vi.fn().mockReturnValue(new Uint8Array([9]));
        const initialize = vi.fn(async function (this: { configuration: (typeof captured)[number] }) {
            captured.push(this.configuration);
        });
        const constructor = StubEncoder(encode, initialize);
        const original = {
            JSModule: constructor.JSModule,
            WasmBinary: constructor.WasmBinary,
            JSModuleURL: constructor.JSModuleURL,
            WasmModuleURL: constructor.WasmModuleURL,
        };
        vi.spyOn(Tools, "LoadBabylonScriptAsync").mockResolvedValue(undefined);
        const binaries = [new ArrayBuffer(4), new ArrayBuffer(8)];
        const adapters = binaries.map(
            (wasmBinary, index) => new KhronosTextureContainer2Encoder({ numWorkers: 0, wasmBinary, basisJsUrl: `https://example.test/codec${index}.js` })
        );
        try {
            await Promise.all(adapters.map(async (adapter) => await adapter.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })));
            expect(captured.map(({ JSModule, WasmBinary, JSModuleURL }) => ({ JSModule, WasmBinary, JSModuleURL }))).toEqual([
                { JSModule: null, WasmBinary: binaries[0], JSModuleURL: "https://example.test/codec0.js" },
                { JSModule: null, WasmBinary: binaries[1], JSModuleURL: "https://example.test/codec1.js" },
            ]);
            for (const key of Object.keys(original) as Array<keyof typeof original>) {
                expect(constructor[key]).toBe(original[key]);
            }
        } finally {
            adapters.forEach((adapter) => adapter.dispose());
        }
    });

    it("yields between main-thread encodes so a pending job can be cancelled", async () => {
        vi.useFakeTimers();
        const abort = new AbortController();
        const encode = vi.fn(() => {
            setTimeout(() => abort.abort(), 0);
            return new Uint8Array([9]);
        });
        StubEncoder(encode);
        vi.spyOn(Tools, "LoadBabylonScriptAsync").mockResolvedValue(undefined);
        const mainThread = new KhronosTextureContainer2Encoder({ numWorkers: 0, wasmBinary: new ArrayBuffer(8) });
        try {
            const first = mainThread.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
            const second = mainThread.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data", signal: abort.signal });
            const rejected = ExpectAbortAsync(second);
            expect(encode).not.toHaveBeenCalled();
            await vi.runAllTimersAsync();
            await expect(first).resolves.toEqual(new Uint8Array([9]));
            await rejected;
            expect(encode).toHaveBeenCalledOnce();
        } finally {
            mainThread.dispose();
            vi.useRealTimers();
        }
    });

    it.each(["abort", "dispose"] as const)("settles main-thread initialization on %s without encoding later", async (reason) => {
        const encode = vi.fn();
        let initialize: () => void = () => {};
        const create = vi.fn(async () => await new Promise<void>((resolve) => (initialize = resolve)));
        StubEncoder(encode, create);
        vi.spyOn(Tools, "LoadBabylonScriptAsync").mockResolvedValue(undefined);
        const mainThread = new KhronosTextureContainer2Encoder({ numWorkers: 0, wasmBinary: new ArrayBuffer(8) });
        const abort = new AbortController();
        try {
            const result = mainThread.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color", signal: abort.signal });
            const rejected = reason === "abort" ? ExpectAbortAsync(result) : ExpectErrorAsync(result, "disposed");
            await vi.waitFor(() => expect(create).toHaveBeenCalled());
            if (reason === "abort") {
                abort.abort();
            } else {
                mainThread.dispose();
            }
            await rejected;
            initialize();
            await new Promise((resolve) => setTimeout(resolve, 10));
            expect(encode).not.toHaveBeenCalled();
        } finally {
            mainThread.dispose();
        }
    });

    it("rejects initialization fetch errors and dispose during initialization", async () => {
        const fetchError = vi.spyOn(Tools, "LoadFileAsync").mockRejectedValue(new Error("WASM fetch failed"));
        const failed = new KhronosTextureContainer2Encoder({ numWorkers: 1 });
        await expect(failed.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })).rejects.toThrow("WASM fetch failed");
        failed.dispose();
        let rejectFetch: (error: Error) => void = () => {};
        fetchError.mockImplementation(async () => await new Promise<never>((_resolve, reject) => (rejectFetch = reject)));
        const pending = new KhronosTextureContainer2Encoder({ numWorkers: 1 });
        const result = pending.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" });
        const rejected = ExpectErrorAsync(result, "disposed");
        pending.dispose();
        await rejected;
        rejectFetch(new Error("Fetch failed after disposal"));
        await Promise.resolve();
        expect(FakeWorker.instances).toHaveLength(0);
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("settles worker construction failures", async () => {
        vi.stubGlobal(
            "Worker",
            class {
                constructor() {
                    throw new Error("Worker construction failed");
                }
            }
        );
        await expect(encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })).rejects.toThrow("Worker construction failed");
    });

    it.each(["init", "encode"])("settles %s postMessage failures and terminates the worker", async (action) => {
        const postMessage = FakeWorker.prototype.postMessage;
        vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message, transfer) {
            if (message.action === action) {
                throw new Error("Transfer failed");
            }
            postMessage.call(this, message, transfer);
        });
        await expect(encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color" })).rejects.toThrow("Transfer failed");
        expect(FakeWorker.instances[0].terminated).toBe(true);
    });

    it("aborts worker initialization and ignores its late reply", async () => {
        vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message) {
            this.messages.push(message);
        });
        const abort = new AbortController();
        const result = encoder.encodeAsync(new Uint8Array(64), 4, 4, { usage: "color", signal: abort.signal });
        const rejected = ExpectAbortAsync(result);
        await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
        const worker = FakeWorker.instances[0];
        abort.abort();
        await rejected;
        worker.reply({ action: "init", id: worker.messages[0].id });
        expect(worker.terminated).toBe(true);
        expect(worker.messages).toHaveLength(1);
    });

    it.each(["script", "factory"])("settles main-thread %s initialization errors", async (failure) => {
        const mainThread = new KhronosTextureContainer2Encoder({ numWorkers: 0, wasmBinary: new ArrayBuffer(8) });
        vi.spyOn(Tools, "LoadBabylonScriptAsync").mockImplementation(async () => {
            if (failure === "script") {
                throw new Error("Script load failed");
            }
        });
        StubEncoder(vi.fn(), vi.fn().mockRejectedValue(new Error("Factory failed")));
        try {
            await expect(mainThread.encodeAsync(new Uint8Array(64), 4, 4, { usage: "data" })).rejects.toThrow(/failed/);
        } finally {
            mainThread.dispose();
        }
    });

    it("settles a texture readiness exception and removes its disposal observer", async () => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
        vi.spyOn(texture, "isReady").mockImplementation(() => {
            throw new Error("Readiness failed");
        });
        try {
            await expect(EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder)).rejects.toThrow("Readiness failed");
            expect(texture.onDisposeObservable.hasObservers()).toBe(false);
        } finally {
            texture.dispose();
            engine.dispose();
        }
    });
});
