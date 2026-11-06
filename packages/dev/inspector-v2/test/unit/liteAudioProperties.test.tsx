/**
 * @vitest-environment jsdom
 */

import { type AudioEngine, type StaticSound, type StreamingSound, createDirectionalLight, createHemisphericLight, createPointLight, createSpotLight } from "@babylonjs/lite";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { LiteAudioSoundCommands, LiteAudioSoundProperties } from "../../src/lite/components/properties/audioProperties";
import { CreateAudioEngineContext } from "../../src/lite/audioEngineContext";
import { LiteAudioPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/audioPropertiesService";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { CreateP9Selection, CreateP9Watcher, RenderP9Properties } from "./liteP9TestUtils";

const AudioMocks = vi.hoisted(() => ({
    unlock: vi.fn(),
    playSound: vi.fn(),
    playStreamingSound: vi.fn(),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        unlockAudioEngineAsync: AudioMocks.unlock,
        playSound: AudioMocks.playSound,
        playStreamingSound: AudioMocks.playStreamingSound,
    };
});

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});

function CreateAudioGraph() {
    const mainBus = { name: "default", _volumeRamp: { _targetValue: 1 } };
    const effects = { name: "Effects", _outBus: mainBus, _graph: { _volumeRamp: { _targetValue: 0.5 }, _spatial: null } };
    const sound = {
        name: "",
        _outBus: effects,
        _graph: { _volumeRamp: { _targetValue: 0.5 }, _spatial: null as object | null },
        state: 1,
        instanceCount: 0,
        onEnded: { add: vi.fn(), addOnce: vi.fn() },
        buffer: { duration: 2, sampleRate: 48000, channelCount: 2, length: 96000 },
    };
    const streaming = {
        name: "",
        _outBus: effects,
        _graph: { _volumeRamp: { _targetValue: 0.5 }, _spatial: null },
        state: 1,
        instanceCount: 0,
        onEnded: { add: vi.fn(), addOnce: vi.fn() },
        preloadCompletedCount: 1,
    };
    const engine = { _mainBus: mainBus, _buses: [effects], _sounds: [sound, streaming], _listener: null };
    return {
        engine,
        audioEngine: engine as unknown as AudioEngine,
        effects,
        sound,
        staticSound: sound as unknown as StaticSound,
        streamingSound: streaming as unknown as StreamingSound,
    };
}

function FindButton(container: HTMLElement, name: string): HTMLButtonElement | undefined {
    return [...container.querySelectorAll("button")].find((button) => button.textContent === name);
}

function CreateDeferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((complete) => {
        resolve = complete;
    });
    return { promise, resolve };
}

describe("Babylon Lite audio properties", () => {
    const renders: ReturnType<typeof RenderP9Properties>[] = [];

    beforeEach(() => {
        AudioMocks.unlock.mockReset();
        AudioMocks.playSound.mockReset();
        AudioMocks.playStreamingSound.mockReset();
    });

    afterEach(() => {
        renders.splice(0).forEach((render) => render.dispose());
        vi.restoreAllMocks();
    });

    it("updates output bus names and retains the correct selection", () => {
        const graph = CreateAudioGraph();
        const selection = CreateP9Selection();
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundProperties engine={graph.audioEngine} sound={graph.staticSound} selectionService={selection} />, watcher);
        renders.push(render);

        expect(FindButton(render.container, "Effects")).toBeDefined();
        graph.effects.name = "Renamed Effects";
        act(() => watcher.refresh());
        expect(FindButton(render.container, "Effects")).toBeUndefined();
        const renamed = FindButton(render.container, "Renamed Effects");
        expect(renamed).toBeDefined();
        act(() => renamed!.click());
        expect(selection.selectedEntity).toBe(graph.effects);

        graph.effects.name = "";
        act(() => watcher.refresh());
        expect(FindButton(render.container, "Unnamed Bus")).toBeDefined();
    });

    it("shows a disconnected output without a link until the bus is in the graph again", () => {
        const graph = CreateAudioGraph();
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundProperties engine={graph.audioEngine} sound={graph.staticSound} selectionService={CreateP9Selection()} />, watcher);
        renders.push(render);

        expect(FindButton(render.container, "Effects")).toBeDefined();
        graph.engine._buses.splice(0, 1);
        act(() => watcher.refresh());
        expect(render.container.textContent).toContain("Effects");
        expect(FindButton(render.container, "Effects")).toBeUndefined();

        graph.engine._buses.push(graph.effects);
        act(() => watcher.refresh());
        expect(FindButton(render.container, "Effects")).toBeDefined();
    });

    it("does not navigate to a bus disposed before the next refresh", () => {
        const graph = CreateAudioGraph();
        const selection = CreateP9Selection();
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundProperties engine={graph.audioEngine} sound={graph.staticSound} selectionService={selection} />, watcher);
        renders.push(render);

        graph.engine._buses.splice(0, 1);
        act(() => FindButton(render.container, "Effects")!.click());
        expect(selection.selectedEntity).toBeNull();
        expect(FindButton(render.container, "Effects")).toBeUndefined();
        expect(render.container.textContent).toContain("Effects");
    });

    it("registers audio backlinks for real Lite lights and navigates to an attached sound", () => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        const selection = CreateP9Selection();
        const registrations = new Map<string, Parameters<IPropertiesService["addSectionContent"]>[0]>();
        const properties = {
            addSectionContent: (content: Parameters<IPropertiesService["addSectionContent"]>[0]) => {
                registrations.set(content.key, content);
                return { dispose: vi.fn() };
            },
        } as unknown as IPropertiesService;
        const service = LiteAudioPropertiesServiceDefinition.factory(properties, audioContext.context, selection)!;
        const section = registrations.get("Babylon Lite Attached Audio Properties")!;
        const lights = [createHemisphericLight([0, 1, 0]), createDirectionalLight([0, -1, 0]), createPointLight([0, 2, 0]), createSpotLight([0, 2, 0], [0, -1, 0], Math.PI / 3, 2)];
        for (const light of lights) {
            expect(section.predicate(light)).toBe(true);
        }

        graph.sound._graph._spatial = { _attached: lights[2], _position: { x: 0, y: 0, z: 0 } };
        const { watcher } = CreateP9Watcher();
        const Component = section.content[0].component;
        const render = RenderP9Properties(<Component context={lights[2]} />, watcher);
        renders.push(render);
        const soundLink = FindButton(render.container, "Static Sound 1");
        expect(soundLink).toBeDefined();
        act(() => soundLink!.click());
        expect(selection.selectedEntity).toBe(graph.sound);
        service.dispose?.();
        audioContext.context.dispose();
    });

    it("plays a live sound after unlocking its current audio engine", async () => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        const deferred = CreateDeferred();
        AudioMocks.unlock.mockReturnValue(deferred.promise);
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundCommands engine={graph.audioEngine} sound={graph.staticSound} audioEngineContext={audioContext.context} />, watcher);
        renders.push(render);

        act(() => FindButton(render.container, "Play")!.click());
        expect(AudioMocks.unlock).toHaveBeenCalledWith(graph.audioEngine);
        expect(AudioMocks.playSound).not.toHaveBeenCalled();
        await act(async () => deferred.resolve());
        expect(AudioMocks.playSound).toHaveBeenCalledExactlyOnceWith(graph.staticSound);
        expect(audioContext.context.onAudioEngineChanged).toBeInstanceOf(Observable);
        expect((audioContext.context.onAudioEngineChanged as Observable<void>).hasObservers()).toBe(false);
    });

    it("plays a live streaming sound after unlocking its current audio engine", async () => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        AudioMocks.unlock.mockResolvedValue(undefined);
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundCommands engine={graph.audioEngine} sound={graph.streamingSound} audioEngineContext={audioContext.context} />, watcher);
        renders.push(render);

        await act(async () => {
            FindButton(render.container, "Play")!.click();
            await Promise.resolve();
        });
        expect(AudioMocks.playStreamingSound).toHaveBeenCalledExactlyOnceWith(graph.streamingSound);
        expect(AudioMocks.playSound).not.toHaveBeenCalled();
    });

    it.each(["detach", "replace", "detach and reattach", "inspector disposal", "sound disposal"])("does not play when %s occurs during an unlock", async (change) => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        const deferred = CreateDeferred();
        AudioMocks.unlock.mockReturnValue(deferred.promise);
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundCommands engine={graph.audioEngine} sound={graph.staticSound} audioEngineContext={audioContext.context} />, watcher);
        renders.push(render);

        act(() => FindButton(render.container, "Play")!.click());
        switch (change) {
            case "detach":
                audioContext.setAudioEngine(null);
                break;
            case "replace":
                audioContext.setAudioEngine(CreateAudioGraph().audioEngine);
                break;
            case "detach and reattach":
                audioContext.setAudioEngine(null);
                audioContext.setAudioEngine(graph.audioEngine);
                break;
            case "inspector disposal":
                audioContext.context.dispose();
                break;
            case "sound disposal":
                graph.engine._sounds.splice(0, 1);
                break;
        }
        expect((audioContext.context.onAudioEngineChanged as Observable<void>).hasObservers()).toBe(change === "sound disposal");
        await act(async () => deferred.resolve());
        expect(AudioMocks.playSound).not.toHaveBeenCalled();
        expect(AudioMocks.playStreamingSound).not.toHaveBeenCalled();
        expect((audioContext.context.onAudioEngineChanged as Observable<void>).hasObservers()).toBe(false);
    });

    it("reports unlock failures without playing the sound", async () => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        AudioMocks.unlock.mockRejectedValue(new Error("Audio context is closed"));
        const error = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundCommands engine={graph.audioEngine} sound={graph.staticSound} audioEngineContext={audioContext.context} />, watcher);
        renders.push(render);

        await act(async () => {
            FindButton(render.container, "Play")!.click();
            await Promise.resolve();
        });
        expect(error).toHaveBeenCalledWith(expect.stringContaining("Audio context is closed"));
        expect(AudioMocks.playSound).not.toHaveBeenCalled();
        expect((audioContext.context.onAudioEngineChanged as Observable<void>).hasObservers()).toBe(false);
    });

    it("reports an unavailable graph without playing the sound", async () => {
        const graph = CreateAudioGraph();
        const audioContext = CreateAudioEngineContext(graph.audioEngine);
        const deferred = CreateDeferred();
        AudioMocks.unlock.mockReturnValue(deferred.promise);
        const warning = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<LiteAudioSoundCommands engine={graph.audioEngine} sound={graph.staticSound} audioEngineContext={audioContext.context} />, watcher);
        renders.push(render);

        act(() => FindButton(render.container, "Play")!.click());
        Object.assign(graph.engine, { _sounds: null });
        await act(async () => deferred.resolve());
        expect(warning).toHaveBeenCalledWith(expect.stringContaining("audio engine layout is unsupported"));
        expect(AudioMocks.playSound).not.toHaveBeenCalled();
    });
});
