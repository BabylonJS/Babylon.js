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
            expect(Tools.LoadFileAsync).toHaveBeenCalledExactlyOnceWith(Tools.GetBabylonScriptURL("https://example.test/custom.wasm", true));
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

        it("replaces a failed startup worker for queued and continued jobs before idle expiry", async () => {
            vi.useFakeTimers();
            const now = Date.now();
            let resolveWasm: (data: ArrayBuffer) => void = () => {};
            vi.mocked(Tools.LoadFileAsync).mockReturnValueOnce(new Promise((resolve) => (resolveWasm = resolve)));
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            const rejected = ExpectFailureAsync(first, "Worker script failed");
            const queued = encoder._encodeAsync(texture, { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            expect(FakeWorker.instances).toHaveLength(1);
            const failed = FakeWorker.instances[0];
            failed.fail("Worker script failed");
            await rejected;
            await vi.advanceTimersByTimeAsync(0);
            expect(failed.terminated).toBe(true);
            expect(failed.listenerCount).toBe(0);
            expect(FakeWorker.instances).toHaveLength(2);
            resolveWasm(new ArrayBuffer(8));
            await vi.advanceTimersByTimeAsync(0);
            const replacement = FakeWorker.instances[1];
            expect(failed.messages).toHaveLength(0);
            expect(replacement.encodes).toHaveLength(1);
            replacement.finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
            for (let i = 0; i < 3; i++) {
                const next = encoder._encodeAsync(texture, { usage: "color" });
                await vi.advanceTimersByTimeAsync(0);
                expect(replacement.encodes).toHaveLength(i + 2);
                replacement.finish();
                await expect(next).resolves.toEqual(new Uint8Array([1, 2, 3]));
            }
            expect(FakeWorker.instances).toHaveLength(2);
            expect(failed.messages).toHaveLength(0);
            expect(Date.now()).toBe(now);
        });

        it.each(["error", "messageerror"])("replaces a worker after an uncaught %s without stranding queued jobs", async (type) => {
            vi.useFakeTimers();
            const now = Date.now();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            const rejected = ExpectFailureAsync(first, type === "error" ? "Worker crashed" : "deserialized");
            const queued = encoder._encodeAsync(texture, { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            expect(FakeWorker.instances).toHaveLength(1);
            const failed = FakeWorker.instances[0];
            expect(failed.encodes).toHaveLength(1);
            const messageCount = failed.messages.length;
            failed.fail("Worker crashed", type);
            await rejected;
            await vi.advanceTimersByTimeAsync(0);
            expect(failed.terminated).toBe(true);
            expect(failed.listenerCount).toBe(0);
            expect(FakeWorker.instances).toHaveLength(2);
            const replacement = FakeWorker.instances[1];
            expect(replacement.encodes).toHaveLength(1);
            replacement.finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
            for (let i = 0; i < 3; i++) {
                const next = encoder._encodeAsync(texture, { usage: "color" });
                await vi.advanceTimersByTimeAsync(0);
                expect(replacement.encodes).toHaveLength(i + 2);
                replacement.finish();
                await expect(next).resolves.toEqual(new Uint8Array([1, 2, 3]));
            }
            expect(failed.messages).toHaveLength(messageCount);
            expect(FakeWorker.instances).toHaveLength(2);
            expect(Date.now()).toBe(now);
        });

        it("replaces a worker that fails between jobs without advancing the idle timer", async () => {
            vi.useFakeTimers();
            const now = Date.now();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const texture = CreateTexture();
            const first = encoder._encodeAsync(texture, { usage: "color" });
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            failed.finish();
            await first;
            const messageCount = failed.messages.length;
            failed.fail("Idle worker crashed");
            expect(failed.terminated).toBe(true);
            const queued = [encoder._encodeAsync(texture, { usage: "data" }), encoder._encodeAsync(texture, { usage: "normal" })];
            for (let i = 0; i < queued.length; i++) {
                await vi.advanceTimersByTimeAsync(0);
                expect(FakeWorker.instances).toHaveLength(2);
                const replacement = FakeWorker.instances[1];
                expect(replacement.encodes).toHaveLength(i + 1);
                replacement.finish();
                await expect(queued[i]).resolves.toEqual(new Uint8Array([1, 2, 3]));
            }
            expect(failed.messages).toHaveLength(messageCount);
            expect(failed.listenerCount).toBe(0);
            expect(Date.now()).toBe(now);
        });

        it("replaces a worker that fails while waiting for its initialization reply", async () => {
            vi.useFakeTimers();
            vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementationOnce(function (this: FakeWorker, message) {
                this.messages.push(message);
            });
            const encoder = new KhronosTextureContainer2Encoder(1);
            const first = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(first, "Init crashed");
            const queued = encoder._encodeAsync(CreateTexture(), { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            expect(failed.messages.map(({ action }) => action)).toEqual(["init"]);
            failed.fail("Init crashed");
            await rejected;
            await vi.advanceTimersByTimeAsync(0);
            expect(failed.terminated).toBe(true);
            expect(failed.listenerCount).toBe(0);
            expect(FakeWorker.instances).toHaveLength(2);
            expect(FakeWorker.instances[1].encodes).toHaveLength(1);
            FakeWorker.instances[1].finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
            expect(failed.encodes).toHaveLength(0);
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

        it.each(["init", "setDefaultEncoderOptions", "encode"])("recovers queued jobs after a %s postMessage failure", async (action) => {
            vi.useFakeTimers();
            const postMessage = FakeWorker.prototype.postMessage;
            let failed = false;
            vi.spyOn(FakeWorker.prototype, "postMessage").mockImplementation(function (this: FakeWorker, message, transfer) {
                if (!failed && message.action === action) {
                    failed = true;
                    throw new Error("Transfer failed");
                }
                postMessage.call(this, message, transfer);
            });
            const encoder = new KhronosTextureContainer2Encoder(1);
            const first = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(first, "Transfer failed");
            const queued = encoder._encodeAsync(CreateTexture(), { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            await rejected;
            expect(FakeWorker.instances[0].terminated).toBe(true);
            expect(FakeWorker.instances[0].listenerCount).toBe(0);
            expect(FakeWorker.instances).toHaveLength(2);
            expect(FakeWorker.instances[1].encodes).toHaveLength(1);
            FakeWorker.instances[1].finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
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

        it("recovers queued jobs after a single worker construction failure", async () => {
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

        it("recovers queued work when a cooperatively cancelled worker subsequently crashes", async () => {
            vi.useFakeTimers();
            const encoder = new KhronosTextureContainer2Encoder(1);
            const abort = new AbortController();
            const first = encoder._encodeAsync(CreateTexture(), { usage: "color", signal: abort.signal });
            const rejected = ExpectAbortAsync(first);
            const queued = encoder._encodeAsync(CreateTexture(), { usage: "data" });
            await vi.advanceTimersByTimeAsync(0);
            const failed = FakeWorker.instances[0];
            abort.abort();
            await rejected;
            expect(failed.terminated).toBe(false);
            expect(failed.encodes).toHaveLength(1);
            failed.fail("Cancelled worker crashed");
            await vi.advanceTimersByTimeAsync(0);
            expect(failed.terminated).toBe(true);
            expect(FakeWorker.instances).toHaveLength(2);
            expect(FakeWorker.instances[1].encodes).toHaveLength(1);
            FakeWorker.instances[1].finish();
            await expect(queued).resolves.toEqual(new Uint8Array([1, 2, 3]));
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

        it.each(["error", "messageerror"])("leaves caller-owned cleanup to the caller after %s", async (type) => {
            vi.useFakeTimers();
            const worker = new FakeWorker();
            const pool = new AutoReleaseWorkerPool(1, async () => worker as unknown as Worker);
            const dispose = vi.spyOn(pool, "dispose");
            const terminate = vi.spyOn(worker, "terminate");
            const encoder = new KhronosTextureContainer2Encoder({ workerPool: pool });
            const result = encoder._encodeAsync(CreateTexture(), { usage: "color" });
            const rejected = ExpectFailureAsync(result, type === "error" ? "Caller worker failed" : "deserialized");
            await vi.advanceTimersByTimeAsync(0);
            worker.fail("Caller worker failed", type);
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

        it("captures main-thread dependency entries at first construction", async () => {
            const captured: unknown[] = [];
            const Encoder = StubEncoder(
                () => new Uint8Array([7]),
                async function (this: { configuration: unknown }) {
                    captured.push(this.configuration);
                }
            );
            const originalFactory = () => ({});
            const originalWasm = new ArrayBuffer(4);
            const dependencies = { jsEncoderModule: { KTX2Encoder: Encoder }, jsBasisEncoder: originalFactory, wasmBasisEncoder: originalWasm };
            const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: dependencies });
            dependencies.jsEncoderModule = { KTX2Encoder: StubEncoder(() => new Uint8Array([9])) };
            dependencies.jsBasisEncoder = () => ({});
            dependencies.wasmBasisEncoder = new ArrayBuffer(8);
            await expect(encoder._encodeAsync(CreateTexture(), { usage: "color" })).resolves.toEqual(new Uint8Array([7]));
            expect(captured).toEqual([expect.objectContaining({ JSModule: originalFactory, WasmBinary: originalWasm })]);
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

        it("leaves image dimension validation to the standalone encoder", async () => {
            const texture = CreateTexture();
            vi.spyOn(texture, "getSize").mockReturnValue({ width: 3, height: 4 });
            const result = encoder._encodeAsync(texture, { usage: "data" });
            const rejected = ExpectFailureAsync(result, "KTX2 encoder width and height must be positive multiples of 4.");
            await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
            expect(FakeWorker.instances[0].encodes[0]).toMatchObject({ width: 3, height: 4 });
            FakeWorker.instances[0].finish("KTX2 encoder width and height must be positive multiples of 4.");
            await rejected;
            expect(texture.readPixels).toHaveBeenCalledOnce();
        });

        it("rejects engine-backed compressed textures before readback with a descriptive error", async () => {
            const texture = CreateTexture();
            texture.getInternalTexture()!.format = Constants.TEXTUREFORMAT_COMPRESSED_RGBA_S3TC_DXT5;
            await expect(encoder._encodeAsync(texture, { usage: "data" })).rejects.toThrow("requires a scene");
            expect(texture.readPixels).not.toHaveBeenCalled();
        });

        it("forwards codec settings without duplicating standalone processing", async () => {
            const options: IKTX2EncoderOptions = { usage: "color", etc1sQualityLevel: 0, zstandard: true };
            const texture = CreateTexture();
            const result = encoder._encodeAsync(texture, options);
            await Promise.all([
                expect(result).resolves.toEqual(new Uint8Array([1, 2, 3])),
                (async () => {
                    await vi.waitFor(() => expect(FakeWorker.instances[0]?.encodes).toHaveLength(1));
                    expect(FakeWorker.instances[0].encodes[0].options).toMatchObject(options);
                    FakeWorker.instances[0].finish();
                })(),
            ]);
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
            const rejected = reason === "abort" ? ExpectAbortAsync(result) : ExpectFailureAsync(result, /load failed|disposed/);
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
