import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultKTX2EncoderOptions, KhronosTextureContainer2Encoder, _GetKTX2TextureFlipY, type IKTX2EncoderOptions } from "core/Misc/khronosTextureContainer2Encoder";
import { NullEngine } from "core/Engines/nullEngine";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools.pure";
import { AutoReleaseWorkerPool } from "core/Misc/workerPool";

type Message = { action: string; id?: number; rgba?: Uint8Array; options?: IKTX2EncoderOptions; wasmBinary?: ArrayBuffer; jsEncoderModuleUrl?: string; basisJsUrl?: string };

const OriginalURLConfig = { ...KhronosTextureContainer2Encoder.URLConfig };

async function ExpectAbortAsync(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
}

async function ExpectFailureAsync(promise: Promise<unknown>, message: string | RegExp) {
    await expect(promise).rejects.toThrow(message);
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
    public failed = false;
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
        if (this.failed || this.terminated) {
            return;
        }
        if (message.action === "init") {
            const error = FakeWorker.initError;
            queueMicrotask(() => this.reply(error ? { action: "error", id: message.id, message: error } : { action: "init", id: message.id }));
        }
    }

    public fail(message: string, type = "error") {
        this.failed = true;
        const event = Object.assign(new Event(type), { message });
        this._listeners.get(type)?.forEach((listener) => listener(event));
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

// The replacement serves pending jobs, then three later submissions, before the idle-release timer advances.
async function ExpectReplacementServesJobsAsync(failed: FakeWorker, pending: Promise<Uint8Array>[], submit: () => Promise<Uint8Array>) {
    const now = Date.now();
    const messageCount = failed.messages.length;
    for (let i = 0; i < pending.length + 3; i++) {
        const job = pending[i] ?? submit();
        await vi.advanceTimersByTimeAsync(0);
        expect(FakeWorker.instances).toHaveLength(2);
        expect(FakeWorker.instances[1].encodes).toHaveLength(i + 1);
        FakeWorker.instances[1].finish();
        await expect(job).resolves.toEqual(new Uint8Array([1, 2, 3]));
    }
    expect(failed.terminated).toBe(true);
    expect(failed.listenerCount).toBe(0);
    expect(failed.messages).toHaveLength(messageCount);
    expect(Date.now()).toBe(now);
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
        it("rejects invalid worker counts and JavaScript injection with automatic workers", () => {
            const binariesAndModulesContainer = { jsBasisEncoder: () => ({}) };
            expect(() => new KhronosTextureContainer2Encoder(-1)).toThrow("non-negative integer");
            expect(() => new KhronosTextureContainer2Encoder({ numWorkers: 1, binariesAndModulesContainer })).toThrow("numWorkers: 0");
            expect(() => new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer })).not.toThrow();
        });

        it("defers loading until encode and keeps the first automatic configuration", async () => {
            KhronosTextureContainer2Encoder.URLConfig.wasmBasisEncoder = "https://example.test/custom.wasm";
            const encoder = new KhronosTextureContainer2Encoder(2);
            const ignored = new KhronosTextureContainer2Encoder(0);
            expect(FakeWorker.instances).toHaveLength(0);
            expect(Tools.LoadFileAsync).not.toHaveBeenCalled();
            const texture = CreateTexture();
            const results = [encoder._encodeAsync(texture, { usage: "color" }), ignored._encodeAsync(texture, { usage: "data" })];
            await vi.waitFor(() => expect(FakeWorker.instances.map((worker) => worker.encodes.length)).toEqual([1, 1]));
            FakeWorker.instances.forEach((worker) => worker.finish());
            await Promise.all(results);
            expect(URL.createObjectURL).toHaveBeenCalledOnce();
            expect(Tools.LoadFileAsync).toHaveBeenCalledExactlyOnceWith(Tools.GetBabylonScriptURL("https://example.test/custom.wasm", true));
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
            expect(worker.listenerCount).toBe(2);
        });

        it("retries WASM loading and initialization on the same worker after failures", async () => {
            vi.mocked(Tools.LoadFileAsync).mockRejectedValueOnce(new Error("WASM fetch failed"));
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            await ExpectFailureAsync(encoder._encodeAsync(texture, { usage: "color" }), "WASM fetch failed");
            FakeWorker.initError = "Init failed";
            await ExpectFailureAsync(encoder._encodeAsync(texture, { usage: "color" }), "Init failed");
            FakeWorker.initError = undefined;
            const result = encoder._encodeAsync(texture, { usage: "color" });
            await vi.waitFor(() => expect(FakeWorker.instances[0].encodes).toHaveLength(1));
            FakeWorker.instances[0].finish();
            await result;
            expect(Tools.LoadFileAsync).toHaveBeenCalledTimes(2);
            expect(FakeWorker.instances).toHaveLength(1);
            expect(FakeWorker.instances[0].terminated).toBe(false);
        });

        it("replaces a worker that fails during startup", async () => {
            vi.useFakeTimers();
            let resolveWasm: (data: ArrayBuffer) => void = () => {};
            vi.mocked(Tools.LoadFileAsync).mockReturnValueOnce(new Promise((resolve) => (resolveWasm = resolve)));
            const encoder = new KhronosTextureContainer2Encoder(1);
            const submit = () => encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(submit(), "Worker script failed");
            const queued = submit();
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            failed.fail("Worker script failed");
            await rejected;
            expect(failed.messages).toHaveLength(0);
            resolveWasm(new ArrayBuffer(8));
            await ExpectReplacementServesJobsAsync(failed, [queued], submit);
        });

        it("replaces a worker after an uncaught error during an encode", async () => {
            vi.useFakeTimers();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const submit = () => encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(submit(), "Worker crashed");
            const queued = submit();
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            expect(failed.encodes).toHaveLength(1);
            failed.fail("Worker crashed");
            await rejected;
            await ExpectReplacementServesJobsAsync(failed, [queued], submit);
        });

        it("replaces a worker that fails between jobs", async () => {
            vi.useFakeTimers();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const submit = () => encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const first = submit();
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            failed.finish();
            await first;
            failed.fail("Idle worker crashed");
            await ExpectReplacementServesJobsAsync(failed, [submit(), submit()], submit);
        });

        it.each(["setDefaultEncoderOptions", "encode"])("replaces a worker after a %s postMessage failure", async (action) => {
            vi.useFakeTimers();
            const postMessage = FakeWorker.prototype.postMessage;
            let thrown = false;
            vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message, transfer) {
                if (!thrown && message.action === action) {
                    thrown = true;
                    throw new Error("Transfer failed");
                }
                postMessage.call(this, message, transfer);
            });
            const encoder = new KhronosTextureContainer2Encoder(1);
            const submit = () => encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(submit(), "Transfer failed");
            const queued = submit();
            await vi.advanceTimersByTimeAsync(0);
            await rejected;
            await ExpectReplacementServesJobsAsync(FakeWorker.instances[0], [queued], submit);
        });

        it("rejects normal encode-error replies and reuses the healthy worker", async () => {
            vi.useFakeTimers();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const result = encoder._encodeAsync(texture, { usage: "color" });
            const rejected = ExpectFailureAsync(result, "Encode failed");
            const queued = encoder._encodeAsync(texture, { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            const worker = FakeWorker.instances[0];
            worker.reply({ action: "encoded", id: -1, data: new Uint8Array() });
            worker.finish("Encode failed");
            await rejected;
            await vi.advanceTimersByTimeAsync(0);
            expect(FakeWorker.instances).toHaveLength(1);
            expect(worker.encodes).toHaveLength(2);
            worker.finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
            expect(worker.terminated).toBe(false);
        });

        it("recovers queued jobs after a worker construction failure", async () => {
            vi.useFakeTimers();
            let attempts = 0;
            vi.stubGlobal(
                "Worker",
                class extends FakeWorker {
                    constructor() {
                        if (attempts++ === 0) {
                            throw new Error("Worker construction failed");
                        }
                        super();
                    }
                }
            );
            const encoder = new KhronosTextureContainer2Encoder(1);
            const first = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(first, "Worker construction failed");
            const queued = encoder._encodeAsync(CreateTexture(), { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            await rejected;
            expect(attempts).toBe(2);
            expect(FakeWorker.instances).toHaveLength(1);
            expect(FakeWorker.instances[0].encodes).toHaveLength(1);
            FakeWorker.instances[0].finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
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

        it("prefers an option pool over the static pool without initializing or disposing either", async () => {
            const workers = [new FakeWorker(), new FakeWorker()];
            const [staticPool, optionPool] = workers.map((worker) => new AutoReleaseWorkerPool(1, async () => worker as unknown as Worker));
            const disposals = [vi.spyOn(staticPool, "dispose"), vi.spyOn(optionPool, "dispose")];
            KhronosTextureContainer2Encoder.WorkerPool = staticPool;
            const results = [new KhronosTextureContainer2Encoder(-1)._encodeAsync(CreateTexture(), { usage: "color" })];
            results.push(new KhronosTextureContainer2Encoder({ workerPool: optionPool, numWorkers: -1 })._encodeAsync(CreateTexture(), { usage: "data" }));
            await vi.waitFor(() => expect(workers.map((worker) => worker.encodes.length)).toEqual([1, 1]));
            workers.forEach((worker) => worker.finish());
            await Promise.all(results);
            expect(workers.map((worker) => worker.messages.map((message) => message.action))).toEqual([
                ["setDefaultEncoderOptions", "encode"],
                ["setDefaultEncoderOptions", "encode"],
            ]);
            disposals.forEach((dispose) => expect(dispose).not.toHaveBeenCalled());
            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });

        it("leaves caller-owned worker cleanup to the caller after a failure", async () => {
            vi.useFakeTimers();
            const worker = new FakeWorker();
            const pool = new AutoReleaseWorkerPool(1, async () => worker as unknown as Worker);
            const dispose = vi.spyOn(pool, "dispose");
            const terminate = vi.spyOn(worker, "terminate");
            const encoder = new KhronosTextureContainer2Encoder({ workerPool: pool });
            const rejected = ExpectFailureAsync(encoder._encodeAsync(CreateTexture(), { usage: "color" }), "deserialized");
            await vi.advanceTimersByTimeAsync(0);
            worker.fail("Caller worker failed", "messageerror");
            await rejected;
            expect(terminate).not.toHaveBeenCalled();
            expect(dispose).not.toHaveBeenCalled();
            expect(worker.listenerCount).toBe(0);
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
        it("encodes on the main thread when workers are unavailable", async () => {
            vi.stubGlobal("Worker", undefined);
            vi.stubGlobal("KTX2ENCODER", { KTX2Encoder: StubEncoder(() => new Uint8Array([9])) });
            const encoder = new KhronosTextureContainer2Encoder(1);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).resolves.toEqual(new Uint8Array([9]));
            expect(FakeWorker.instances).toHaveLength(0);
            expect(Tools.LoadFileAsync).toHaveBeenCalledWith(Tools.GetBabylonScriptURL(KhronosTextureContainer2Encoder.URLConfig.wasmBasisEncoder, true));
        });

        it("uses dependencies captured at first construction and restores standalone settings", async () => {
            const captured: unknown[] = [];
            const Encoder = StubEncoder(
                () => new Uint8Array([7]),
                async function (this: { configuration: unknown }) {
                    captured.push(this.configuration);
                }
            );
            const statics = () => ({ JSModule: Encoder.JSModule, WasmBinary: Encoder.WasmBinary, JSModuleURL: Encoder.JSModuleURL, WasmModuleURL: Encoder.WasmModuleURL });
            const original = statics();
            const jsBasisEncoder = () => ({});
            const wasmBasisEncoder = new ArrayBuffer(4);
            KhronosTextureContainer2Encoder.URLConfig.jsBasisEncoder = "https://example.test/codec.js";
            const load = vi.spyOn(Tools, "LoadBabylonScriptAsync");
            const dependencies = { jsEncoderModule: { KTX2Encoder: Encoder }, jsBasisEncoder, wasmBasisEncoder };
            const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: dependencies });
            dependencies.jsEncoderModule = { KTX2Encoder: StubEncoder(() => new Uint8Array([9])) };
            dependencies.jsBasisEncoder = () => ({});
            dependencies.wasmBasisEncoder = new ArrayBuffer(8);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).resolves.toEqual(new Uint8Array([7]));
            expect(captured).toEqual([expect.objectContaining({ JSModule: jsBasisEncoder, WasmBinary: wasmBasisEncoder, JSModuleURL: "https://example.test/codec.js" })]);
            expect(statics()).toEqual(original);
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

        it("rejects main-thread initialization errors", async () => {
            vi.spyOn(Tools, "LoadBabylonScriptAsync").mockRejectedValue(new Error("Script load failed"));
            const encoder = new KhronosTextureContainer2Encoder(0);
            await ExpectFailureAsync(encoder._encodeAsync(CreateTexture(), { usage: "data" }), "Script load failed");
        });
    });

    describe("texture", () => {
        let encoder: KhronosTextureContainer2Encoder;

        beforeEach(() => {
            encoder = new KhronosTextureContainer2Encoder(1);
        });

        it.each<[string, (internalTexture: InternalTexture) => void, string]>([
            ["cube", (internalTexture) => (internalTexture.isCube = true), "2D textures"],
            ["premultiplied", (internalTexture) => (internalTexture._premulAlpha = true), "premultiplied"],
            ["float", (internalTexture) => (internalTexture.type = Constants.TEXTURETYPE_FLOAT), "unsigned byte"],
            ["scene-less compressed", (internalTexture) => (internalTexture.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5), "requires a scene"],
        ])("rejects %s textures before readback", async (_, configure, message) => {
            const texture = CreateTexture();
            configure(texture.getInternalTexture()!);
            await ExpectFailureAsync(encoder._encodeAsync(texture, { usage: "data" }), message);
            expect(texture.readPixels).not.toHaveBeenCalled();
        });

        it.each([
            [true, false],
            [false, true],
        ])("derives generateMipmaps %s and flipY %s from the texture and forwards codec settings", async (generateMipmaps, flipY) => {
            const texture = CreateTexture(generateMipmaps, flipY);
            const options = { usage: "data", zstandard: false, generateMipmaps: !generateMipmaps, flipY: !flipY } as unknown as IKTX2EncoderOptions;
            const result = encoder._encodeAsync(texture, options);
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            expect(FakeWorker.instances[0].encodes[0]).toMatchObject({ width: 4, height: 4, options: { usage: "data", zstandard: false, generateMipmaps, flipY } });
            expect(texture.readPixels).toHaveBeenCalledWith(0, 0);
            FakeWorker.instances[0].finish();
            await result;
        });

        it.each([
            ["readiness", 0],
            ["readback", 1],
        ])("aborts while waiting for %s", async (stage, readbacks) => {
            const texture = CreateTexture();
            texture.getInternalTexture()!.isReady = stage !== "readiness";
            vi.mocked(texture.readPixels).mockImplementation(async () => await new Promise(() => {}));
            const abort = new AbortController();
            const result = encoder._encodeAsync(texture, { usage: "data", signal: abort.signal });
            await new Promise((resolve) => setTimeout(resolve, 0));
            abort.abort();
            await ExpectAbortAsync(result);
            expect(texture.readPixels).toHaveBeenCalledTimes(readbacks);
            expect(FakeWorker.instances).toHaveLength(0);
        });

        it.each<{ name: string; compressed?: boolean; invertY?: boolean; invertVScale?: boolean; renderTarget?: boolean; webGPU?: boolean; expected: boolean }>([
            { name: "WebGL render target", renderTarget: true, expected: true },
            { name: "WebGPU render target", webGPU: true, renderTarget: true, expected: true },
            { name: "compressed upload", compressed: true, invertY: true, expected: false },
            { name: "upload flip", invertY: true, expected: true },
            { name: "upload flip with UV compensation", invertY: true, invertVScale: true, expected: false },
            { name: "no upload flip", expected: false },
        ])("normalizes orientation for $name", ({ compressed, invertY = false, invertVScale = false, renderTarget = false, webGPU = false, expected }) => {
            Object.defineProperty(engine, "hasOriginBottomLeft", { value: !webGPU });
            Object.defineProperty(engine, "isWebGPU", { value: webGPU });
            const texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false, invertY);
            const internalTexture = texture.getInternalTexture()!;
            internalTexture._invertVScale = invertVScale;
            if (compressed) {
                internalTexture.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
            }
            texture.isRenderTarget = renderTarget;
            expect(_GetKTX2TextureFlipY(texture)).toBe(expected);
        });
    });
});
