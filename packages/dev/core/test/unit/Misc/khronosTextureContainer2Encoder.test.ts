import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DefaultKTX2EncoderOptions, KhronosTextureContainer2Encoder, _GetKTX2TextureFlipY } from "core/Misc/khronosTextureContainer2Encoder";
import { KTX2EncoderWorkerFunction, type KTX2EncoderWorkerRequest } from "core/Misc/khronosTextureContainer2EncoderWorker";
import { NullEngine } from "core/Engines/nullEngine";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools.pure";
import { AutoReleaseWorkerPool } from "core/Misc/workerPool";
import { KTX2Encoder } from "../../../../../tools/ktx2Encoder/src/ktx2Encoder";

class FakeWorker extends EventTarget {
    public static instances: FakeWorker[] = [];
    public static initializationError: string | undefined;
    public messages: KTX2EncoderWorkerRequest[] = [];
    public dead = false;
    public terminate = vi.fn(() => (this.dead = true));
    public constructor() {
        super();
        FakeWorker.instances.push(this);
    }
    public postMessage(message: KTX2EncoderWorkerRequest) {
        this.messages.push(message);
        if (!this.dead && message.action === "init") {
            const data = FakeWorker.initializationError ? { action: "error", id: message.id, message: FakeWorker.initializationError } : { action: "init", id: message.id };
            this.dispatchEvent(new MessageEvent("message", { data }));
        }
    }
    public get encodes() {
        return this.messages.filter((message) => message.action === "encode");
    }
    public finish(error?: string, fatal = false) {
        if (!this.dead) {
            const id = this.encodes.at(-1)!.id;
            const data = error ? { action: "error", id, message: error, fatal } : { action: "encoded", id, data: new Uint8Array([7]) };
            this.dispatchEvent(new MessageEvent("message", { data }));
        }
    }
    public fail() {
        this.dead = true;
        this.dispatchEvent(Object.assign(new Event("error"), { message: "Worker crashed" }));
    }
}

let engine: NullEngine;
let texture: RawTexture;
const FlushAsync = async () => await vi.advanceTimersByTimeAsync(0);
const EncodeAsync = (encoder: KhronosTextureContainer2Encoder, signal?: AbortSignal) => encoder._encodeAsync(texture, { usage: "data", signal });
async function ExpectFailureAsync(promise: Promise<unknown>, message = "Worker crashed") {
    await expect(promise).rejects.toThrow(message);
}
async function ExpectAbortAsync(promise: Promise<unknown>) {
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
}

beforeEach(() => {
    const statics = KhronosTextureContainer2Encoder as unknown as Record<string, unknown>;
    statics._WorkerPoolPromise = undefined;
    statics._MainThreadSettings = undefined;
    statics._MainThreadEncoderPromise = undefined;
    KhronosTextureContainer2Encoder.WorkerPool = undefined;
    KhronosTextureContainer2Encoder.DefaultEncoderOptions = new DefaultKTX2EncoderOptions();
    FakeWorker.instances = [];
    FakeWorker.initializationError = undefined;
    vi.useFakeTimers();
    vi.stubGlobal("Worker", FakeWorker);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:encoder");
    vi.spyOn(Tools, "LoadFileAsync").mockResolvedValue(new ArrayBuffer(8));
    engine = new NullEngine();
    texture = new RawTexture(new Uint8Array(64), 4, 4, Constants.TEXTUREFORMAT_RGBA, engine, false);
    texture.getInternalTexture()!.isReady = true;
    vi.spyOn(texture, "readPixels").mockResolvedValue(new Uint8Array(64));
});

afterEach(() => {
    engine.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

it.each(["startup", "encode", "between jobs"])("replaces a fatal worker after %s without waiting for idle release", async (stage) => {
    let releaseWasm = (_data: ArrayBuffer) => {};
    if (stage === "startup") {
        vi.mocked(Tools.LoadFileAsync).mockReturnValueOnce(new Promise((resolve) => (releaseWasm = resolve)));
    }
    const encoder = new KhronosTextureContainer2Encoder(1);
    const first = EncodeAsync(encoder);
    const settled = stage === "between jobs" ? first : ExpectFailureAsync(first);
    await FlushAsync();
    const failed = FakeWorker.instances[0];
    if (stage === "between jobs") {
        failed.finish();
        await settled;
        failed.fail();
    }
    const queued = EncodeAsync(encoder);
    await FlushAsync();
    if (stage !== "between jobs") {
        expect(failed.encodes).toHaveLength(stage === "startup" ? 0 : 1);
        failed.fail();
    }
    await settled;
    const messages = failed.messages.length;
    const now = Date.now();
    releaseWasm(new ArrayBuffer(8));
    for (let index = 0; index < 4; index++) {
        const pending = index === 0 ? queued : EncodeAsync(encoder);
        await FlushAsync();
        expect(FakeWorker.instances).toHaveLength(2);
        const replacement = FakeWorker.instances[1];
        expect(replacement.encodes).toHaveLength(index + 1);
        replacement.finish();
        await expect(pending).resolves.toEqual(new Uint8Array([7]));
    }
    expect(failed.terminate).toHaveBeenCalledOnce();
    expect(failed.messages).toHaveLength(messages);
    expect(Date.now()).toBe(now);
});

it("reuses a healthy worker after encode rejection and replaces defaults snapshots, including clears", async () => {
    const defaults = KhronosTextureContainer2Encoder.DefaultEncoderOptions;
    defaults.uastcQualityLevel = 0;
    defaults.zstandard = false;
    const encoder = new KhronosTextureContainer2Encoder(1);
    texture.getInternalTexture()!.invertY = true;
    const rejected = ExpectFailureAsync(EncodeAsync(encoder), "Encode failed");
    await FlushAsync();
    const worker = FakeWorker.instances[0];
    expect(worker.encodes[0].options).toMatchObject({ usage: "data", flipY: true, generateMipmaps: false });
    worker.finish("Encode failed");
    await rejected;
    defaults.zstandard = undefined;
    const next = EncodeAsync(encoder);
    await FlushAsync();
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.encodes).toHaveLength(2);
    expect(worker.messages.filter((message) => message.action === "setDefaultEncoderOptions").map((message) => message.options)).toEqual([
        { uastcQualityLevel: 0, zstandard: false },
        { uastcQualityLevel: 0 },
    ]);
    worker.finish();
    await expect(next).resolves.toEqual(new Uint8Array([7]));
    expect(worker.terminate).not.toHaveBeenCalled();
});

it.each(["WASM download", "initialization reply", "codec abort"])("replaces a worker after a failed %s", async (stage) => {
    if (stage === "WASM download") {
        vi.mocked(Tools.LoadFileAsync).mockRejectedValueOnce(new Error("Initialization failed"));
    } else if (stage === "initialization reply") {
        FakeWorker.initializationError = "Initialization failed";
    }
    const encoder = new KhronosTextureContainer2Encoder(1);
    const first = ExpectFailureAsync(EncodeAsync(encoder), stage === "codec abort" ? "Aborted" : "Initialization failed");
    await FlushAsync();
    const failed = FakeWorker.instances[0];
    if (stage === "codec abort") {
        failed.finish("Aborted", true);
    }
    await first;
    expect(failed.terminate).toHaveBeenCalledOnce();
    FakeWorker.initializationError = undefined;
    const next = EncodeAsync(encoder);
    await FlushAsync();
    expect(FakeWorker.instances).toHaveLength(2);
    FakeWorker.instances[1].finish();
    await expect(next).resolves.toEqual(new Uint8Array([7]));
});

it.each([new Error("Invalid input"), new WebAssembly.RuntimeError("Aborted")])("classifies worker encode failure %s", async (error) => {
    vi.stubGlobal("KTX2ENCODER", { KTX2Encoder });
    vi.stubGlobal("BASIS", () => {});
    vi.stubGlobal("onmessage", undefined);
    const post = vi.fn();
    vi.stubGlobal("postMessage", post);
    vi.spyOn(KTX2Encoder.prototype, "_initializeAsync").mockResolvedValue();
    vi.spyOn(KTX2Encoder.prototype, "encode").mockRejectedValue(error);
    const settings = { JSModule: KTX2Encoder.JSModule, WasmBinary: KTX2Encoder.WasmBinary };
    try {
        KTX2EncoderWorkerFunction();
        onmessage!(new MessageEvent("message", { data: { action: "init", id: 1, wasmBinary: new ArrayBuffer(8) } }));
        await FlushAsync();
        onmessage!(new MessageEvent("message", { data: { action: "encode", id: 2, rgba: new Uint8Array(64), width: 4, height: 4, options: { usage: "data" } } }));
        await FlushAsync();
        expect(post).toHaveBeenLastCalledWith({ action: "error", id: 2, message: error.message, fatal: error instanceof WebAssembly.RuntimeError });
    } finally {
        Object.assign(KTX2Encoder, settings);
    }
});

it("rejects cancellation promptly, skips queued work and drains the active job before reuse", async () => {
    const encoder = new KhronosTextureContainer2Encoder(1);
    const active = new AbortController();
    const queued = new AbortController();
    const first = ExpectAbortAsync(EncodeAsync(encoder, active.signal));
    const second = ExpectAbortAsync(EncodeAsync(encoder, queued.signal));
    await FlushAsync();
    active.abort();
    queued.abort();
    await Promise.all([first, second]);
    const next = EncodeAsync(encoder);
    await FlushAsync();
    const worker = FakeWorker.instances[0];
    expect(worker.encodes).toHaveLength(1);
    worker.finish();
    await FlushAsync();
    expect(worker.encodes).toHaveLength(2);
    worker.finish();
    await expect(next).resolves.toEqual(new Uint8Array([7]));
    expect(FakeWorker.instances).toHaveLength(1);
    expect(worker.terminate).not.toHaveBeenCalled();
});

it.each(["readiness", "readback"])("cancels while waiting for %s without starting a worker", async (stage) => {
    texture.getInternalTexture()!.isReady = stage !== "readiness";
    vi.mocked(texture.readPixels).mockReturnValue(new Promise(() => {}));
    const controller = new AbortController();
    const rejected = ExpectAbortAsync(EncodeAsync(new KhronosTextureContainer2Encoder(1), controller.signal));
    await FlushAsync();
    expect(texture.readPixels).toHaveBeenCalledTimes(stage === "readiness" ? 0 : 1);
    controller.abort();
    await rejected;
    expect(FakeWorker.instances).toHaveLength(0);
});

it("keeps each job's injected pool and leaves failed caller workers caller-owned", async () => {
    const workers = [new FakeWorker(), new FakeWorker()];
    const pools = workers.map((worker) => new AutoReleaseWorkerPool(1, async () => worker as unknown as Worker));
    const disposals = pools.map((pool) => vi.spyOn(pool, "dispose"));
    KhronosTextureContainer2Encoder.WorkerPool = pools[0];
    const firstEncoder = new KhronosTextureContainer2Encoder(-1);
    const secondEncoder = new KhronosTextureContainer2Encoder({ workerPool: pools[1], numWorkers: -1 });
    texture.getInternalTexture()!.isReady = false;
    const rejected = ExpectFailureAsync(EncodeAsync(firstEncoder));
    const second = EncodeAsync(secondEncoder);
    texture.getInternalTexture()!.isReady = true;
    texture.onLoadObservable.notifyObservers(texture);
    await FlushAsync();
    expect(workers.map((worker) => worker.messages.map((message) => message.action))).toEqual([
        ["setDefaultEncoderOptions", "encode"],
        ["setDefaultEncoderOptions", "encode"],
    ]);
    workers[0].fail();
    workers[1].finish();
    await rejected;
    await expect(second).resolves.toEqual(new Uint8Array([7]));
    workers.forEach((worker) => expect(worker.terminate).not.toHaveBeenCalled());
    disposals.forEach((dispose) => expect(dispose).not.toHaveBeenCalled());
    KhronosTextureContainer2Encoder.WorkerPool = undefined;
    const automatic = EncodeAsync(new KhronosTextureContainer2Encoder(1));
    await FlushAsync();
    expect(FakeWorker.instances).toHaveLength(3);
    FakeWorker.instances[2].finish();
    await expect(automatic).resolves.toEqual(new Uint8Array([7]));
    pools.forEach((pool) => pool.dispose());
});

it("captures main-thread dependencies at construction and refreshes defaults after clearing", async () => {
    const factory = vi.fn(() => ({ initializeBasis: vi.fn() }));
    const binary = new ArrayBuffer(8);
    const dependencies = { jsEncoderModule: { KTX2Encoder }, jsBasisEncoder: factory, wasmBasisEncoder: binary };
    const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: dependencies });
    dependencies.jsEncoderModule = { KTX2Encoder: class extends KTX2Encoder {} };
    dependencies.jsBasisEncoder = vi.fn();
    dependencies.wasmBasisEncoder = new ArrayBuffer(16);
    const snapshots: (typeof KTX2Encoder.DefaultEncoderOptions)[] = [];
    vi.spyOn(KTX2Encoder.prototype, "encode").mockImplementation(async function (this: KTX2Encoder) {
        expect(this.constructor).toBe(KTX2Encoder);
        snapshots.push(KTX2Encoder.DefaultEncoderOptions);
        await new Promise<void>((resolve) => setTimeout(resolve, 1));
        expect(KTX2Encoder.DefaultEncoderOptions).toBe(standaloneDefaults);
        return new Uint8Array([7]);
    });
    const originalDefaults = KTX2Encoder.DefaultEncoderOptions;
    const standaloneDefaults = { uastcQualityLevel: 3 };
    KTX2Encoder.DefaultEncoderOptions = standaloneDefaults;
    try {
        for (const value of [0, undefined]) {
            KhronosTextureContainer2Encoder.DefaultEncoderOptions.uastcQualityLevel = value;
            const result = EncodeAsync(encoder);
            await FlushAsync();
            expect(KTX2Encoder.DefaultEncoderOptions).toBe(standaloneDefaults);
            await vi.advanceTimersByTimeAsync(1);
            await expect(result).resolves.toEqual(new Uint8Array([7]));
        }
        expect(snapshots).toEqual([{ uastcQualityLevel: 0 }, {}]);
        expect(factory).toHaveBeenCalledExactlyOnceWith({ wasmBinary: binary });
        expect(dependencies.jsBasisEncoder).not.toHaveBeenCalled();
    } finally {
        KTX2Encoder.DefaultEncoderOptions = originalDefaults;
    }
});

it("retries failed main-thread initialization without losing captured settings or sharing", async () => {
    vi.mocked(Tools.LoadFileAsync).mockRejectedValueOnce(new Error("Temporary codec failure"));
    const factory = vi.fn(() => ({ initializeBasis: vi.fn() }));
    const dependencies = { jsEncoderModule: { KTX2Encoder }, jsBasisEncoder: factory };
    const encoder = new KhronosTextureContainer2Encoder({ numWorkers: 0, binariesAndModulesContainer: dependencies });
    await Promise.all([ExpectFailureAsync(EncodeAsync(encoder), "Temporary codec failure"), ExpectFailureAsync(EncodeAsync(encoder), "Temporary codec failure")]);
    expect(factory).not.toHaveBeenCalled();
    dependencies.jsBasisEncoder = vi.fn();
    vi.spyOn(KTX2Encoder.prototype, "encode").mockResolvedValue(new Uint8Array([7]));
    const retry = EncodeAsync(new KhronosTextureContainer2Encoder(0));
    const concurrent = EncodeAsync(encoder);
    await vi.advanceTimersByTimeAsync(1);
    await expect(retry).resolves.toEqual(new Uint8Array([7]));
    await expect(concurrent).resolves.toEqual(new Uint8Array([7]));
    expect(factory).toHaveBeenCalledOnce();
    expect(Tools.LoadFileAsync).toHaveBeenCalledTimes(2);
    expect(dependencies.jsBasisEncoder).not.toHaveBeenCalled();
});

it("does not evict in-flight main-thread initialization when a caller cancels", async () => {
    let initialize!: (module: { initializeBasis: () => void }) => void;
    const factory = vi.fn(() => new Promise((resolve) => (initialize = resolve)));
    const encoder = new KhronosTextureContainer2Encoder({
        numWorkers: 0,
        binariesAndModulesContainer: { jsEncoderModule: { KTX2Encoder }, jsBasisEncoder: factory, wasmBasisEncoder: new ArrayBuffer(8) },
    });
    vi.spyOn(KTX2Encoder.prototype, "encode").mockResolvedValue(new Uint8Array([7]));
    const controller = new AbortController();
    const cancelled = ExpectAbortAsync(EncodeAsync(encoder, controller.signal));
    await FlushAsync();
    controller.abort();
    await cancelled;
    const next = EncodeAsync(encoder);
    initialize({ initializeBasis: vi.fn() });
    await FlushAsync();
    await expect(next).resolves.toEqual(new Uint8Array([7]));
    expect(factory).toHaveBeenCalledOnce();
});

it.each([Constants.TEXTUREFORMAT_R_INTEGER, Constants.TEXTUREFORMAT_RG_INTEGER, Constants.TEXTUREFORMAT_RGB_INTEGER, Constants.TEXTUREFORMAT_RGBA_INTEGER])(
    "rejects integer format %s before readback",
    async (format) => {
        texture.getInternalTexture()!.format = format;
        await expect(EncodeAsync(new KhronosTextureContainer2Encoder(1))).rejects.toThrow("integer texture formats");
        expect(texture.readPixels).not.toHaveBeenCalled();
        expect(FakeWorker.instances).toHaveLength(0);
    }
);

it("encodes WebGPU BGRA readback as RGBA", async () => {
    vi.spyOn(engine, "isWebGPU", "get").mockReturnValue(true);
    texture.getInternalTexture()!.format = Constants.TEXTUREFORMAT_BGRA;
    vi.mocked(texture.readPixels).mockResolvedValue(Uint8Array.from({ length: 64 }, (_, index) => [10, 20, 30, 40][index % 4]));
    const result = EncodeAsync(new KhronosTextureContainer2Encoder(1));
    await FlushAsync();
    const worker = FakeWorker.instances[0];
    expect(worker.encodes[0].rgba).toEqual(Uint8Array.from({ length: 64 }, (_, index) => [30, 20, 10, 40][index % 4]));
    worker.finish();
    await expect(result).resolves.toEqual(new Uint8Array([7]));
});

it.each([Constants.TEXTUREFORMAT_ALPHA, Constants.TEXTUREFORMAT_LUMINANCE, Constants.TEXTUREFORMAT_LUMINANCE_ALPHA])(
    "rejects legacy format %s on WebGL before readback",
    async (format) => {
        texture.getInternalTexture()!.format = format;
        await expect(EncodeAsync(new KhronosTextureContainer2Encoder(1))).rejects.toThrow("alpha or luminance texture formats on WebGL");
        expect(texture.readPixels).not.toHaveBeenCalled();
        expect(FakeWorker.instances).toHaveLength(0);
    }
);

it("only compensates an actual upload flip for inverted UVs", () => {
    const internal = texture.getInternalTexture()!;
    internal.invertY = true;
    expect(_GetKTX2TextureFlipY(texture)).toBe(true);
    internal._invertVScale = true;
    expect(_GetKTX2TextureFlipY(texture)).toBe(false);
});
