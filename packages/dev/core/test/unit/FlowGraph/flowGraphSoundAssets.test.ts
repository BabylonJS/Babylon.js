import { type Engine, NullEngine } from "core/Engines";
import { FlowGraphCoordinator, FlowGraphSceneReadyEventBlock, ParseCoordinatorAsync } from "core/FlowGraph";
import { FlowGraphPlaySoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock";
import { FlowGraphIsSoundPlayingBlock } from "core/FlowGraph/Blocks/Data/Audio/flowGraphIsSoundPlayingBlock";
import { ResolveFlowGraphSound } from "core/FlowGraph/flowGraphSoundAssets";
import { AudioEngineV2, CreateSoundAsync, LastCreatedAudioEngine } from "core/AudioV2/abstractAudio/audioEngineV2";
import { CreateAudioEngineAsync } from "core/AudioV2/webAudio/webAudioEngine";
import { FlowGraphSoundEndedEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSoundEndedEventBlock";
import { SoundState } from "core/AudioV2/soundState";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("core/AudioV2/abstractAudio/audioEngineV2", async (importOriginal) => {
    const original = await importOriginal<typeof import("core/AudioV2/abstractAudio/audioEngineV2")>();
    return {
        ...original,
        CreateSoundAsync: vi.fn(),
        LastCreatedAudioEngine: vi.fn(),
    };
});

vi.mock("core/AudioV2/webAudio/webAudioEngine", () => ({
    CreateAudioEngineAsync: vi.fn(),
}));

function CreateMockSound(name: string, url: string) {
    return {
        name,
        url,
        state: SoundState.Stopped,
        volume: 1,
        onEndedObservable: new Observable<any>(),
        play: vi.fn(function (this: any) {
            this.state = SoundState.Started;
        }),
        stop: vi.fn(),
        dispose: vi.fn(),
    };
}

describe("Flow Graph sound assets", () => {
    let engine: Engine;
    let scene: Scene;
    const createSoundMock = vi.mocked(CreateSoundAsync);
    const lastEngineMock = vi.mocked(LastCreatedAudioEngine);
    const createEngineMock = vi.mocked(CreateAudioEngineAsync);
    const existingEngine = { dispose: vi.fn() } as any;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();
        scene = new Scene(engine);
        createSoundMock.mockReset();
        createSoundMock.mockImplementation((async (name: string, url: string) => CreateMockSound(name, url)) as any);
        lastEngineMock.mockReset();
        lastEngineMock.mockReturnValue(existingEngine);
        createEngineMock.mockReset();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("loads a declared sound asset and exposes it by name", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const sound = await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });

        expect(createSoundMock).toHaveBeenCalledWith("boing", "boing.mp3", {}, expect.anything());
        expect(coordinator.getSoundAsset("boing")).toBe(sound);
        expect(coordinator.soundAssets).toEqual([{ name: "boing", url: "boing.mp3" }]);
        expect(coordinator.getSoundAsset("missing")).toBeNull();
    });

    it("replaces an asset with the same name and disposes the previous sound", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const first = await coordinator.addSoundAssetAsync({ name: "boing", url: "first.mp3" });
        const second = await coordinator.addSoundAssetAsync({ name: "boing", url: "second.mp3" });

        expect(first.dispose).toHaveBeenCalled();
        expect(coordinator.getSoundAsset("boing")).toBe(second);
        expect(coordinator.soundAssets).toEqual([{ name: "boing", url: "second.mp3" }]);
    });

    it("disposes a sound that finishes loading after its asset was removed", async () => {
        let resolveLoad!: (sound: any) => void;
        createSoundMock.mockImplementationOnce((() => new Promise((resolve) => (resolveLoad = resolve))) as any);
        const coordinator = new FlowGraphCoordinator({ scene });
        const pending = coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        await vi.waitFor(() => expect(createSoundMock).toHaveBeenCalled());

        coordinator.removeSoundAsset("boing");
        const lateSound = CreateMockSound("boing", "boing.mp3");
        resolveLoad(lateSound);

        await expect(pending).rejects.toThrow(/removed or replaced/);
        expect(lateSound.dispose).toHaveBeenCalled();
        expect(coordinator.soundAssets).toEqual([]);
    });

    it("keeps an asset declared when its sound fails to load", async () => {
        createSoundMock.mockRejectedValueOnce(new Error("decode failed"));
        const coordinator = new FlowGraphCoordinator({ scene });

        await expect(coordinator.addSoundAssetAsync({ name: "broken", url: "broken.mp3" })).rejects.toThrow("decode failed");
        expect(coordinator.soundAssets).toEqual([{ name: "broken", url: "broken.mp3" }]);
        expect(coordinator.getSoundAsset("broken")).toBeNull();
    });

    it("disposes all sounds when the coordinator is disposed", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const sound = await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        coordinator.dispose();

        expect(sound.dispose).toHaveBeenCalled();
        expect(coordinator.soundAssets).toEqual([]);
    });

    it("resolves sounds, asset names and serialized references", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const sound = await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        const context = coordinator.createGraph().createContext();
        const directSound = CreateMockSound("direct", "direct.mp3");

        expect(ResolveFlowGraphSound(context, "boing")).toBe(sound);
        expect(ResolveFlowGraphSound(context, { name: "boing" })).toBe(sound);
        expect(ResolveFlowGraphSound(context, directSound as any)).toBe(directSound);
        expect(ResolveFlowGraphSound(context, "missing")).toBeNull();
        expect(ResolveFlowGraphSound(context, null)).toBeNull();
    });

    it("plays a sound asset referenced by name", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const sound = await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        const graph = coordinator.createGraph();
        const context = graph.createContext();
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(sceneReady);
        const play = new FlowGraphPlaySoundBlock();
        sceneReady.done.connectTo(play.in);
        play.sound.setValue("boing", context);

        graph.start();

        expect(sound.play).toHaveBeenCalledWith({ volume: 1, startOffset: 0, loop: false });
        const isPlaying = new FlowGraphIsSoundPlayingBlock();
        isPlaying.sound.setValue("boing", context);
        expect(isPlaying.value.getValue(context)).toBe(true);
    });

    it("serializes sound assets and loads them before parsing the graphs", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        await coordinator.addSoundAssetAsync({ name: "boing", url: "data:audio/mpeg;base64,AAAA" });
        const graph = coordinator.createGraph();
        const sceneReady = new FlowGraphSceneReadyEventBlock();
        graph.addEventBlock(sceneReady);
        const play = new FlowGraphPlaySoundBlock();
        sceneReady.done.connectTo(play.in);
        (play.sound as any)._defaultValue = "boing";

        const serialized: any = {};
        coordinator.serialize(serialized);
        expect(serialized.soundAssets).toEqual([{ name: "boing", url: "data:audio/mpeg;base64,AAAA" }]);

        createSoundMock.mockClear();
        const parsed = await ParseCoordinatorAsync(serialized, { scene });
        expect(createSoundMock).toHaveBeenCalledWith("boing", "data:audio/mpeg;base64,AAAA", {}, expect.anything());
        const parsedSound = parsed.getSoundAsset("boing")!;
        parsed.start();
        scene.onReadyObservable.notifyObservers(scene);
        expect(parsedSound.play).toHaveBeenCalled();
    });

    it("still parses the graphs when a sound asset fails to load", async () => {
        createSoundMock.mockRejectedValueOnce(new Error("offline"));
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

        const parsed = await ParseCoordinatorAsync({ _flowGraphs: [], soundAssets: [{ name: "boing", url: "boing.mp3" }] }, { scene });

        expect(parsed.soundAssets).toEqual([{ name: "boing", url: "boing.mp3" }]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"boing"'));
        warn.mockRestore();
    });

    it("does not serialize sound assets when none are declared", () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const serialized: any = {};
        coordinator.serialize(serialized);
        expect(serialized.soundAssets).toBeUndefined();
    });
    it("removes stale sound assets when serializing into a reused object", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        const serialized: any = {};
        coordinator.serialize(serialized);
        expect(serialized.soundAssets).toHaveLength(1);

        coordinator.removeSoundAsset("boing");
        coordinator.serialize(serialized);
        expect(serialized.soundAssets).toBeUndefined();
    });

    it("rebinds the sound ended event when a named sound asset is replaced", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const first = await coordinator.addSoundAssetAsync({ name: "boing", url: "first.mp3" });
        const graph = coordinator.createGraph();
        const context = graph.createContext();
        const ended = new FlowGraphSoundEndedEventBlock();
        graph.addEventBlock(ended);
        ended.sound.setValue("boing", context);
        const executeSpy = vi.spyOn(ended, "_execute");
        graph.start();

        const second = await coordinator.addSoundAssetAsync({ name: "boing", url: "second.mp3" });
        first.onEndedObservable.notifyObservers(first);
        expect(executeSpy).not.toHaveBeenCalled();
        second.onEndedObservable.notifyObservers(second);
        expect(executeSpy).toHaveBeenCalledTimes(1);

        graph.stop();
        expect(coordinator.onSoundAssetChangedObservable.hasObservers()).toBe(false);
        expect(second.onEndedObservable.hasObservers()).toBe(false);
    });

    it("binds the sound ended event when its named sound asset loads after the graph started", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        const context = graph.createContext();
        const ended = new FlowGraphSoundEndedEventBlock();
        graph.addEventBlock(ended);
        ended.sound.setValue("boing", context);
        const executeSpy = vi.spyOn(ended, "_execute");
        graph.start();

        const sound = await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        sound.onEndedObservable.notifyObservers(sound);
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    it("shares one fallback audio engine between parallel loads and disposes it with its last user", async () => {
        lastEngineMock.mockReturnValue(null);
        // Concurrent dynamic imports may bypass the module mock in Vitest, so the engine itself can also create sounds.
        const fallbackEngine = { dispose: vi.fn(), createSoundAsync: vi.fn(async (name: string, url: string) => CreateMockSound(name, url)) } as any;
        createEngineMock.mockImplementation(async () => {
            lastEngineMock.mockReturnValue(fallbackEngine);
            return fallbackEngine;
        });
        const coordinatorA = new FlowGraphCoordinator({ scene });
        const coordinatorB = new FlowGraphCoordinator({ scene });

        await Promise.all([
            coordinatorA.addSoundAssetAsync({ name: "a", url: "a.mp3" }),
            coordinatorA.addSoundAssetAsync({ name: "b", url: "b.mp3" }),
            coordinatorB.addSoundAssetAsync({ name: "c", url: "c.mp3" }),
        ]);
        expect(createEngineMock).toHaveBeenCalledTimes(1);
        const enginesUsed = [...createSoundMock.mock.calls.map((call) => call[3]), ...fallbackEngine.createSoundAsync.mock.calls.map(() => fallbackEngine)];
        expect(enginesUsed).toEqual([fallbackEngine, fallbackEngine, fallbackEngine]);

        coordinatorA.dispose();
        expect(fallbackEngine.dispose).not.toHaveBeenCalled();
        coordinatorB.dispose();
        expect(fallbackEngine.dispose).toHaveBeenCalledTimes(1);
    });

    it("never disposes an audio engine it did not create", async () => {
        const coordinator = new FlowGraphCoordinator({ scene });
        await coordinator.addSoundAssetAsync({ name: "boing", url: "boing.mp3" });
        coordinator.dispose();
        expect(createEngineMock).not.toHaveBeenCalled();
        expect(existingEngine.dispose).not.toHaveBeenCalled();
    });
    it("counts a coordinator that joins while the fallback audio engine is initializing", async () => {
        lastEngineMock.mockReturnValue(null);
        const fallbackEngine = { dispose: vi.fn(), createSoundAsync: vi.fn(async (name: string, url: string) => CreateMockSound(name, url)) } as any;
        let finishInit!: () => void;
        createEngineMock.mockImplementation(async () => {
            // Like AudioEngineV2, the engine is listed by LastCreatedAudioEngine before its initialization completes.
            // Concurrent dynamic imports may bypass the module mock in Vitest, so also list it in the real instances.
            lastEngineMock.mockReturnValue(fallbackEngine);
            (AudioEngineV2.Instances as unknown[]).push(fallbackEngine);
            await new Promise<void>((resolve) => (finishInit = resolve));
            return fallbackEngine;
        });
        const coordinatorA = new FlowGraphCoordinator({ scene });
        const coordinatorB = new FlowGraphCoordinator({ scene });

        const loadA = coordinatorA.addSoundAssetAsync({ name: "a", url: "a.mp3" });
        await vi.waitFor(() => expect(createEngineMock).toHaveBeenCalled());
        const loadB = coordinatorB.addSoundAssetAsync({ name: "b", url: "b.mp3" });
        // Let B pick its engine while A's fallback engine is still initializing.
        await new Promise((resolve) => setTimeout(resolve, 50));
        finishInit();
        await Promise.all([loadA, loadB]);
        expect(createEngineMock).toHaveBeenCalledTimes(1);

        coordinatorA.dispose();
        expect(fallbackEngine.dispose).not.toHaveBeenCalled();
        expect(coordinatorB.getSoundAsset("b")!.dispose).not.toHaveBeenCalled();
        coordinatorB.dispose();
        expect(fallbackEngine.dispose).toHaveBeenCalledTimes(1);
        (AudioEngineV2.Instances as unknown[]).splice(AudioEngineV2.Instances.indexOf(fallbackEngine), 1);
    });

    it("loads the descriptor as it was when the load started", async () => {
        let resolveLoad!: (sound: any) => void;
        createSoundMock.mockImplementationOnce((() => new Promise((resolve) => (resolveLoad = resolve))) as any);
        const coordinator = new FlowGraphCoordinator({ scene });
        const notified: string[] = [];
        coordinator.onSoundAssetChangedObservable.add((name) => notified.push(name));
        const descriptor = { name: "a", url: "a.mp3" };
        const pending = coordinator.addSoundAssetAsync(descriptor);
        await vi.waitFor(() => expect(createSoundMock).toHaveBeenCalled());

        descriptor.name = "b";
        descriptor.url = "b.mp3";
        const sound = CreateMockSound("a", "a.mp3");
        resolveLoad(sound);

        await expect(pending).resolves.toBe(sound);
        expect(createSoundMock).toHaveBeenCalledWith("a", "a.mp3", {}, expect.anything());
        expect(sound.dispose).not.toHaveBeenCalled();
        expect(coordinator.getSoundAsset("a")).toBe(sound);
        expect(coordinator.soundAssets).toEqual([{ name: "a", url: "a.mp3" }]);
        expect(notified).toEqual(["a"]);
    });
    it("uses an audio engine created by the application after the fallback engine is ready", async () => {
        lastEngineMock.mockReturnValue(null);
        const instances = AudioEngineV2.Instances as unknown[];
        const fallbackEngine = { dispose: vi.fn(), createSoundAsync: vi.fn(async (name: string, url: string) => CreateMockSound(name, url)) } as any;
        createEngineMock.mockImplementation(async () => {
            lastEngineMock.mockReturnValue(fallbackEngine);
            instances.push(fallbackEngine);
            return fallbackEngine;
        });
        const coordinator = new FlowGraphCoordinator({ scene });
        await coordinator.addSoundAssetAsync({ name: "a", url: "a.mp3" });

        // The application creates its own engine afterwards.
        const appEngine = { dispose: vi.fn(), createSoundAsync: vi.fn(async (name: string, url: string) => CreateMockSound(name, url)) } as any;
        lastEngineMock.mockReturnValue(appEngine);
        instances.push(appEngine);
        createSoundMock.mockClear();
        await coordinator.addSoundAssetAsync({ name: "b", url: "b.mp3" });

        const enginesUsed = [...createSoundMock.mock.calls.map((call) => call[3]), ...appEngine.createSoundAsync.mock.calls.map(() => appEngine)];
        expect(enginesUsed).toEqual([appEngine]);
        expect(createEngineMock).toHaveBeenCalledTimes(1);

        coordinator.dispose();
        expect(fallbackEngine.dispose).toHaveBeenCalledTimes(1);
        expect(appEngine.dispose).not.toHaveBeenCalled();
        instances.splice(instances.indexOf(fallbackEngine), 1);
        instances.splice(instances.indexOf(appEngine), 1);
    });
});
