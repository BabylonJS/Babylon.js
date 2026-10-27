/**
 * @vitest-environment jsdom
 */
import { type ParticleSystem, type SceneContext } from "@babylonjs/lite";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { Scenes, Systems, Started, Start, Stop } = vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe() {}
            public unobserve() {}
            public disconnect() {}
        }
    );
    const started = new Set<ParticleSystem>();
    return {
        Scenes: [] as SceneContext[],
        Systems: new Map<SceneContext, ParticleSystem[]>(),
        Started: started,
        Start: vi.fn((system: ParticleSystem) => started.add(system)),
        Stop: vi.fn((system: ParticleSystem) => started.delete(system)),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@babylonjs/lite")>()),
    getParticleSystems: (scene: SceneContext) => Systems.get(scene) ?? [],
    isParticleSystemStarted: (system: ParticleSystem) => Started.has(system),
    startParticleSystem: Start,
    stopParticleSystem: Stop,
    getRenderingContexts: () => Scenes,
    getRenderingContextKind: () => "scene",
}));

import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { ParticleSystemCommandProperties, ParticleSystemEmissionProperties, ParticleSystemGeneralProperties } from "../../src/lite/components/properties/particleSystemProperties";
import { GetParticleSystemDisplayName, GetEngineParticleSystems, IsParticleSystem, ToggleParticleSystem } from "../../src/lite/particleUtils";
import { ParticleSystemPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/particleSystemPropertiesService";
import { ParticleSystemExplorerServiceDefinition } from "../../src/lite/services/panes/scene/particleSystemExplorerService";
import { CreateP9Engine, CreateP9Selection, CreateP9Watcher, RenderP9Properties } from "./liteP9TestUtils";

function SystemFixture(name?: string): ParticleSystem {
    return { name, buffer: { capacity: 100, alive: 7 }, emitRate: 10, updateSpeed: 0.01, targetStopDuration: 0 } as ParticleSystem;
}

const Renders: ReturnType<typeof RenderP9Properties>[] = [];
beforeEach(() => {
    Scenes.length = 0;
    Systems.clear();
    Started.clear();
    Start.mockClear();
    Stop.mockClear();
});
afterEach(() => Renders.splice(0).forEach((render) => render.dispose()));

describe("Babylon Lite particle discovery and explorer", () => {
    it("uses identity membership, first-registration order, scene deduplication and fallback labels", () => {
        const h = CreateP9Engine();
        Scenes.push(h.scene);
        const first = SystemFixture("Sparks");
        const second = SystemFixture();
        expect(GetEngineParticleSystems(h.engine)).toEqual([]);
        Systems.set(h.scene, [first, second]);
        const other = { meshes: [] } as unknown as SceneContext;
        Scenes.push(other);
        Systems.set(other, [first]);
        expect(GetEngineParticleSystems(h.engine)).toEqual([first, second]);
        expect(GetParticleSystemDisplayName(first, 0)).toBe("Sparks");
        expect(GetParticleSystemDisplayName(second, 1)).toBe("Particle System 2");
        expect(IsParticleSystem(h.engine, first)).toBe(true);
        expect(IsParticleSystem(h.engine, { ...first })).toBe(false);
        expect(IsParticleSystem(h.engine, null)).toBe(false);
        ToggleParticleSystem(first);
        expect(Start).toHaveBeenCalledWith(first);
        ToggleParticleSystem(first);
        expect(Stop).toHaveBeenCalledWith(first);
        expect(first.buffer.alive).toBe(7);
    });

    it("polls fresh empty lists structurally, discovers later registration, watches toggle and name, and releases registrations", () => {
        const h = CreateP9Engine();
        Scenes.push(h.scene);
        const { watcher, checks } = CreateP9Watcher();
        const selection = CreateP9Selection();
        const explorer = CreateExplorerService();
        let provider: RenderingContextNodeProvider<SceneContext> | undefined;
        const dispose = vi.fn();
        const engineExplorer = {
            addRenderingContextNodeProvider: (registration: RenderingContextNodeProvider<SceneContext>) => {
                provider = registration;
                return { dispose };
            },
        } as unknown as IEngineExplorerService;
        const service = ParticleSystemExplorerServiceDefinition.factory(engineExplorer, explorer, watcher, { engine: h.engine }, selection)!;
        expect(provider!.order).toBe(340);
        expect(provider!.getNodes(h.scene)).toEqual([]);
        const firstEmpty = provider!.getSnapshot(h.scene);
        expect(provider!.getSnapshot(h.scene)).not.toBe(firstEmpty);
        expect(provider!.getSnapshot(h.scene)).toEqual(firstEmpty);
        selection.selectedEntity = h.engine;
        watcher.refresh();
        watcher.refresh();
        expect(selection.selectedEntity).toBe(h.engine);

        const system = SystemFixture("Sparks");
        Systems.set(h.scene, [system]);
        watcher.refresh();
        const tree = BuildExplorerTree(provider!.getNodes(h.scene));
        const node = tree.nodes[0].children![0];
        expect(node.entity).toBe(system);
        const info = node.getDisplayInfo();
        const changed = vi.fn();
        info.onChange!.add(changed);
        system.name = "Renamed";
        watcher.refresh();
        expect(info.name).toBe("Renamed");
        expect(changed).toHaveBeenCalledOnce();
        const commandProvider = explorer.itemCommandProviders.items[0];
        expect(commandProvider.predicate(system)).toBe(true);
        expect(commandProvider.predicate({ ...system })).toBe(false);
        const command = commandProvider.getCommand(system);
        if (!command || command.type !== "toggle") {
            throw new Error("Expected particle start/stop toggle");
        }
        const commandChanged = vi.fn();
        command.onChange!.add(commandChanged);
        expect(command.isEnabled).toBe(false);
        command.isEnabled = true;
        expect(command.isEnabled).toBe(true);
        command.isEnabled = false;
        expect(command.isEnabled).toBe(false);
        expect(commandChanged).toHaveBeenCalledTimes(2);
        Started.add(system);
        watcher.refresh();
        expect(commandChanged).toHaveBeenCalledTimes(3);

        const next = SystemFixture("Second");
        Systems.get(h.scene)!.push(next);
        watcher.refresh();
        expect(provider!.getSnapshot(h.scene)).toEqual([system, next]);
        selection.selectedEntity = system;
        Systems.delete(h.scene);
        watcher.refresh();
        expect(selection.selectedEntity).toBeNull();
        expect(provider!.getNodes(h.scene)).toEqual([]);
        info.dispose?.();
        command.dispose?.();
        service.dispose?.();
        expect(dispose).toHaveBeenCalledOnce();
        expect(explorer.itemCommandProviders.items).toEqual([]);
        expect(checks.size).toBe(0);
        explorer.dispose();
    });

    it("retains a selection reachable in another scene and clears it on final scene unregistration", () => {
        const h = CreateP9Engine();
        const other = { meshes: [] } as unknown as SceneContext;
        Scenes.push(h.scene, other);
        const system = SystemFixture();
        Systems.set(h.scene, [system]);
        Systems.set(other, [system]);
        const { watcher } = CreateP9Watcher();
        const selection = CreateP9Selection();
        const explorer = CreateExplorerService();
        const engineExplorer = { addRenderingContextNodeProvider: () => ({ dispose: vi.fn() }) } as unknown as IEngineExplorerService;
        const service = ParticleSystemExplorerServiceDefinition.factory(engineExplorer, explorer, watcher, { engine: h.engine }, selection)!;
        selection.selectedEntity = system;
        Systems.delete(h.scene);
        watcher.refresh();
        expect(selection.selectedEntity).toBe(system);
        Scenes.pop();
        watcher.refresh();
        expect(selection.selectedEntity).toBeNull();
        service.dispose?.();
        explorer.dispose();
    });

    it("registers only reachable systems' lazy General, Commands and Emission sections and disposes them", () => {
        const h = CreateP9Engine();
        Scenes.push(h.scene);
        const system = SystemFixture();
        Systems.set(h.scene, [system]);
        type Content = Parameters<IPropertiesService["addSectionContent"]>[0];
        const add = vi.fn<(content: Content) => { dispose: () => void }>();
        const dispose = vi.fn();
        add.mockReturnValue({ dispose });
        const service = ParticleSystemPropertiesServiceDefinition.factory({ addSectionContent: add } as unknown as IPropertiesService, { engine: h.engine })!;
        const content = add.mock.calls[0][0];
        expect(content.predicate(system)).toBe(true);
        expect(content.predicate({ ...system })).toBe(false);
        expect(content.content.map((section) => section.section)).toEqual(["General", "Commands", "Emission"]);
        service.dispose?.();
        expect(dispose).toHaveBeenCalledOnce();
    });
});

describe("Babylon Lite particle properties", () => {
    it("updates read-only running state and draining counts with manual refresh, and toggles Commands", () => {
        const system = SystemFixture();
        const { watcher, checks } = CreateP9Watcher();
        const render = RenderP9Properties(
            <>
                <ParticleSystemGeneralProperties system={system} />
                <ParticleSystemCommandProperties system={system} />
            </>,
            watcher
        );
        Renders.push(render);
        expect(render.container.textContent).toContain("NameNone");
        expect(render.container.textContent).toContain("Capacity100");
        expect(render.container.textContent).toContain("Active Particles7");
        const button = () => render.container.querySelector("button")!;
        expect(button().textContent).toBe("Start");
        act(() => button().click());
        expect(button().textContent).toBe("Stop");
        expect(render.container.textContent).toContain("Startedtrue");
        act(() => button().click());
        expect(render.container.textContent).toContain("Startedfalse");
        expect(system.buffer.alive).toBe(7);
        act(() => {
            system.buffer.alive = 3;
            watcher.refresh();
        });
        expect(render.container.textContent).toContain("Active Particles3");
        render.dispose();
        Renders.pop();
        expect(checks.size).toBe(0);
    });

    it("writes only supported emission values and exposes their caveats", () => {
        const system = SystemFixture("Sparks");
        const { watcher } = CreateP9Watcher();
        const render = RenderP9Properties(<ParticleSystemEmissionProperties system={system} />, watcher);
        Renders.push(render);
        const inputs = render.container.querySelectorAll<HTMLInputElement>("input");
        expect(inputs).toHaveLength(3);
        act(() => {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
            inputs[0].focus();
            setter.call(inputs[0], "25");
            inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
        });
        act(() => inputs[0].blur());
        expect(system.emitRate).toBe(25);
        for (const [index, value] of [
            [1, "0.02"],
            [2, "4"],
        ] as const) {
            act(() => {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
                inputs[index].focus();
                setter.call(inputs[index], value);
                inputs[index].dispatchEvent(new Event("input", { bubbles: true }));
            });
            act(() => inputs[index].blur());
        }
        expect(system.updateSpeed).toBe(0.02);
        expect(system.targetStopDuration).toBe(4);
        expect(render.container.textContent).not.toContain("Lifetime");
        expect(render.container.textContent).not.toContain("Reset");
    });
});
