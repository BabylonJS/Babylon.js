/**
 * @vitest-environment jsdom
 */

import {
    createAnimationManager,
    createAnimationGroups,
    createPropertyAnimationClip,
    createPropertyAnimationGroup,
    createTransformNode,
    pauseAnimation,
    stopAnimation,
    updateAnimationManager,
    type AnimationGroup,
    type EngineContext,
    type SceneContext,
    type SurfaceContext,
    type TargetedAnimation,
} from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.hoisted(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    vi.stubGlobal(
        "ResizeObserver",
        class {
            public observe = vi.fn();
            public unobserve = vi.fn();
            public disconnect = vi.fn();
        }
    );
});

import { Observable } from "core/Misc/observable";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { SettingsStoreContext } from "shared-ui-components/modularTool/contexts/settingsContext";
import { SettingsStore } from "shared-ui-components/modularTool/services/settingsStore";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";
import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { type IPropertiesService, PropertiesServiceDefinition } from "../../src/services/panes/properties/propertiesService";
import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IWatcherService } from "../../src/services/watcherService";
import {
    GetAnimationFrameRate,
    GetEntityAnimationGroups,
    GetSceneAnimationGroups,
    GetTargetedAnimationDisplayName,
    IsAnimationGroup,
    IsTargetedAnimation,
    SeekAnimationFrame,
} from "../../src/lite/animationUtils";
import {
    AnimationGroupControlProperties,
    AnimationGroupInfoProperties,
    EntityAnimationProperties,
    TargetedAnimationProperties,
} from "../../src/lite/components/properties/animationProperties";
import { type IEngineContext } from "../../src/lite/engineContext";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { AnimationPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/animationPropertiesService";
import { AnimationGroupExplorerServiceDefinition } from "../../src/lite/services/panes/scene/animationGroupExplorerService";

function CreateGroup(targetedAnimations: readonly TargetedAnimation[] = [], name = "Walk"): AnimationGroup {
    return { name, duration: 2, frameRate: 30, isPlaying: false, currentTime: 0, speedRatio: 1, loopAnimation: true, weight: 1, targetedAnimations };
}

function CreateEngine(groups: AnimationGroup[] = []) {
    const scene = { _kind: "scene", animationGroups: groups } as unknown as SceneContext;
    const engine = { surfaces: [], _renderingContexts: [scene] } as unknown as EngineContext;
    (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
    return { engine, scene };
}

function CreateSelection(): ISelectionService {
    return { selectedEntity: null, onSelectedEntityChanged: new Observable<void>() };
}

function CreateWatcher() {
    const checks = new Set<() => void>();
    const disposals: ReturnType<typeof vi.fn>[] = [];
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
        const dispose = vi.fn(() => checks.delete(check));
        disposals.push(dispose);
        return { dispose };
    }
    const watcher: IWatcherService = {
        watchProperty<T extends object>(target: T, key: keyof T, onChanged: (value: unknown) => void) {
            return WatchValue(() => target[key], onChanged);
        },
        watchValue: WatchValue,
        refresh: () => [...checks].forEach((check) => check()),
    };
    return { watcher, checks, disposals };
}

describe("Babylon Lite animation discovery", () => {
    it("discovers only registered scene groups, deduplicating groups shared across surfaces", () => {
        const target = { name: "Mesh" };
        const animation: TargetedAnimation = { target, path: "translation" };
        const group = CreateGroup([animation]);
        const { engine } = CreateEngine([group]);
        const otherGroup = CreateGroup([], "Other");
        const otherScene = { _kind: "scene", animationGroups: [group, otherGroup] } as unknown as SceneContext;
        const surface = { _renderingContexts: [otherScene, { _kind: "text-renderer" }] } as unknown as SurfaceContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine, surface];

        expect(GetSceneAnimationGroups(engine)).toEqual([group, otherGroup]);
        expect(IsAnimationGroup(engine, group)).toBe(true);
        expect(IsAnimationGroup(engine, CreateGroup())).toBe(false);
        expect(IsAnimationGroup(engine, null)).toBe(false);
        expect(IsTargetedAnimation(engine, animation)).toBe(true);
        expect(IsTargetedAnimation(engine, { target, path: "translation" })).toBe(false);
        expect(IsTargetedAnimation(engine, undefined)).toBe(false);
    });

    it("uses direct target and transform identities instead of matching names", () => {
        const node = createTransformNode("Box");
        const sameName = createTransformNode("Box");
        const direct = CreateGroup([{ target: node, path: "translation" }]);
        const transform = CreateGroup([{ target: node.position, path: "x" }]);
        const namedOnly = CreateGroup([{ targetName: "Box", nodeIndex: 0, path: "rotation" }]);
        const { engine } = CreateEngine([direct, transform, namedOnly]);

        expect(GetEntityAnimationGroups(engine, node)).toEqual([direct, transform]);
        expect(GetEntityAnimationGroups(engine, node.position)).toEqual([transform]);
        expect(GetEntityAnimationGroups(engine, sameName)).toEqual([]);
        expect(GetTargetedAnimationDisplayName(namedOnly.targetedAnimations[0])).toBe("Box: rotation");
        expect(GetTargetedAnimationDisplayName({ nodeIndex: 0, path: "weights" })).toBe("Node 0: weights");
        expect(GetTargetedAnimationDisplayName({ path: "pointer" })).toBe("Target: pointer");
        expect(GetTargetedAnimationDisplayName({ target: node, path: "translation" })).toBe("Box: translation");
        expect(GetTargetedAnimationDisplayName({ target: node, targetName: "Imported Box", path: "translation" })).toBe("Box: translation");
    });

    it("seeks a real property animation in authored frame units and preserves playback state", () => {
        const manager = createAnimationManager();
        const target = { value: 0 };
        const clip = createPropertyAnimationClip(
            "Manual",
            [
                {
                    path: "value",
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 60, value: 10 },
                    ],
                },
            ],
            { frameRate: 30 }
        );
        const group = createPropertyAnimationGroup(manager, target, clip);
        const { engine } = CreateEngine([group]);

        SeekAnimationFrame(engine, group, 30);
        expect(group.currentTime).toBe(1);
        expect(target.value).toBe(5);
        expect(group.isPlaying).toBe(true);

        pauseAnimation(group);
        SeekAnimationFrame(engine, group, 15);
        expect(group.currentTime).toBe(0.5);
        expect(target.value).toBe(2.5);
        expect(group.isPlaying).toBe(false);

        stopAnimation(group);
        SeekAnimationFrame(engine, group, 45);
        expect(target.value).toBe(7.5);
        expect(group.isPlaying).toBe(false);
        expect(GetAnimationFrameRate({ ...group, frameRate: undefined })).toBe(60);
    });

    it("seeks glTF node animations without loading native Babylon.js animation classes", () => {
        const node = createTransformNode("Animated Node");
        const [group] = createAnimationGroups({
            clips: [
                {
                    name: "glTF Translation",
                    duration: 2,
                    frameRate: 30,
                    channels: [{ samplerIdx: 0, nodeIdx: 0, path: 0 }],
                    samplers: [{ input: new Float32Array([0, 2]), output: new Float32Array([0, 0, 0, 2, 4, 6]), interpolation: 0 }],
                },
            ],
            nodes: [{ parentIdx: -1, tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, rw: 1, sx: 1, sy: 1, sz: 1 }],
            skeletons: [],
            morphBindings: [],
            nodeTargets: [node],
            nodeNames: ["Animated Node"],
            excludedNodeIndices: new Set<number>(),
        });
        const { engine } = CreateEngine([group]);
        pauseAnimation(group);
        SeekAnimationFrame(engine, group, 30);
        expect(group.currentTime).toBe(1);
        expect(group.isPlaying).toBe(false);
        expect([node.position.x, node.position.y, node.position.z]).toEqual([1, 2, 3]);
        expect(GetTargetedAnimationDisplayName(group.targetedAnimations[0])).toBe("Animated Node: translation");
    });
});

describe("Babylon Lite animation services", () => {
    it("contributes stable group and target nodes, watches names, and disposes commands and registrations", () => {
        const animation = { target: { name: "Box" }, targetName: "Box", path: "translation" };
        const group = CreateGroup([animation]);
        const { engine, scene } = CreateEngine([group]);
        const { watcher, checks, disposals } = CreateWatcher();
        const explorer = CreateExplorerService();
        const selection = CreateSelection();
        const registrationDispose = vi.fn();
        let provider: Pick<RenderingContextNodeProvider<SceneContext>, "getNodes" | "getSnapshot"> | undefined;
        const engineExplorer: Pick<IEngineExplorerService, "addRenderingContextNodeProvider"> = {
            addRenderingContextNodeProvider: (registration) => {
                if (!registration.predicate(scene)) {
                    throw new Error("Expected an animation provider for the scene.");
                }
                provider = {
                    getNodes: () => registration.getNodes(scene),
                    getSnapshot: () => registration.getSnapshot(scene),
                };
                return { dispose: registrationDispose };
            },
        };
        const service = AnimationGroupExplorerServiceDefinition.factory(engineExplorer as IEngineExplorerService, explorer, watcher, { engine }, selection)!;
        expect(provider).toBeDefined();
        const nodes = provider!.getNodes(scene);
        const tree = BuildExplorerTree(nodes);
        const groupNode = tree.nodes[0].children![0];
        const targetNode = groupNode.children![0];
        expect(groupNode.entity).toBe(group);
        expect(targetNode.entity).toBe(animation);
        expect(provider!.getSnapshot(scene)).toEqual([group, animation]);
        expect(groupNode.value).toBeTruthy();
        expect(BuildExplorerTree(provider!.getNodes(scene)).nodes[0].children![0].value).toBe(groupNode.value);

        const targetDisplay = targetNode.getDisplayInfo();
        const changed = vi.fn();
        targetDisplay.onChange!.add(changed);
        animation.target.name = "Renamed";
        watcher.refresh();
        expect(targetDisplay.name).toBe("Renamed: translation");
        expect(changed).toHaveBeenCalledOnce();

        const commandProvider = explorer.itemCommandProviders.items[0];
        expect(commandProvider.predicate(group)).toBe(true);
        expect(commandProvider.predicate(animation)).toBe(false);
        const command = commandProvider.getCommand(group);
        if (!command || command.type !== "toggle") {
            throw new Error("Expected the animation play/pause toggle.");
        }
        const commandChanged = vi.fn();
        command.onChange!.add(commandChanged);
        command.isEnabled = true;
        expect(group.isPlaying).toBe(true);
        expect(command.displayName).toBe("Pause Animation");
        command.isEnabled = false;
        expect(group.isPlaying).toBe(false);
        expect(commandChanged).toHaveBeenCalledTimes(2);
        group.isPlaying = true;
        watcher.refresh();
        expect(commandChanged).toHaveBeenCalledTimes(3);
        expect(command.hotKey).toEqual({ keyCode: "Space", control: true });

        targetDisplay.dispose?.();
        command.dispose?.();
        service.dispose?.();
        expect(registrationDispose).toHaveBeenCalledOnce();
        expect(explorer.itemCommandProviders.items).toEqual([]);
        expect(checks.size).toBe(0);
        expect(disposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
        explorer.dispose();
    });

    it("clears removed animation selections without clearing groups still reachable in another scene", () => {
        const animation = { path: "translation" };
        const group = CreateGroup([animation]);
        const { engine, scene } = CreateEngine([group]);
        const otherScene = { _kind: "scene", animationGroups: [group] } as unknown as SceneContext;
        (engine as unknown as { _renderingContexts: SceneContext[] })._renderingContexts.push(otherScene);
        const { watcher } = CreateWatcher();
        const selection = CreateSelection();
        const explorer = CreateExplorerService();
        const engineExplorer = { addRenderingContextNodeProvider: () => ({ dispose: vi.fn() }) } as unknown as IEngineExplorerService;
        const service = AnimationGroupExplorerServiceDefinition.factory(engineExplorer, explorer, watcher, { engine }, selection)!;

        selection.selectedEntity = animation;
        scene.animationGroups.length = 0;
        watcher.refresh();
        expect(selection.selectedEntity).toBe(animation);
        otherScene.animationGroups.length = 0;
        watcher.refresh();
        expect(selection.selectedEntity).toBeNull();

        scene.animationGroups.push(group);
        watcher.refresh();
        selection.selectedEntity = engine;
        scene.animationGroups.length = 0;
        watcher.refresh();
        expect(selection.selectedEntity).toBe(engine);
        service.dispose?.();
        explorer.dispose();
    });

    it("registers group, target, and entity properties only for the intended Lite entities", () => {
        const node = createTransformNode("Box");
        const target = { path: "translation", target: node };
        const group = CreateGroup([target]);
        const { engine } = CreateEngine([group]);
        type Content = Parameters<IPropertiesService["addSectionContent"]>[0];
        const registrations: Content[] = [];
        const disposals: ReturnType<typeof vi.fn>[] = [];
        const properties = {
            addSectionContent: (content: Content) => {
                registrations.push(content);
                const dispose = vi.fn();
                disposals.push(dispose);
                return { dispose };
            },
        } as unknown as IPropertiesService;
        const service = AnimationPropertiesServiceDefinition.factory(properties, { engine } as IEngineContext, CreateSelection())!;
        expect(registrations.map((content) => content.key)).toEqual([
            "Babylon Lite Animation Group Properties",
            "Babylon Lite Targeted Animation Properties",
            "Babylon Lite Entity Animation Properties",
        ]);
        expect(registrations[0].predicate(group)).toBe(true);
        expect(registrations[0].predicate(CreateGroup())).toBe(false);
        expect(registrations[0].content.map((content) => content.section)).toEqual(["Control", "Info", "Metadata"]);
        expect(registrations[1].predicate(target)).toBe(true);
        expect(registrations[1].predicate({ ...target })).toBe(false);
        expect(registrations[2].predicate(node)).toBe(true);
        expect(registrations[2].predicate(group)).toBe(false);
        expect(registrations[2].predicate(target)).toBe(false);
        expect(registrations[2].predicate({ value: 0 })).toBe(true);
        expect(registrations[2].predicate(null)).toBe(false);
        service.dispose?.();
        expect(disposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true);
    });
});

describe("Babylon Lite animation properties", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];
    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
        vi.restoreAllMocks();
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
    function ClickButton(container: HTMLElement, name: string): void {
        const button = [...container.querySelectorAll("button")].find((candidate) => candidate.textContent === name);
        expect(button).toBeDefined();
        act(() => button!.click());
    }

    it("discovers a non-node target's first group through the properties service without reselection", async () => {
        const target = { value: 0 };
        const group = CreateGroup([{ target, path: "value" }], "Late Animation");
        const { engine, scene } = CreateEngine();
        const selection = CreateSelection();
        selection.selectedEntity = target;
        const addSidePane = vi.fn<IShellService["addSidePane"]>().mockReturnValue({ dispose: vi.fn() });
        const shell: IShellService = {
            addSidePane,
            addToolbarItem: vi.fn(() => ({ dispose: vi.fn() })),
            addCentralContent: vi.fn(() => ({ dispose: vi.fn() })),
            leftSidePaneContainer: null,
            rightSidePaneContainer: null,
            sidePanes: [],
        };
        const properties = PropertiesServiceDefinition.factory(shell, selection);
        const service = AnimationPropertiesServiceDefinition.factory(properties, { engine }, selection)!;
        const PropertiesContent = addSidePane.mock.calls[0][0].content;
        const { watcher, checks } = CreateWatcher();
        const settingsStore = new SettingsStore("LiteAnimationRelationshipRegression");
        const container = Render(
            <SettingsStoreContext.Provider value={settingsStore}>
                <PropertiesContent />
            </SettingsStoreContext.Provider>,
            watcher
        );
        await act(async () => {
            await vi.dynamicImportSettled();
        });
        expect(container.textContent).toContain("No Animations");

        act(() => {
            scene.animationGroups.push(group);
            watcher.refresh();
        });
        expect(container.textContent).toContain("Late Animation");
        expect(selection.selectedEntity).toBe(target);

        act(() => {
            scene.animationGroups.length = 0;
            watcher.refresh();
        });
        expect(container.textContent).toContain("No Animations");
        expect(container.textContent).not.toContain("Late Animation");
        expect(selection.selectedEntity).toBe(target);
        act(() => roots.pop()!.unmount());
        expect(checks.size).toBe(0);
        service.dispose?.();
        properties.dispose?.();
    });

    it("supports playback, completion updates, and stopping with manual refresh", () => {
        const manager = createAnimationManager();
        const target = { value: 0 };
        const group = createPropertyAnimationGroup(
            manager,
            target,
            createPropertyAnimationClip("Manual", [
                {
                    path: "value",
                    keys: [
                        { frame: 0, value: 0 },
                        { frame: 60, value: 10 },
                    ],
                },
            ]),
            { loop: false, fromFrame: 10 }
        );
        const { engine } = CreateEngine([group]);
        const { watcher, checks } = CreateWatcher();
        const container = Render(<AnimationGroupControlProperties engine={engine} group={group} />, watcher);

        ClickButton(container, "Pause");
        expect(group.isPlaying).toBe(false);
        ClickButton(container, "Play");
        expect(group.isPlaying).toBe(true);
        act(() => updateAnimationManager(manager, 1000));
        expect(group.isPlaying).toBe(false);
        act(() => watcher.refresh());
        expect([...container.querySelectorAll("button")].some((button) => button.textContent === "Play")).toBe(true);
        ClickButton(container, "Stop");
        expect(group.currentTime).toBe(10 / 60);
        act(() => roots.pop()!.unmount());
        expect(checks.size).toBe(0);
    });

    it("shows clip frame units and disables scrubbing for zero-duration groups", () => {
        const group = CreateGroup([{ nodeIndex: 0, path: "weights" }]);
        const { engine } = CreateEngine([group]);
        const { watcher } = CreateWatcher();
        const container = Render(
            <>
                <AnimationGroupInfoProperties group={group} />
                <AnimationGroupControlProperties engine={engine} group={{ ...group, duration: 0 }} />
            </>,
            watcher
        );
        expect(container.textContent?.replace(/\s/g, "")).toContain("FrameRate30");
        expect(container.textContent?.replace(/\s/g, "")).toContain("EndFrame60");
        expect([...container.querySelectorAll<HTMLInputElement>("input[type='range']")].some((input) => input.disabled)).toBe(true);
    });

    it("links runtime targets while preserving named-only targets and their path and index", () => {
        const target = createTransformNode("Box");
        const selection = CreateSelection();
        const { watcher } = CreateWatcher();
        const container = Render(
            <>
                <TargetedAnimationProperties animation={{ target, path: "translation" }} selectionService={selection} />
                <TargetedAnimationProperties animation={{ targetName: "Bone", nodeIndex: 0, path: "rotation" }} selectionService={selection} />
            </>,
            watcher
        );
        const link = [...container.querySelectorAll<HTMLElement>("a,button")].find((element) => element.textContent === "Box: translation");
        expect(link).toBeDefined();
        act(() => link!.click());
        expect(selection.selectedEntity).toBe(target);
        expect(container.textContent).toContain("Bone: rotation");
        expect(container.textContent?.replace(/\s/g, "")).toContain("NodeIndex0");
        expect([...container.querySelectorAll<HTMLElement>("a,button")].filter((element) => element.textContent === "Bone: rotation")).toHaveLength(0);
    });

    it("updates an entity's group links when topology changes and watches renamed groups", () => {
        const node = createTransformNode("Box");
        const group = CreateGroup([{ target: node, path: "translation" }]);
        const { engine, scene } = CreateEngine();
        const { watcher } = CreateWatcher();
        const selection = CreateSelection();
        const container = Render(<EntityAnimationProperties engine={engine} entity={node} selectionService={selection} />, watcher);
        expect(container.textContent).toContain("No Animations");
        act(() => {
            scene.animationGroups.push(group);
            watcher.refresh();
        });
        expect(container.textContent).toContain("Walk");
        ClickButton(container, "Walk");
        expect(selection.selectedEntity).toBe(group);
        act(() => {
            Object.assign(group, { name: "Renamed" });
            watcher.refresh();
        });
        expect(container.textContent).toContain("Renamed");
        act(() => {
            scene.animationGroups.length = 0;
            watcher.refresh();
        });
        expect(container.textContent).toContain("No Animations");
    });

    it("keeps multiple group links independently selectable with stable, distinct accordion IDs", () => {
        const node = createTransformNode("Box");
        const first = CreateGroup([{ target: node, path: "translation" }], "First");
        const second = CreateGroup([{ target: node, path: "rotation" }], "Second");
        const { engine, scene } = CreateEngine([first, second]);
        const { watcher } = CreateWatcher();
        const selection = CreateSelection();
        const warnings = vi.spyOn(console, "warn");
        const container = Render(
            <Accordion uniqueId="lite-animation-links" enablePinnedItems>
                <AccordionSection title="Animation" collapseByDefault={false}>
                    <EntityAnimationProperties engine={engine} entity={node} selectionService={selection} />
                </AccordionSection>
            </Accordion>,
            watcher
        );
        ClickButton(container, "First");
        expect(selection.selectedEntity).toBe(first);
        ClickButton(container, "Second");
        expect(selection.selectedEntity).toBe(second);
        act(() => {
            Object.assign(first, { name: "Renamed First" });
            scene.animationGroups.reverse();
            watcher.refresh();
        });
        ClickButton(container, "Renamed First");
        expect(selection.selectedEntity).toBe(first);
        expect(warnings.mock.calls.filter(([message]) => typeof message === "string" && message.startsWith("Accordion:"))).toEqual([]);
    });
});

describe("Lite animation import boundaries", () => {
    it("does not load native animation implementations or the curve editor", () => {
        const inspectorRoot = resolve(import.meta.dirname, "../../src");
        const paths = [
            "lite/animationUtils.ts",
            "lite/components/properties/animationProperties.tsx",
            "lite/services/panes/properties/animationPropertiesService.tsx",
            "lite/services/panes/scene/animationGroupExplorerService.tsx",
        ];
        for (const path of paths) {
            const source = readFileSync(resolve(inspectorRoot, path), "utf8");
            expect(source).not.toMatch(/core\/Animations|curveEditor|@babylonjs\/lite\/(?:lib|src|dist)\//);
            expect(source).not.toMatch(/\._(?:ctrl|startTime|stopped|animationManager|gltfMixer|propertyMixer)/);
        }
        const entry = readFileSync(resolve(inspectorRoot, "lite/inspector.tsx"), "utf8");
        expect(entry).toContain("AnimationGroupExplorerServiceDefinition,");
        expect(entry).toContain("AnimationPropertiesServiceDefinition,");
    });
});
