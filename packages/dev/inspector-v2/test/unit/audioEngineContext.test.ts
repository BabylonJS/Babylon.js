import { type AudioEngine } from "@babylonjs/lite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { CreateAudioEngineContext } from "../../src/lite/audioEngineContext";
import { AudioEngineExplorerServiceDefinition } from "../../src/lite/audioEngineExplorerService";
import { GetLiteAudioAttachments, GetLiteAudioGraph, GetLiteAudioNodeVolume, GetLiteAudioSpatialInfo } from "../../src/lite/audioEngineGraph";
import { type ExplorerRootProvider, type IEngineExplorerService } from "../../src/lite/engineExplorerService";
import { type ExplorerNodeDescription } from "../../src/components/explorer/explorerModel";
import { CreateP9Watcher } from "./liteP9TestUtils";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }))
    );
});

function CreateHost(name: string, output: object | null) {
    return {
        name,
        _outBus: output,
        _graph: { _volumeRamp: { _targetValue: 0.5 }, _spatial: null as object | null },
    };
}

function CreateAudioGraph() {
    const mainBus = { name: "default", _volumeRamp: { _targetValue: 1 } };
    const effects = CreateHost("Effects", mainBus);
    const music = CreateHost("Music", mainBus);
    const sound = {
        ...CreateHost("", effects),
        state: 1,
        instanceCount: 0,
        onEnded: { add: vi.fn(), addOnce: vi.fn() },
        buffer: { duration: 2, sampleRate: 48000, channelCount: 2, length: 96000 },
    };
    const source = { ...CreateHost("Oscillator", effects), _node: {} };
    const engine = { _mainBus: mainBus, _buses: [effects, music], _sounds: [sound, source], _listener: null as object | null };
    return { engine, audioEngine: engine as unknown as AudioEngine, mainBus, effects, music, sound, source };
}

function GetNodeName(node: ExplorerNodeDescription): string {
    const display = node.getDisplayInfo();
    const name = display.name;
    display.dispose?.();
    return name;
}

function CreateExplorer() {
    const audioEngineContext = CreateAudioEngineContext();
    const { watcher, checks } = CreateP9Watcher();
    let rootProvider: ExplorerRootProvider | undefined;
    const rootRegistration = { dispose: vi.fn() };
    const explorerRootService = {
        addRootProvider: vi.fn((provider: ExplorerRootProvider) => {
            rootProvider = provider;
            return rootRegistration;
        }),
    } as unknown as IEngineExplorerService;
    const service = AudioEngineExplorerServiceDefinition.factory(explorerRootService, audioEngineContext.context, watcher)!;
    return {
        audioEngineContext,
        watcher,
        checks,
        rootRegistration,
        service,
        getRootProvider: () => {
            if (!rootProvider) {
                throw new Error("Expected an audio Explorer root provider.");
            }
            return rootProvider;
        },
    };
}

describe("Audio engine context", () => {
    afterEach(() => vi.restoreAllMocks());

    it("notifies consumers when the attached audio engine changes", () => {
        const audioEngineContext = CreateAudioEngineContext();
        const firstAudioEngine = { state: "running" } as AudioEngine;
        const secondAudioEngine = { state: "suspended" } as AudioEngine;
        const changed = vi.fn();
        const observer = audioEngineContext.context.onAudioEngineChanged.add(changed);

        expect(audioEngineContext.context.audioEngine).toBeNull();

        audioEngineContext.setAudioEngine(firstAudioEngine);
        expect(audioEngineContext.context.audioEngine).toBe(firstAudioEngine);
        expect(changed).toHaveBeenCalledTimes(1);

        audioEngineContext.setAudioEngine(firstAudioEngine);
        expect(changed).toHaveBeenCalledTimes(1);

        audioEngineContext.setAudioEngine(secondAudioEngine);
        expect(audioEngineContext.context.audioEngine).toBe(secondAudioEngine);
        expect(changed).toHaveBeenCalledTimes(2);

        audioEngineContext.setAudioEngine(null);
        expect(audioEngineContext.context.audioEngine).toBeNull();
        expect(changed).toHaveBeenCalledTimes(3);

        observer.remove();
    });

    it("releases the attached engine and ignores changes after disposal", () => {
        const audioEngineContext = CreateAudioEngineContext();
        const audioEngine = { state: "running" } as AudioEngine;
        const changed = vi.fn();
        audioEngineContext.context.onAudioEngineChanged.add(changed);
        audioEngineContext.setAudioEngine(audioEngine);
        audioEngineContext.context.dispose();

        expect(audioEngineContext.context.audioEngine).toBeNull();
        audioEngineContext.setAudioEngine(audioEngine);
        expect(audioEngineContext.context.audioEngine).toBeNull();
        expect(changed).toHaveBeenCalledOnce();
    });

    it("contributes and removes the audio engine Explorer root dynamically", () => {
        const { audioEngineContext, checks, getRootProvider, rootRegistration, service } = CreateExplorer();
        const { audioEngine } = CreateAudioGraph();
        const rootProvider = getRootProvider();
        const changed = vi.fn();
        const observer = rootProvider.onChanged!.add(changed);

        expect(rootProvider.getRoots()).toEqual([]);

        audioEngineContext.setAudioEngine(audioEngine);
        expect(rootProvider.getRoots()).toMatchObject([{ entity: audioEngine, label: "Audio Engine" }]);
        expect(changed).toHaveBeenCalledOnce();

        audioEngineContext.setAudioEngine(null);
        expect(rootProvider.getRoots()).toEqual([]);
        expect(changed).toHaveBeenCalledTimes(2);

        observer.remove();
        service.dispose?.();
        expect(rootRegistration.dispose).toHaveBeenCalledOnce();
        expect(checks.size).toBe(0);
    });

    it("unsubscribes from the audio context when the Explorer service is disposed", () => {
        const { audioEngineContext, service } = CreateExplorer();
        const changes = audioEngineContext.context.onAudioEngineChanged;
        if (!(changes instanceof Observable)) {
            throw new Error("Expected an Observable audio engine context.");
        }

        expect(changes.hasObservers()).toBe(true);
        service.dispose?.();
        expect(changes.hasObservers()).toBe(false);
    });

    it("shows buses and sounds by output routing and refreshes only when topology changes", () => {
        const { audioEngineContext, watcher, getRootProvider, service } = CreateExplorer();
        const graph = CreateAudioGraph();
        const changed = vi.fn();
        const rootProvider = getRootProvider();
        const observer = rootProvider.onChanged!.add(changed);
        audioEngineContext.setAudioEngine(graph.audioEngine);
        watcher.refresh();
        changed.mockClear();

        const getNodes = () => rootProvider.getRoots()[0].getNodes();
        const main = getNodes()[0];
        expect(GetNodeName(main)).toBe("Main Bus (default)");
        const buses = main.getChildren!();
        expect(buses.map(GetNodeName)).toEqual(["Effects", "Music"]);
        expect(buses[0].getChildren!().map(GetNodeName)).toEqual(["Static Sound 1", "Oscillator"]);

        watcher.refresh();
        expect(changed).not.toHaveBeenCalled();
        Object.assign(graph.sound, { _outBus: graph.music });
        watcher.refresh();
        expect(changed).toHaveBeenCalledOnce();
        expect(getNodes()[0].getChildren!()[1].getChildren!().map(GetNodeName)).toEqual(["Static Sound 1"]);

        graph.engine._sounds.splice(0, 1);
        watcher.refresh();
        expect(changed).toHaveBeenCalledTimes(2);
        expect(getNodes()[0].getChildren!()[1].getChildren!()).toEqual([]);
        observer.remove();
        service.dispose?.();
    });

    it("retains disconnected nodes and prevents cyclic routing from recursing indefinitely", () => {
        const { audioEngineContext, getRootProvider, service } = CreateExplorer();
        const graph = CreateAudioGraph();
        Object.assign(graph.effects, { _outBus: graph.music });
        Object.assign(graph.music, { _outBus: graph.effects });
        Object.assign(graph.source, { _outBus: { name: "unregistered bus" } });
        audioEngineContext.setAudioEngine(graph.audioEngine);

        const roots = getRootProvider().getRoots()[0].getNodes();
        expect(roots.map(GetNodeName)).toEqual(["Main Bus (default)", "Oscillator", "Effects"]);
        const cycle = roots[2].getChildren!()[0];
        expect(GetNodeName(cycle)).toBe("Music");
        expect(cycle.getChildren!()).toEqual([]);
        expect(roots[2].getChildren!().map(GetNodeName)).toEqual(["Music", "Static Sound 1"]);
        service.dispose?.();
    });

    it("warns and exposes an unsupported-layout root rather than inventing a graph", () => {
        const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});
        const { audioEngineContext, getRootProvider, service } = CreateExplorer();
        const { audioEngine, engine } = CreateAudioGraph();
        engine._sounds.push({} as (typeof engine._sounds)[number]);
        audioEngineContext.setAudioEngine(audioEngine);
        const rootProvider = getRootProvider();

        expect(rootProvider.getRoots()).toMatchObject([{ entity: audioEngine, label: "Audio Engine (unsupported audio graph)" }]);
        expect(rootProvider.getRoots()[0].getNodes()).toEqual([]);
        expect(warn).toHaveBeenCalledOnce();
        service.dispose?.();
    });
});

describe("Lite audio graph adapter", () => {
    it("finds only direct attachments, including multiple nodes and the listener", () => {
        const fixture = CreateAudioGraph();
        const target = { worldMatrix: new Float32Array(16) };
        const otherTarget = { worldMatrix: new Float32Array(16) };
        const position = { x: 0, y: 0, z: 0 };
        fixture.engine._listener = { _position: position, _attached: target };
        fixture.effects._graph._spatial = { _position: position, _attached: target };
        fixture.sound._graph._spatial = { _position: position, _attached: target };
        fixture.source._graph._spatial = { _position: position, _attached: otherTarget };
        const graph = GetLiteAudioGraph(fixture.audioEngine)!;

        expect(GetLiteAudioAttachments(graph, target)).toEqual([
            { entity: fixture.audioEngine, kind: "listener", name: "Audio Engine" },
            { entity: fixture.effects, kind: "bus", name: "Effects" },
            { entity: fixture.sound, kind: "static-sound", name: "Static Sound 1" },
        ]);
        fixture.sound._graph._spatial = null;
        expect(GetLiteAudioAttachments(graph, target)?.map((attachment) => attachment.entity)).toEqual([fixture.audioEngine, fixture.effects]);
        expect(GetLiteAudioAttachments(graph, otherTarget)).toEqual([{ entity: fixture.source, kind: "source", name: "Oscillator" }]);
        expect(GetLiteAudioAttachments(graph, { worldMatrix: new Float32Array(16) })).toEqual([]);
        fixture.source._graph._spatial = {};
        expect(GetLiteAudioAttachments(graph, target)).toBeNull();
    });

    it("reads validated graph nodes, routing, and volume without changing them", () => {
        const fixture = CreateAudioGraph();
        const graph = GetLiteAudioGraph(fixture.audioEngine);
        expect(graph?.entries.map((entry) => [entry.kind, entry.entity, entry.output])).toEqual([
            ["main-bus", fixture.mainBus, null],
            ["bus", fixture.effects, fixture.mainBus],
            ["bus", fixture.music, fixture.mainBus],
            ["static-sound", fixture.sound, fixture.effects],
            ["source", fixture.source, fixture.effects],
        ]);
        expect(GetLiteAudioNodeVolume(fixture.mainBus)).toBe(1);
        expect(GetLiteAudioNodeVolume(fixture.sound)).toBe(0.5);
        expect(() => GetLiteAudioNodeVolume({})).toThrow("audio node volume is unavailable");
    });

    it("distinguishes disabled, attached, and unsupported spatial layouts", () => {
        const fixture = CreateAudioGraph();
        const target = { worldMatrix: new Float32Array(16), name: "Mesh" };
        const position = { x: 1, y: 2, z: 3 };
        expect(GetLiteAudioSpatialInfo(fixture.audioEngine)).toEqual({ status: "disabled" });

        fixture.engine._listener = { _position: position, _attached: target };
        expect(GetLiteAudioSpatialInfo(fixture.audioEngine)).toEqual({ status: "enabled", attachedTo: target, position });
        fixture.sound._graph._spatial = { _position: position, _attached: null };
        expect(GetLiteAudioSpatialInfo(fixture.sound as unknown as Parameters<typeof GetLiteAudioSpatialInfo>[0])).toEqual({
            status: "enabled",
            attachedTo: null,
            position,
        });
        fixture.engine._listener = { _position: position, _attached: {} };
        expect(GetLiteAudioSpatialInfo(fixture.audioEngine)).toEqual({ status: "unsupported" });
    });
});
