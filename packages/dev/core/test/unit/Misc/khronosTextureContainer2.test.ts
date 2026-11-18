import { afterEach, describe, expect, it, vi } from "vitest";

import { NullEngine } from "core/Engines/nullEngine";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { KhronosTextureContainer2 } from "core/Misc/khronosTextureContainer2";
import { Scene } from "core/scene";

const KTX2_IDENTIFIER = [0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a];

// a file that starts as a KTX2 file: the decoder is a fake, so the rest does not matter
const ktx2File = (byteLength = 64) => {
    const data = new Uint8Array(byteLength);
    data.set(KTX2_IDENTIFIER);
    return data;
};

// what a decoder returns: two RGBA8 levels, each in its own buffer
const decodedData = () => ({
    width: 4,
    height: 4,
    transcodedFormat: 0x8058,
    isInGammaSpace: false,
    hasAlpha: true,
    transcoderName: "test",
    errors: undefined as string | undefined,
    mipmaps: [
        { data: new Uint8Array(64), width: 4, height: 4 },
        { data: new Uint8Array(16), width: 2, height: 2 },
    ],
});

// a pool of one worker that answers each decode with new levels; it keeps the decode messages and the levels it sent, and with
// detach, the buffers posted to it are detached, as a real postMessage does with its transfer list
const workerPool = (detach = false) => {
    const decodes: Array<{ data: Uint8Array; transfer: Transferable[] }> = [];
    const sent: Array<ReturnType<typeof decodedData>> = [];
    const listeners: Record<string, (event: any) => void> = {};
    const worker = {
        addEventListener: (type: string, listener: (event: any) => void) => (listeners[type] = listener),
        removeEventListener: (type: string) => delete listeners[type],
        postMessage: (message: any, transfer: Transferable[] = []) => {
            if (message.action === "decode") {
                decodes.push({ data: message.data, transfer });
                if (detach) {
                    structuredClone(transfer, { transfer });
                }
                const levels = decodedData();
                sent.push(levels);
                queueMicrotask(() => listeners.message({ data: { action: "decoded", success: true, decodedData: levels } }));
            }
        },
    };
    KhronosTextureContainer2.WorkerPool = { push: (task: (worker: any, onComplete: () => void) => void) => task(worker, () => {}) } as any;
    return { decodes, sent };
};

describe("KhronosTextureContainer2", () => {
    afterEach(() => {
        KhronosTextureContainer2.WorkerPool = undefined;
        (KhronosTextureContainer2 as any)._WorkerPoolPromise = undefined;
        (KhronosTextureContainer2 as any)._DecoderModulePromise = undefined;
        vi.restoreAllMocks();
    });

    const upload = async (engine: NullEngine, data: ArrayBufferView, ownsData: boolean) => {
        const texture = new InternalTexture(engine, InternalTextureSource.Url);
        await new KhronosTextureContainer2(engine)._uploadAsync(data, texture, undefined, ownsData);
        return texture;
    };

    it("gives a worker the buffer of a file nothing else holds, and a copy of any other data", async () => {
        const { decodes } = workerPool();
        const engine = new NullEngine();
        const owned = ktx2File();
        const notOwned = ktx2File();
        const part = new Uint8Array(ktx2File(80).buffer, 16, 64);

        await upload(engine, owned, true);
        await upload(engine, notOwned, false);
        await upload(engine, part, true);

        expect(decodes[0].data.buffer).toBe(owned.buffer);
        expect(decodes[1].data.buffer).not.toBe(notOwned.buffer);
        expect(Array.from(decodes[1].data)).toEqual(Array.from(notOwned));
        expect(decodes[2].data.buffer).not.toBe(part.buffer);
        expect(Array.from(decodes[2].data)).toEqual(Array.from(part));
        for (const decode of decodes) {
            expect(decode.transfer).toEqual([decode.data.buffer]);
        }
        engine.dispose();
    });

    it("frees the levels a worker sent once they are uploaded", async () => {
        const { sent } = workerPool();
        const engine = new NullEngine();
        const uploaded: number[] = [];
        vi.spyOn(engine, "_uploadDataToTextureDirectly").mockImplementation((_texture, data) => {
            uploaded.push(data.byteLength);
        });

        const texture = await upload(engine, ktx2File(), true);

        expect(uploaded).toEqual([64, 16]);
        expect(sent[0].mipmaps.map((mipmap) => mipmap.data.byteLength)).toEqual([0, 0]);
        expect(texture.isReady).toBe(true);
        engine.dispose();
    });

    it("keeps the levels a decoder returns on the main thread", async () => {
        const levels = decodedData();
        (KhronosTextureContainer2 as any)._DecoderModulePromise = Promise.resolve({ decode: async () => levels });
        const engine = new NullEngine();

        const texture = await upload(engine, ktx2File(), true);

        expect(levels.mipmaps.map((mipmap) => mipmap.data.byteLength)).toEqual([64, 16]);
        expect(texture.isReady).toBe(true);
        engine.dispose();
    });

    it("is told it owns the data of a texture loaded from its url, not the data a texture is created from", async () => {
        workerPool();
        const uploadAsync = vi.spyOn(KhronosTextureContainer2.prototype, "_uploadAsync").mockResolvedValue();
        const engine = new NullEngine();
        vi.spyOn(engine, "_loadFile").mockImplementation((_url, onSuccess) => {
            onSuccess(ktx2File().buffer as ArrayBuffer);
            return {} as any;
        });
        const create = async (url: string, buffer: ArrayBuffer | null) =>
            await new Promise<void>((resolve) => {
                (engine as any)._createTextureBase(
                    url,
                    true,
                    false,
                    null,
                    undefined,
                    null,
                    null,
                    () => resolve(),
                    () => {},
                    buffer
                );
            });

        await create("loaded.ktx2", null);
        await create("created.ktx2", ktx2File().buffer as ArrayBuffer);

        expect(uploadAsync.mock.calls.map((call) => call[3])).toEqual([true, false]);
        engine.dispose();
    });

    it("copies a file an offline provider serves, since the provider can keep it in its cache", async () => {
        const { decodes } = workerPool(true);
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const cached = ktx2File().buffer as ArrayBuffer;
        // a provider that serves the same cached buffer for every load
        scene.offlineProvider = {
            enableSceneOffline: true,
            enableTexturesOffline: true,
            open: (success: () => void) => success(),
            loadImage: () => {},
            loadFile: (_url: string, loaded: (data: any) => void) => loaded(cached),
        };
        const load = async () =>
            await new Promise<void>((resolve) => {
                (engine as any)._createTextureBase(
                    "cached.ktx2",
                    true,
                    false,
                    scene,
                    undefined,
                    null,
                    () => resolve(),
                    () => resolve(),
                    () => {}
                );
            });

        await load();
        await load();

        expect(cached.byteLength).toBe(64);
        expect(decodes.length).toBe(2);
        expect(decodes.map((decode) => decode.data.buffer === cached)).toEqual([false, false]);
        scene.dispose();
        engine.dispose();
    });
});
