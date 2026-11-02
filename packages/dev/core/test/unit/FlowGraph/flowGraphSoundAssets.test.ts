import { type Engine, NullEngine } from "core/Engines";
import { FlowGraphCoordinator, FlowGraphSceneReadyEventBlock, ParseCoordinatorAsync } from "core/FlowGraph";
import { FlowGraphPlaySoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock";
import { FlowGraphIsSoundPlayingBlock } from "core/FlowGraph/Blocks/Data/Audio/flowGraphIsSoundPlayingBlock";
import { ResolveFlowGraphSound } from "core/FlowGraph/flowGraphSoundAssets";
import { CreateSoundAsync } from "core/AudioV2/abstractAudio/audioEngineV2";
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
        LastCreatedAudioEngine: vi.fn(() => ({})),
    };
});

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
});
