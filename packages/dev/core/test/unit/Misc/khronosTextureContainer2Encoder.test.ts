import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultKTX2EncoderOptions, KhronosTextureContainer2Encoder, _GetKTX2TextureFlipY, type IKTX2EncoderOptions } from "core/Misc/khronosTextureContainer2Encoder";
import { type IKTX2EncoderModule } from "core/Misc/khronosTextureContainer2EncoderWorker";
import { NullEngine } from "core/Engines/nullEngine";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools.pure";
import { AutoReleaseWorkerPool } from "core/Misc/workerPool";

type Message = { action: string; id?: number; rgba?: Uint8Array; options?: IKTX2EncoderOptions; wasmBinary?: ArrayBuffer; jsEncoderModuleUrl?: string; basisJsUrl?: string };

const OriginalURLConfig = { ...KhronosTextureContainer2Encoder.URLConfig };

async function ExpectAbortAsync(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
}

function ResetEncoder() {
    const statics = KhronosTextureContainer2Encoder as unknown as Record<string, unknown>;
    statics._WorkerPoolPromise = undefined;
    statics._MainThreadSettings = undefined;
    statics._MainThreadEncoderPromise = undefined;
    KhronosTextureContainer2Encoder.WorkerPool = undefined;
    KhronosTextureContainer2Encoder.URLConfig = { ...OriginalURLConfig };
    KhronosTextureContainer2Encoder.DefaultEncoderOptions = new DefaultKTX2EncoderOptions();
}

function StubEncoder(encode: (rgba: Uint8Array, width: number, height: number, options: IKTX2EncoderOptions) => Uint8Array, initialize = async () => {}) {
    class Encoder {
        public static JSModule: unknown = "existing factory";
        public static WasmBinary: ArrayBuffer | null = new ArrayBuffer(2);
        public static JSModuleURL = "existing.js";
        public static WasmModuleURL = "existing.wasm";
        public static DefaultEncoderOptions = {};
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
    return Encoder;
}

class FakeWorker {
    public static instances: FakeWorker[] = [];
    public static initError?: string;
    public messages: Message[] = [];
    public transfers: Transferable[][] = [];
    public terminated = false;
    private readonly _listeners = new Map<string, Set<(event: Event) => void>>();

    constructor() {
        FakeWorker.instances.push(this);
    }

    public addEventListener(type: string, listener: (event: Event) => void) {
        const listeners = this._listeners.get(type) ?? new Set();
        listeners.add(listener);
        this._listeners.set(type, listeners);
    }

    public removeEventListener(type: string, listener: (event: Event) => void) {
        this._listeners.get(type)?.delete(listener);
    }

    public get listenerCount() {
        return [...this._listeners.values()].reduce((count, listeners) => count + listeners.size, 0);
    }

    public postMessage(message: Message, transfer: Transferable[] = []) {
        this.messages.push(message);
        this.transfers.push(transfer);
        if (message.action === "init") {
            const error = FakeWorker.initError;
            queueMicrotask(() => this.reply(error ? { action: "error", id: message.id, message: error } : { action: "init", id: message.id }));
        }
    }

    public fail(message: string) {
        this._listeners.get("error")?.forEach((listener) => listener({ type: "error", message } as unknown as ErrorEvent));
    }

    public reply(data: object) {
        this._listeners.get("message")?.forEach((listener) => listener(new MessageEvent("message", { data })));
    }

    public get encodes() {
        return this.messages.filter((message) => message.action === "encode");
    }

    public finish(error?: string) {
        const message = this.encodes.at(-1)!;
        this.reply(error ? { action: "error", id: message.id, message: error } : { action: "encoded", id: message.id, data: new Uint8Array([1, 2, 3]) });
    }

    public terminate() {
        this.terminated = true;
    }
}

describe("KhronosTextureContainer2Encoder", () => {
    let engine: NullEngine;

    function CreateTexture(generateMipMaps = false, invertY = false) {
        const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, generateMipMaps, invertY);
        texture.getInternalTexture()!.isReady = true;
        vi.spyOn(texture, "readPixels").mockImplementation(async () => new Uint8Array(64));
        return texture;
    }

    beforeEach(() => {
        ResetEncoder();
        FakeWorker.instances = [];
        FakeWorker.initError = undefined;
        vi.stubGlobal("Worker", FakeWorker);
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:encoder");
        vi.spyOn(Tools, "LoadFileAsync").mockResolvedValue(new ArrayBuffer(8));
        engine = new NullEngine();
    });

    afterEach(() => {
        engine.dispose();
        ResetEncoder();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    describe("configuration", () => {
        it.each([-1, 1.5, Number.NaN])("rejects numWorkers %s", (numWorkers) => {
            expect(() => new KhronosTextureContainer2Encoder(numWorkers)).toThrow("non-negative integer");
            expect(() => new KhronosTextureContainer2Encoder({ numWorkers })).toThrow("non-negative integer");
        });

        it("defers loading and worker creation until the first encode", () => {
            new KhronosTextureContainer2Encoder(2);
            expect(FakeWorker.instances).toHaveLength(0);
            expect(Tools.LoadFileAsync).not.toHaveBeenCalled();
            expect(URL.createObjectURL).toHaveBeenCalledOnce();
        });

        it.each(["jsEncoderModule", "jsBasisEncoder"] as const)("rejects %s with automatic workers", (key) => {
            const binariesAndModulesContainer = { [key]: key === "jsEncoderModule" ? ({} as IKTX2EncoderModule) : () => ({}) };
            expect(() => new KhronosTextureContainer2Encoder({ numWorkers: 1, binariesAndModulesContainer })).toThrow("numWorkers: 0");
            expect(() => new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer })).not.toThrow();
        });

        it("keeps the first automatic configuration", async () => {
            const texture = CreateTexture();
            const worker = new KhronosTextureContainer2Encoder(1);
            const ignored = new KhronosTextureContainer2Encoder(0);
            const results = [worker._encodeAsync(texture, { usage: "color" }), ignored._encodeAsync(texture, { usage: "color" })];
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            FakeWorker.instances[0].finish();
            await vi.waitFor(() => expect(FakeWorker.instances[0].encodes).toHaveLength(2));
            FakeWorker.instances[0].finish();
            await Promise.all(results);
            expect(FakeWorker.instances).toHaveLength(1);
            expect(URL.createObjectURL).toHaveBeenCalledOnce();
        });

        it("resolves URLConfig and clones injected WASM without detaching it", async () => {
            KhronosTextureContainer2Encoder.URLConfig = {
                jsEncoderModule: "https://example.test/encoder.js",
                jsBasisEncoder: "https://example.test/basis.js",
                wasmBasisEncoder: "https://example.test/basis.wasm",
            };
            const wasmBasisEncoder = new ArrayBuffer(16);
            const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 1, binariesAndModulesContainer: { wasmBasisEncoder } });
            const result = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            const worker = FakeWorker.instances[0];
            const init = worker.messages[0];
            expect(init).toMatchObject({
                action: "init",
                jsEncoderModuleUrl: Tools.GetBabylonScriptURL("https://example.test/encoder.js", true),
                basisJsUrl: Tools.GetBabylonScriptURL("https://example.test/basis.js", true),
            });
            expect(init.wasmBinary).not.toBe(wasmBasisEncoder);
            expect(init.wasmBinary!.byteLength).toBe(16);
            expect(worker.transfers[0]).toEqual([]);
            expect(wasmBasisEncoder.byteLength).toBe(16);
            expect(Tools.LoadFileAsync).not.toHaveBeenCalled();
            worker.finish();
            await result;
        });

        it("loads the configured WASM URL once for automatic workers", async () => {
            KhronosTextureContainer2Encoder.URLConfig.wasmBasisEncoder = "https://example.test/custom.wasm";
            const encoder = new KhronosTextureContainer2Encoder(2);
            const texture = CreateTexture();
            const results = [encoder._encodeAsync(texture, { usage: "color" }), encoder._encodeAsync(texture, { usage: "data" })];
            await vi.waitFor(() => expect(FakeWorker.instances.map((worker) => worker.encodes.length)).toEqual([1, 1]));
            FakeWorker.instances.forEach((worker) => worker.finish());
            await Promise.all(results);
            expect(Tools.LoadFileAsync).toHaveBeenCalledOnce();
            expect(Tools.LoadFileAsync).toHaveBeenCalledWith(Tools.GetBabylonScriptURL("https://example.test/custom.wasm", true));
        });
    });

    describe("DefaultEncoderOptions", () => {
        it("tracks dirty state and snapshots only defined values", () => {
            const defaults = new DefaultKTX2EncoderOptions();
            expect(defaults._getKTX2EncoderOptions()).toEqual({});
            expect(defaults.isDirty).toBe(false);
            defaults.etc1sQualityLevel = undefined;
            expect(defaults.isDirty).toBe(false);
            defaults.etc1sCompressionLevel = 0;
            defaults.zstandard = false;
            expect(defaults.isDirty).toBe(true);
            expect(defaults._getKTX2EncoderOptions()).toEqual({ etc1sCompressionLevel: 0, zstandard: false });
            defaults.zstandard = undefined;
            expect(defaults._getKTX2EncoderOptions()).toEqual({ etc1sCompressionLevel: 0 });
        });

        it("sends a complete snapshot before every worker encode so clears propagate", async () => {
            const defaults = KhronosTextureContainer2Encoder.DefaultEncoderOptions;
            defaults.uastcQualityLevel = 0;
            defaults.zstandard = false;
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "data", zstandard: true });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            const worker = FakeWorker.instances[0];
            worker.finish();
            await first;
            defaults.zstandard = undefined;
            const second = encoder._encodeAsync(texture, { usage: "data" });
            await vi.waitFor(() => expect(worker.encodes).toHaveLength(2));
            worker.finish();
            await second;
            expect(worker.messages.map(({ action, options }) => (action === "encode" ? action : { action, options }))).toEqual([
                { action: "init", options: undefined },
                { action: "setDefaultEncoderOptions", options: { uastcQualityLevel: 0, zstandard: false } },
                "encode",
                { action: "setDefaultEncoderOptions", options: { uastcQualityLevel: 0 } },
                "encode",
            ]);
            expect(worker.encodes[0].options).toMatchObject({ zstandard: true });
        });

        it("assigns the current snapshot before every main-thread encode", async () => {
            const Encoder = StubEncoder(() => new Uint8Array([9]));
            const encoder = new KhronosTextureContainer2Encoder({
                numWorkers: 0,
                binariesAndModulesContainer: { jsEncoderModule: { KTX2Encoder: Encoder }, wasmBasisEncoder: new ArrayBuffer(8) },
            });
            KhronosTextureContainer2Encoder.DefaultEncoderOptions.etc1sQualityLevel = 1;
            // A worker snapshot elsewhere can clear the dirty flag before this job runs.
            KhronosTextureContainer2Encoder.DefaultEncoderOptions._getKTX2EncoderOptions();
            await encoder._encodeAsync(CreateTexture(), { usage: "color" });
            expect(Encoder.DefaultEncoderOptions).toEqual({ etc1sQualityLevel: 1 });
            KhronosTextureContainer2Encoder.DefaultEncoderOptions.etc1sQualityLevel = undefined;
            await encoder._encodeAsync(CreateTexture(), { usage: "color" });
            expect(Encoder.DefaultEncoderOptions).toEqual({});
        });
    });

    describe("worker pool", () => {
        it("transfers readback pixels and initializes each worker once", async () => {
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            const second = encoder._encodeAsync(texture, { usage: "data" });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            const worker = FakeWorker.instances[0];
            expect(worker.transfers.at(-1)).toEqual([worker.encodes[0].rgba!.buffer]);
            worker.finish();
            await expect(first).resolves.toEqual(new Uint8Array([1, 2, 3]));
            await vi.waitFor(() => expect(worker.encodes).toHaveLength(2));
            worker.finish();
            await second;
            expect(worker.messages.filter((message) => message.action === "init")).toHaveLength(1);
            expect(worker.listenerCount).toBe(0);
        });

        it("rejects initialization failures and retries on the next job", async () => {
            FakeWorker.initError = "Init failed";
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            await expect(encoder._encodeAsync(texture, { usage: "color" })).rejects.toThrow("Init failed");
            FakeWorker.initError = undefined;
            const result = encoder._encodeAsync(texture, { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances[0].encodes).toHaveLength(1));
            FakeWorker.instances[0].finish();
            await result;
            expect(FakeWorker.instances).toHaveLength(1);
            expect(FakeWorker.instances[0].terminated).toBe(false);
        });

        it("rejects WASM fetch failures and retries the fetch", async () => {
            vi.mocked(Tools.LoadFileAsync).mockRejectedValueOnce(new Error("WASM fetch failed"));
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            await expect(encoder._encodeAsync(texture, { usage: "color" })).rejects.toThrow("WASM fetch failed");
            const result = encoder._encodeAsync(texture, { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances[0].encodes).toHaveLength(1));
            FakeWorker.instances[0].finish();
            await result;
            expect(Tools.LoadFileAsync).toHaveBeenCalledTimes(2);
        });

        it("rejects worker startup errors raised while the WASM is loading", async () => {
            let resolveWasm: (data: ArrayBuffer) => void = () => {};
            vi.mocked(Tools.LoadFileAsync).mockReturnValueOnce(new Promise((resolve) => (resolveWasm = resolve)));
            const encoder = new KhronosTextureContainer2Encoder(1);
            const result = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances).toHaveLength(1));
            FakeWorker.instances[0].fail("Worker script failed");
            resolveWasm(new ArrayBuffer(8));
            await expect(result).rejects.toThrow("Worker script failed");
        });

        it("rejects encode errors, keeps the worker, and removes its listeners", async () => {
            const encoder = new KhronosTextureContainer2Encoder(1);
            const result = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            const worker = FakeWorker.instances[0];
            worker.reply({ action: "encoded", id: -1, data: new Uint8Array() });
            worker.finish("Encode failed");
            await expect(result).rejects.toThrow("Encode failed");
            expect(worker.terminated).toBe(false);
            expect(worker.listenerCount).toBe(0);
        });

        it.each(["init", "encode"])("rejects %s postMessage failures", async (action) => {
            const postMessage = FakeWorker.prototype.postMessage;
            vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message, transfer) {
                if (message.action === action) {
                    throw new Error("Transfer failed");
                }
                postMessage.call(this, message, transfer);
            });
            const encoder = new KhronosTextureContainer2Encoder(1);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).rejects.toThrow("Transfer failed");
            expect(FakeWorker.instances[0].listenerCount).toBe(0);
        });

        it("rejects worker construction failures", async () => {
            vi.stubGlobal(
                "Worker",
                class {
                    constructor() {
                        throw new Error("Worker construction failed");
                    }
                }
            );
            const encoder = new KhronosTextureContainer2Encoder(1);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).rejects.toThrow("Worker construction failed");
        });

        it("skips a cancelled queued job", async () => {
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            const abort = new AbortController();
            const second = encoder._encodeAsync(texture, { usage: "data", signal: abort.signal });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            await vi.waitFor(() => expect(texture.readPixels).toHaveBeenCalledTimes(2));
            abort.abort();
            await ExpectAbortAsync(second);
            const worker = FakeWorker.instances[0];
            worker.finish();
            await first;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(worker.encodes).toHaveLength(1);
            expect(worker.terminated).toBe(false);
        });

        it("rejects a cancelled active job promptly and releases its worker only after the worker finishes", async () => {
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const abort = new AbortController();
            const first = encoder._encodeAsync(texture, { usage: "color", signal: abort.signal });
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            const worker = FakeWorker.instances[0];
            const second = encoder._encodeAsync(texture, { usage: "data" });
            abort.abort();
            await ExpectAbortAsync(first);
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(worker.encodes).toHaveLength(1);
            expect(worker.terminated).toBe(false);
            worker.finish();
            await vi.waitFor(() => expect(worker.encodes).toHaveLength(2));
            worker.finish();
            await expect(second).resolves.toEqual(new Uint8Array([1, 2, 3]));
        });

        it("rejects an already-aborted signal before readback", async () => {
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const abort = new AbortController();
            abort.abort();
            await ExpectAbortAsync(encoder._encodeAsync(texture, { usage: "color", signal: abort.signal }));
            expect(texture.readPixels).not.toHaveBeenCalled();
            expect(FakeWorker.instances).toHaveLength(0);
        });

        it.each(["option", "static"] as const)("uses a caller-prepared %s pool without initializing or disposing it", async (source) => {
            const worker = new FakeWorker();
            const pool = new AutoReleaseWorkerPool(1, async () => worker as unknown as Worker);
            const dispose = vi.spyOn(pool, "dispose");
            if (source === "static") {
                KhronosTextureContainer2Encoder.WorkerPool = pool;
            }
            const encoder = new KhronosTextureContainer2Encoder(source === "option" ? { workerPool: pool, numWorkers: -1 } : -1);
            const result = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            await vi.waitFor(() => expect(worker.encodes).toHaveLength(1));
            worker.finish();
            await result;
            expect(worker.messages.map((message) => message.action)).toEqual(["setDefaultEncoderOptions", "encode"]);
            expect(dispose).not.toHaveBeenCalled();
            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });

        it("keeps the pool a job started with", async () => {
            const [first, second] = [new FakeWorker(), new FakeWorker()];
            const encoder = new KhronosTextureContainer2Encoder({ workerPool: new AutoReleaseWorkerPool(1, async () => first as unknown as Worker) });
            const texture = CreateTexture();
            texture.getInternalTexture()!.isReady = false;
            const result = encoder._encodeAsync(texture, { usage: "color" });
            new KhronosTextureContainer2Encoder({ workerPool: new AutoReleaseWorkerPool(1, async () => second as unknown as Worker) });
            texture.getInternalTexture()!.isReady = true;
            texture.onLoadObservable.notifyObservers(texture);
            await vi.waitFor(() => expect(first.encodes).toHaveLength(1));
            first.finish();
            await result;
            expect(second.messages).toHaveLength(0);
        });
    });

    describe("main thread", () => {
        it.each([0, 1])("encodes on the main thread with numWorkers=%s when workers are disabled or unavailable", async (numWorkers) => {
            vi.stubGlobal("Worker", numWorkers === 0 ? FakeWorker : undefined);
            const encode = vi.fn().mockReturnValue(new Uint8Array([9]));
            vi.stubGlobal("KTX2ENCODER", { KTX2Encoder: StubEncoder(encode) });
            const encoder = new KhronosTextureContainer2Encoder(numWorkers);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).resolves.toEqual(new Uint8Array([9]));
            expect(FakeWorker.instances).toHaveLength(0);
            expect(Tools.LoadFileAsync).toHaveBeenCalledWith(Tools.GetBabylonScriptURL(KhronosTextureContainer2Encoder.URLConfig.wasmBasisEncoder, true));
        });

        it("uses injected dependencies and restores standalone settings before awaiting initialization", async () => {
            const captured: unknown[] = [];
            const initialize = vi.fn(async function (this: { configuration: unknown }) {
                captured.push(this.configuration);
            });
            const Encoder = StubEncoder(() => new Uint8Array([9]), initialize);
            const original = { JSModule: Encoder.JSModule, WasmBinary: Encoder.WasmBinary, JSModuleURL: Encoder.JSModuleURL, WasmModuleURL: Encoder.WasmModuleURL };
            const jsBasisEncoder = () => ({});
            const wasmBasisEncoder = new ArrayBuffer(4);
            KhronosTextureContainer2Encoder.URLConfig.jsBasisEncoder = "https://example.test/codec.js";
            const load = vi.spyOn(Tools, "LoadBabylonScriptAsync");
            const encoder = new KhronosTextureContainer2Encoder({
                numWorkers: 0,
                binariesAndModulesContainer: { jsEncoderModule: { KTX2Encoder: Encoder }, jsBasisEncoder, wasmBasisEncoder },
            });
            await encoder._encodeAsync(CreateTexture(), { usage: "color" });
            expect(captured).toEqual([expect.objectContaining({ JSModule: jsBasisEncoder, WasmBinary: wasmBasisEncoder, JSModuleURL: "https://example.test/codec.js" })]);
            expect({ JSModule: Encoder.JSModule, WasmBinary: Encoder.WasmBinary, JSModuleURL: Encoder.JSModuleURL, WasmModuleURL: Encoder.WasmModuleURL }).toEqual(original);
            expect(load).not.toHaveBeenCalled();
            expect(Tools.LoadFileAsync).not.toHaveBeenCalled();
        });

        it("yields between main-thread encodes so a pending job can be cancelled", async () => {
            const abort = new AbortController();
            const encode = vi.fn(() => {
                abort.abort();
                return new Uint8Array([9]);
            });
            const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: { jsEncoderModule: { KTX2Encoder: StubEncoder(encode) } } });
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            const second = encoder._encodeAsync(texture, { usage: "data", signal: abort.signal });
            await expect(first).resolves.toEqual(new Uint8Array([9]));
            await ExpectAbortAsync(second);
            expect(encode).toHaveBeenCalledOnce();
        });

        it.each(["script", "factory"])("rejects main-thread %s initialization errors", async (failure) => {
            vi.spyOn(Tools, "LoadBabylonScriptAsync").mockRejectedValue(new Error("Script load failed"));
            const jsEncoderModule = failure === "factory" ? { KTX2Encoder: StubEncoder(vi.fn(), vi.fn().mockRejectedValue(new Error("Factory failed"))) } : undefined;
            const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: { jsEncoderModule } });
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "data" })).rejects.toThrow(/failed/);
        });
    });

    describe("texture", () => {
        let encoder: KhronosTextureContainer2Encoder;

        beforeEach(() => {
            encoder = new KhronosTextureContainer2Encoder(1);
        });

        it("rejects float textures before readback", async () => {
            const texture = new RawTexture(new Float32Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false, false, undefined, Constants.TEXTURETYPE_FLOAT);
            const readPixels = vi.spyOn(texture, "readPixels");
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow(/unsigned byte/);
            expect(readPixels).not.toHaveBeenCalled();
        });

        it.each(["isCube", "is3D", "is2DArray", "_premulAlpha"] as const)("rejects textures with %s before readback", async (flag) => {
            const texture = CreateTexture();
            texture.getInternalTexture()![flag] = true;
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow(/2D textures|premultiplied/);
            expect(texture.readPixels).not.toHaveBeenCalled();
        });

        it.each([
            [3, 4],
            [4, 7],
            [4096, 4096],
            [16388, 4],
            [4, 16388],
        ])("rejects %s by %s textures before readback", async (width, height) => {
            const texture = new RawTexture(null, width, height, Constants.TEXTUREFORMAT_RGBA, engine);
            const readPixels = vi.spyOn(texture, "readPixels");
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow(/multiples of 4|12,582,912|16,384/);
            expect(readPixels).not.toHaveBeenCalled();
        });

        it("rejects engine-backed compressed textures before readback with a descriptive error", async () => {
            const texture = CreateTexture();
            texture.getInternalTexture()!.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow("requires a scene");
            expect(texture.readPixels).not.toHaveBeenCalled();
        });

        it.each([
            [{ usage: "color", etc1sQualityLevel: 0 }, /etc1sQualityLevel/],
            [{ usage: "color", zstandard: true }, /UASTC options/],
            [{ usage: "other" }, /usage/],
        ] as const)("validates per-call options %j before readback", async (options, message) => {
            const texture = CreateTexture();
            await expect(encoder._encodeAsync(texture, options as unknown as IKTX2EncoderOptions)).rejects.toThrow(message);
            expect(texture.readPixels).not.toHaveBeenCalled();
        });

        it.each([
            [false, false, false, false],
            [true, false, true, false],
            [false, true, false, true],
        ])("derives mipmaps from source mipmaps %s and flipY from invertY %s", async (sourceMips, invertY, generateMipmaps, flipY) => {
            const texture = CreateTexture(sourceMips, invertY);
            const options = { usage: "data", generateMipmaps: !generateMipmaps, flipY: !flipY } as unknown as IKTX2EncoderOptions;
            const result = encoder._encodeAsync(texture, options);
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            expect(FakeWorker.instances[0].encodes[0].options).toMatchObject({ usage: "data", generateMipmaps, flipY });
            expect(texture.readPixels).toHaveBeenCalledWith(0, 0);
            FakeWorker.instances[0].finish();
            await result;
        });

        it.each(["abort", "load error", "dispose"] as const)("settles readiness on %s", async (reason) => {
            const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
            texture.getInternalTexture()!.isReady = false;
            const abort = new AbortController();
            const readPixels = vi.spyOn(texture, "readPixels");
            if (reason === "load error") {
                vi.spyOn(texture, "loadingError", "get").mockReturnValue(true);
                vi.spyOn(texture, "errorObject", "get").mockReturnValue({ message: "load failed" });
            }
            const result = encoder._encodeAsync(texture, { usage: "data", signal: abort.signal });
            const rejected = reason === "abort" ? ExpectAbortAsync(result) : expect(result).rejects.toThrow(/load failed|disposed/);
            if (reason === "abort") {
                abort.abort();
            } else if (reason === "dispose") {
                texture.dispose();
            }
            await rejected;
            expect(readPixels).not.toHaveBeenCalled();
            expect(FakeWorker.instances).toHaveLength(0);
        });

        it("waits for loading to finish before reading level zero", async () => {
            const texture = CreateTexture();
            texture.getInternalTexture()!.isReady = false;
            const result = encoder._encodeAsync(texture, { usage: "data" });
            expect(texture.readPixels).not.toHaveBeenCalled();
            texture.getInternalTexture()!.isReady = true;
            texture.onLoadObservable.notifyObservers(texture);
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            FakeWorker.instances[0].finish();
            await result;
        });

        it("aborts while GPU readback is pending", async () => {
            const texture = CreateTexture();
            const abort = new AbortController();
            vi.mocked(texture.readPixels).mockImplementation(async () => await new Promise(() => {}));
            const result = encoder._encodeAsync(texture, { usage: "data", signal: abort.signal });
            const rejected = ExpectAbortAsync(result);
            await vi.waitFor(() => expect(texture.readPixels).toHaveBeenCalled());
            abort.abort();
            await rejected;
            expect(FakeWorker.instances).toHaveLength(0);
        });

        it("settles a texture readiness exception and removes its disposal observer", async () => {
            const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine);
            vi.spyOn(texture, "isReady").mockImplementation(() => {
                throw new Error("Readiness failed");
            });
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow("Readiness failed");
            expect(texture.onDisposeObservable.hasObservers()).toBe(false);
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
            expect(_GetKTX2TextureFlipY(texture)).toBe(expected);
        });
    });
});
