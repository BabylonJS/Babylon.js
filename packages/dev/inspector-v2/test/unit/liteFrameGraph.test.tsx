/**
 * @vitest-environment jsdom
 */

import {
    createFrameGraphContext,
    createSceneContext,
    getFrameGraph,
    getFrameGraphTasks,
    type EngineContext,
    type FrameGraph,
    type RenderingContext,
    type SurfaceContext,
    type Task,
} from "@babylonjs/lite";
import { FluentProvider, tokens, webLightTheme } from "@fluentui/react-components";
import { FrameRegular } from "@fluentui/react-icons";
import { act, createElement, type ComponentProps, type FunctionComponent, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});

const { TaskLists, TaskCopies } = vi.hoisted(() => ({ TaskLists: new WeakMap<object, Task[]>(), TaskCopies: new Map<string, () => string>() }));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        getFrameGraphTasks: (graph: FrameGraph) => TaskLists.get(graph) ?? original.getFrameGraphTasks(graph),
    };
});

vi.mock("shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine", async (importOriginal) => {
    const original = await importOriginal<typeof import("shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine")>();
    const SwitchPropertyLine: FunctionComponent<ComponentProps<typeof original.SwitchPropertyLine>> = (props) => {
        const { label, onCopy } = props;
        if (onCopy) {
            TaskCopies.set(label, onCopy);
        }
        return createElement(original.SwitchPropertyLine, props);
    };
    return { ...original, SwitchPropertyLine };
});

import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { FrameGraphTaskProperties } from "../../src/lite/components/properties/frameGraphProperties";
import { EngineContextIdentity } from "../../src/lite/engineContext";
import { EngineExplorerServiceIdentity, type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { InspectorUtilityScenes } from "../../src/lite/sceneEntityUtils";
import { FrameGraphPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/frameGraphPropertiesService";
import { FrameGraphExplorerServiceDefinition } from "../../src/lite/services/panes/scene/frameGraphExplorerService";
import { PropertiesServiceIdentity, type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type IWatcherService } from "../../src/services/watcherService";

function CreateContexts() {
    const contexts: RenderingContext[] = [];
    const engine = { surfaces: [], _renderingContexts: contexts } as unknown as EngineContext;
    Object.assign(engine, { engine, surfaces: [engine] });
    const scene = createSceneContext(engine, { defaultRenderTask: false });
    const standalone = createFrameGraphContext(engine);
    contexts.push(scene, standalone);
    return { engine, scene, standalone, contexts };
}

function CreateTask(engine: EngineContext, name: string, executionEnabled?: boolean): Task {
    return { name, engine, record: vi.fn(), dispose: vi.fn(), ...(executionEnabled === undefined ? {} : { executionEnabled }) };
}

function CreateWatcher(): IWatcherService {
    const checks = new Set<() => void>();
    function WatchValue<T>(getValue: () => T, onChanged: (value: T) => void, equals: (left: T, right: T) => boolean = Object.is) {
        let previous = getValue();
        const check = () => {
            const current = getValue();
            if (!equals(previous, current)) {
                previous = current;
                onChanged(current);
            }
        };
        checks.add(check);
        return { dispose: () => checks.delete(check) };
    }
    return {
        watchProperty: (target, key, onChanged) => WatchValue(() => target[key], onChanged),
        watchValue: WatchValue,
        refresh: () => [...checks].forEach((check) => check()),
    };
}

describe("Babylon Lite frame graph explorer", () => {
    it("registers scene and standalone providers with ordered, stable graph nodes and no task children", () => {
        const { scene, standalone } = CreateContexts();
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const disposals: ReturnType<typeof vi.fn>[] = [];
        const explorer = {
            addRenderingContextNodeProvider: vi.fn((provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                const dispose = vi.fn();
                disposals.push(dispose);
                return { dispose };
            }),
        } as unknown as IEngineExplorerService;
        const service = FrameGraphExplorerServiceDefinition.factory(explorer)!;

        expect(FrameGraphExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
        expect(providers).toHaveLength(2);
        expect(providers.map((provider) => provider.order)).toEqual([400, 400]);
        const other = { _kind: "text-renderer" } as RenderingContext;
        expect(providers[0].predicate(scene)).toBe(true);
        expect(providers[0].predicate(standalone)).toBe(false);
        expect(providers[1].predicate(scene)).toBe(false);
        expect(providers[1].predicate(standalone)).toBe(true);
        expect(providers.every((provider) => !provider.predicate(other))).toBe(true);

        for (const [index, context, graph] of [
            [0, scene, getFrameGraph(scene)],
            [1, standalone, standalone.frameGraph],
        ] as const) {
            const provider = providers[index];
            const nodes = provider.getNodes(context);
            expect(nodes).toHaveLength(1);
            expect(nodes[0].id).toBe("frame-graphs");
            expect(nodes[0].getDisplayInfo().name).toBe("Frame Graphs");
            const tree = BuildExplorerTree(nodes);
            const children = tree.nodes[0].children!;
            expect(children).toHaveLength(1);
            const child = children[0];
            expect(child.entity).toBe(graph);
            expect(child.getDisplayInfo().name).toBe("Frame Graph");
            expect(child.children).toEqual([]);
            expect(renderToStaticMarkup(createElement(child.icon!, { entity: graph }))).toBe(renderToStaticMarkup(<FrameRegular color={tokens.colorPaletteGreenForeground2} />));
            expect(provider.getSnapshot(context)).toEqual([graph]);
            expect(provider.getSnapshot(context)[0]).toBe(provider.getSnapshot(context)[0]);
            expect(BuildExplorerTree(provider.getNodes(context)).nodes[0].children![0].value).toBe(child.value);
        }
        service.dispose?.();
        expect(disposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    });
});

describe("Babylon Lite frame graph properties service", () => {
    it("contributes only Tasks for graph identities owned by registered, inspectable contexts", () => {
        const { engine, scene, standalone, contexts } = CreateContexts();
        const utility = createSceneContext(engine, { defaultRenderTask: false });
        contexts.push(utility);
        InspectorUtilityScenes.add(utility);
        const auxiliary = { _renderingContexts: [] } as unknown as SurfaceContext;
        const auxiliaryGraph = createFrameGraphContext(auxiliary);
        (auxiliary._renderingContexts as RenderingContext[]).push(auxiliaryGraph);
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine, auxiliary];
        const dispose = vi.fn();
        const addSectionContent = vi.fn<IPropertiesService["addSectionContent"]>().mockReturnValue({ dispose });
        const service = FrameGraphPropertiesServiceDefinition.factory({ addSectionContent } as unknown as IPropertiesService, { engine })!;
        expect(FrameGraphPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity, EngineContextIdentity]);
        expect(addSectionContent).toHaveBeenCalledOnce();
        const registration = addSectionContent.mock.calls[0][0];
        expect(registration.key).toBe("Frame Graph Properties");
        expect(registration.content.map((content) => content.section)).toEqual(["Tasks"]);
        expect(registration.predicate(getFrameGraph(scene))).toBe(true);
        expect(registration.predicate(standalone.frameGraph)).toBe(true);
        expect(registration.predicate(auxiliaryGraph.frameGraph)).toBe(true);
        expect(registration.predicate(getFrameGraph(utility))).toBe(false);
        for (const entity of [null, undefined, 1, "graph", {}, scene, { build: vi.fn(), execute: vi.fn(), dispose: vi.fn() }]) {
            expect(registration.predicate(entity)).toBe(false);
        }
        const graph = standalone.frameGraph;
        contexts.splice(contexts.indexOf(standalone), 1);
        expect(registration.predicate(graph)).toBe(false);
        contexts.splice(contexts.indexOf(scene), 1);
        expect(registration.predicate(getFrameGraph(scene))).toBe(false);
        service.dispose?.();
        expect(dispose).toHaveBeenCalledOnce();
    });
});

describe("Babylon Lite frame graph task properties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];
    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
        TaskCopies.clear();
    });

    function Render(content: ReactNode, watcher: IWatcherService): HTMLElement {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() =>
            root.render(
                <FluentProvider theme={webLightTheme}>
                    <WatcherContext.Provider value={watcher}>{content}</WatcherContext.Provider>
                </FluentProvider>
            )
        );
        return container;
    }

    it("renders ordered labels with absent and true gates ON and false OFF", () => {
        const { engine, standalone } = CreateContexts();
        const tasks = [CreateTask(engine, "a"), CreateTask(engine, "b", true), CreateTask(engine, "c", false)];
        TaskLists.set(standalone.frameGraph, tasks);
        const container = Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, CreateWatcher());
        expect(container.textContent).toBe("1. a2. b3. c");
        expect([...container.querySelectorAll<HTMLInputElement>("[role='switch']")].map((input) => input.checked)).toEqual([true, true, false]);
        expect([...container.querySelectorAll("[role='switch']")].map((input) => input.getAttribute("aria-label"))).toEqual(["1. a", "2. b", "3. c"]);
    });

    it("writes false then true through BoundProperty when executionEnabled was never set, and watches external writes", () => {
        const { engine, standalone } = CreateContexts();
        const task = CreateTask(engine, "a");
        TaskLists.set(standalone.frameGraph, [task]);
        expect(Object.hasOwn(task, "executionEnabled")).toBe(false);
        const watcher = CreateWatcher();
        const container = Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, watcher);
        const getSwitch = () => container.querySelector<HTMLInputElement>("[role='switch'][aria-label='1. a']")!;
        expect(getSwitch().disabled).toBe(false);
        act(() => {
            getSwitch().click();
            watcher.refresh();
        });
        expect(task.executionEnabled).toBe(false);
        expect(getSwitch().checked).toBe(false);
        act(() => {
            getSwitch().click();
            watcher.refresh();
        });
        expect(task.executionEnabled).toBe(true);
        expect(getSwitch().checked).toBe(true);
        act(() => {
            task.executionEnabled = false;
            watcher.refresh();
        });
        expect(getSwitch().checked).toBe(false);
    });

    it.each([true, false])("keeps the switch at %s when the runtime restores its gate before polling", (initialGate) => {
        const { engine, standalone } = CreateContexts();
        const task = CreateTask(engine, "a", initialGate);
        TaskLists.set(standalone.frameGraph, [task]);
        const watcher = CreateWatcher();
        const container = Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, watcher);
        const input = container.querySelector<HTMLInputElement>("[role='switch']")!;
        expect(input.checked).toBe(initialGate);
        act(() => {
            input.click();
            expect(task.executionEnabled).toBe(!initialGate);
            task.executionEnabled = initialGate;
            watcher.refresh();
        });
        expect(task.executionEnabled).toBe(initialGate);
        expect(input.checked).toBe(initialGate);
    });

    it("copies effective task gates through the public getter using the live task index", () => {
        const { engine, standalone } = CreateContexts();
        const tasks = [CreateTask(engine, "a"), CreateTask(engine, "b", false)];
        const [a, b] = tasks;
        TaskLists.set(standalone.frameGraph, tasks);
        Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, CreateWatcher());
        const copyA = TaskCopies.get("1. a")!;
        const copyB = TaskCopies.get("2. b")!;
        expect(copyA()).toBe('getFrameGraphTasks(globalThis.debugNode)[0].executionEnabled = true; // (getFrameGraphTasks from "@babylonjs/lite")');
        const command = copyB();
        expect(command).toBe('getFrameGraphTasks(globalThis.debugNode)[1].executionEnabled = false; // (getFrameGraphTasks from "@babylonjs/lite")');
        b.executionEnabled = true;
        expect(copyB()).toBe('getFrameGraphTasks(globalThis.debugNode)[1].executionEnabled = true; // (getFrameGraphTasks from "@babylonjs/lite")');
        const apply = new Function("globalThis", "getFrameGraphTasks", command);
        act(() => apply({ debugNode: standalone.frameGraph }, getFrameGraphTasks));
        expect(b.executionEnabled).toBe(false);
        expect(Object.hasOwn(standalone.frameGraph, "executionEnabled")).toBe(false);
        expect(a.executionEnabled).toBeUndefined();
        expect(Object.hasOwn(a, "executionEnabled")).toBe(false);
        tasks.splice(0, 1);
        expect(copyB()).toBe('getFrameGraphTasks(globalThis.debugNode)[0].executionEnabled = false; // (getFrameGraphTasks from "@babylonjs/lite")');
        tasks.length = 0;
        expect(copyB()).toBe("// Task is no longer in the selected frame graph.");
    });

    it("refreshes a live task list after push, splice and emptying without rebinding surviving task switches", () => {
        const { engine, standalone } = CreateContexts();
        const tasks = [CreateTask(engine, "a"), CreateTask(engine, "b", false)];
        TaskLists.set(standalone.frameGraph, tasks);
        const watcher = CreateWatcher();
        const container = Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, watcher);
        const survivingSwitch = container.querySelectorAll("[role='switch']")[1];
        act(() => {
            tasks.push(CreateTask(engine, "c", true));
            watcher.refresh();
        });
        expect(container.querySelectorAll("[role='switch']")).toHaveLength(3);
        act(() => {
            tasks.splice(0, 1);
            watcher.refresh();
        });
        expect(container.textContent).toBe("1. b2. c");
        expect(container.querySelector("[role='switch']")).toBe(survivingSwitch);
        expect((survivingSwitch as HTMLInputElement).checked).toBe(false);
        expect(survivingSwitch.getAttribute("aria-label")).toBe("1. b");
        act(() => {
            tasks.length = 0;
            watcher.refresh();
        });
        expect(container.querySelectorAll("[role='switch']")).toHaveLength(0);
        expect(container.textContent).toBe("");
    });

    it("renders no switches or placeholder for an empty graph", () => {
        const { standalone } = CreateContexts();
        const container = Render(<FrameGraphTaskProperties frameGraph={standalone.frameGraph} />, CreateWatcher());
        expect(container.querySelectorAll("[role='switch']")).toHaveLength(0);
        expect(container.textContent).toBe("");
    });
});
