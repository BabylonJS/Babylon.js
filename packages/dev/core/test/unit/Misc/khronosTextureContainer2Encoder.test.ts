import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DefaultKTX2EncoderOptions, KhronosTextureContainer2Encoder, _GetKTX2TextureFlipY } from "core/Misc/khronosTextureContainer2Encoder";
import { type KTX2EncoderWorkerRequest } from "core/Misc/khronosTextureContainer2EncoderWorker";
import { NullEngine } from "core/Engines/nullEngine";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { Constants } from "core/Engines/constants";
import { Tools } from "core/Misc/tools.pure";
import { AutoReleaseWorkerPool } from "core/Misc/workerPool";
import { KTX2Encoder } from "../../../../../tools/ktx2Encoder/src/ktx2Encoder";

class FakeWorker extends EventTarget {
    public static instances: FakeWorker[] = [];
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
            this.dispatchEvent(new MessageEvent("message", { data: { action: "init", id: message.id } }));
        }
    }
    public get encodes() {
        return this.messages.filter((message) => message.action === "encode");
    }
    public finish(error?: string) {
        if (!this.dead) {
            const id = this.encodes.at(-1)!.id;
            const data = error ? { action: "error", id, message: error } : { action: "encoded", id, data: new Uint8Array([7]) };
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
    texture.getInternalTexture()!.isReady = false;
    const rejected = ExpectFailureAsync(EncodeAsync(new KhronosTextureContainer2Encoder(-1)));
    const second = EncodeAsync(new KhronosTextureContainer2Encoder({ workerPool: pools[1], numWorkers: -1 }));
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
    vi.spyOn(KTX2Encoder.prototype, "encode").mockImplementation(async function (this: KTX2Encoder) {
        expect(this.constructor).toBe(KTX2Encoder);
        return new Uint8Array([7]);
    });
    const originalDefaults = KTX2Encoder.DefaultEncoderOptions;
    try {
        for (const value of [0, undefined]) {
            KhronosTextureContainer2Encoder.DefaultEncoderOptions.uastcQualityLevel = value;
            const result = EncodeAsync(encoder);
            await FlushAsync();
            await expect(result).resolves.toEqual(new Uint8Array([7]));
            expect(KTX2Encoder.DefaultEncoderOptions).toEqual(value === undefined ? {} : { uastcQualityLevel: value });
        }
        expect(factory).toHaveBeenCalledExactlyOnceWith({ wasmBinary: binary });
        expect(dependencies.jsBasisEncoder).not.toHaveBeenCalled();
    } finally {
        KTX2Encoder.DefaultEncoderOptions = originalDefaults;
    }
});

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

it("only compensates an actual upload flip for inverted UVs", () => {
    const internal = texture.getInternalTexture()!;
    internal.invertY = true;
    expect(_GetKTX2TextureFlipY(texture)).toBe(true);
    internal._invertVScale = true;
    expect(_GetKTX2TextureFlipY(texture)).toBe(false);
});
