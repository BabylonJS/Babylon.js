import { getRenderingContextKind, getRenderingContexts, type EngineContext, type RenderingContext, type SceneContext, type SurfaceContext } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { EngineRegular, GlobeRegular, PersonSquareRegular, TextFieldRegular, WindowRegular } from "@fluentui/react-icons";
import { createElement, type ComponentType, type FunctionComponent } from "react";

import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";

import { type ExplorerDisplayInfo, type ExplorerNodeDescription } from "../components/explorer/explorerModel";
import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";

import { CreateExplorerPaneRegistration } from "../services/panes/explorer/explorerPane";
import { CreateExplorerService, type IExplorerService, ExplorerServiceIdentity } from "../services/panes/explorer/explorerService";
import { type ISelectionService, SelectionServiceIdentity } from "../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "./engineContext";
import { CreateWatchedNameDisplayInfo } from "./explorerDisplayInfo";

/**
 * The unique identity symbol for the Babylon Lite engine explorer service.
 * @experimental
 */
export const EngineExplorerServiceIdentity = Symbol("EngineExplorer");

/**
 * Contributes child nodes beneath a compatible Babylon Lite rendering context.
 * @experimental
 */
export type RenderingContextNodeProvider<T extends RenderingContext> = Readonly<{
    /** Controls this provider's position relative to other providers. */
    order?: number;
    /** Returns whether this provider supports the rendering context. */
    predicate: (context: RenderingContext) => context is T;
    /** Gets the Explorer nodes contributed beneath the rendering context. */
    getNodes: (context: T) => readonly ExplorerNodeDescription[];
    /** Gets the object identities used to detect changes in the contributed nodes. */
    getSnapshot: (context: T) => readonly object[];
}>;

/**
 * Overrides presentation for a Babylon Lite rendering context node.
 * @experimental
 */
export type RenderingContextPresentation<T extends RenderingContext = RenderingContext> = Readonly<{
    /** Gets display information for the rendering context node. */
    getDisplayInfo?: () => ExplorerDisplayInfo;
    /** Overrides the icon rendered for the node. The icon receives the Rendering Context subtype matched by the provider. */
    icon?: ComponentType<{ entity: T }>;
}>;

/**
 * Contributes presentation for a compatible Babylon Lite rendering context.
 * @experimental
 */
export type RenderingContextPresentationProvider<T extends RenderingContext> = Readonly<{
    /** Returns whether this provider supports the rendering context. */
    predicate: (context: RenderingContext) => context is T;
    /** Gets partial presentation that overrides the built-in rendering context presentation. */
    getPresentation: (context: T) => RenderingContextPresentation<T>;
}>;

/**
 * Allows product-specific services to contribute hierarchy beneath Babylon Lite rendering contexts.
 * @experimental
 */
export interface IEngineExplorerService extends IService<typeof EngineExplorerServiceIdentity> {
    /**
     * Adds a provider that contributes child nodes beneath compatible rendering contexts.
     * @param provider The node provider to add.
     * @returns A disposable that removes the provider.
     */
    addRenderingContextNodeProvider<T extends RenderingContext>(provider: RenderingContextNodeProvider<T>): IDisposable;

    /**
     * Adds a provider that controls how compatible rendering context nodes are presented.
     * The last registered matching provider takes precedence.
     * @param provider The presentation provider to add.
     * @returns A disposable that removes the provider.
     */
    addRenderingContextPresentationProvider<T extends RenderingContext>(provider: RenderingContextPresentationProvider<T>): IDisposable;
}

type UntypedRenderingContextNodeProvider = RenderingContextNodeProvider<RenderingContext>;
type UntypedRenderingContextPresentationProvider = Readonly<{
    predicate: (context: RenderingContext) => boolean;
    getPresentation: (context: RenderingContext) => Partial<Pick<ExplorerNodeDescription, "getDisplayInfo" | "icon">>;
}>;

function UntypeRenderingContextNodeProvider<T extends RenderingContext>(provider: RenderingContextNodeProvider<T>): UntypedRenderingContextNodeProvider {
    return {
        order: provider.order,
        predicate: (context): context is RenderingContext => provider.predicate(context),
        getNodes: (context) => (provider.predicate(context) ? provider.getNodes(context) : []),
        getSnapshot: (context) => (provider.predicate(context) ? provider.getSnapshot(context) : []),
    };
}

// The predicate validates the subtype before the presentation is requested. Wrapping the icon then
// preserves its typed context without casting it to the generic Explorer icon contract, which accepts any object.
function UntypeRenderingContextPresentationProvider<T extends RenderingContext>(provider: RenderingContextPresentationProvider<T>): UntypedRenderingContextPresentationProvider {
    return {
        predicate: provider.predicate,
        getPresentation: (context) => {
            if (!provider.predicate(context)) {
                return {};
            }

            const presentation = provider.getPresentation(context);
            const iconComponent = presentation.icon;
            return {
                ...(presentation.getDisplayInfo ? { getDisplayInfo: presentation.getDisplayInfo } : {}),
                ...("icon" in presentation ? { icon: iconComponent ? () => createElement(iconComponent, { entity: context }) : undefined } : {}),
            };
        },
    };
}

const RenderingContextDisplayNames = new Map<string, string>([
    ["scene", "Scene"],
    ["frame-graph-context", "Frame Graph"],
    ["effect-renderer", "Effect Renderer"],
    ["sprite-renderer", "Sprite Renderer"],
    ["text-renderer", "Text Renderer"],
]);

const EngineIcon: FunctionComponent = () => <EngineRegular />;
const SceneIcon: FunctionComponent = () => <GlobeRegular />;
const SpriteRendererIcon: FunctionComponent = () => <PersonSquareRegular color={tokens.colorPalettePeachForeground2} />;
const TextRendererIcon: FunctionComponent = () => <TextFieldRegular />;
const SurfaceIcon: FunctionComponent = () => <WindowRegular />;

const NodeIds = new WeakMap<object, number>();
let NextNodeId = 0;

function GetNodeId(context: object): string {
    let id = NodeIds.get(context);
    if (id === undefined) {
        id = NextNodeId++;
        NodeIds.set(context, id);
    }
    return id.toString();
}

type ProviderTopologySnapshot = Readonly<{
    provider: UntypedRenderingContextNodeProvider;
    entities: readonly object[];
}>;

type RenderingContextTopologySnapshot = Readonly<{
    context: RenderingContext;
    providers: readonly ProviderTopologySnapshot[];
}>;

type SurfaceTopologySnapshot = Readonly<{
    readonly surface: SurfaceContext;
    readonly renderingContexts: readonly RenderingContextTopologySnapshot[];
}>;

type TopologySnapshot = readonly SurfaceTopologySnapshot[];

function AreTopologySnapshotsEqual(left: TopologySnapshot, right: TopologySnapshot): boolean {
    if (left.length !== right.length) {
        return false;
    }

    for (let surfaceIndex = 0; surfaceIndex < left.length; surfaceIndex++) {
        const leftSurface = left[surfaceIndex];
        const rightSurface = right[surfaceIndex];
        if (leftSurface.surface !== rightSurface.surface || leftSurface.renderingContexts.length !== rightSurface.renderingContexts.length) {
            return false;
        }

        for (let contextIndex = 0; contextIndex < leftSurface.renderingContexts.length; contextIndex++) {
            const leftContext = leftSurface.renderingContexts[contextIndex];
            const rightContext = rightSurface.renderingContexts[contextIndex];
            if (leftContext.context !== rightContext.context || leftContext.providers.length !== rightContext.providers.length) {
                return false;
            }

            for (let providerIndex = 0; providerIndex < leftContext.providers.length; providerIndex++) {
                const leftProvider = leftContext.providers[providerIndex];
                const rightProvider = rightContext.providers[providerIndex];
                if (leftProvider.provider !== rightProvider.provider || leftProvider.entities.length !== rightProvider.entities.length) {
                    return false;
                }

                for (let entityIndex = 0; entityIndex < leftProvider.entities.length; entityIndex++) {
                    if (leftProvider.entities[entityIndex] !== rightProvider.entities[entityIndex]) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

function GetBuiltInRenderingContextDisplayName(context: RenderingContext): string {
    const kind = getRenderingContextKind(context);
    if (kind === "scene") {
        return (context as SceneContext).name || "Scene";
    }
    return RenderingContextDisplayNames.get(kind) ?? kind;
}

function GetBuiltInRenderingContextIcon(context: RenderingContext): FunctionComponent | undefined {
    switch (getRenderingContextKind(context)) {
        case "scene":
            return SceneIcon;
        case "sprite-renderer":
            return SpriteRendererIcon;
        case "text-renderer":
            return TextRendererIcon;
        default:
            return undefined;
    }
}

function GetApplicableProviders(context: RenderingContext, providers: readonly UntypedRenderingContextNodeProvider[]): readonly UntypedRenderingContextNodeProvider[] {
    return providers.filter((provider) => provider.predicate(context)).sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

// Presentation resolution is runtime behavior rather than type adaptation: start with a generic fallback,
// apply the known built-in presentation, then let the last registered matching provider partially override it.
function GetRenderingContextPresentation(
    context: RenderingContext,
    watcherService: IWatcherService,
    providers: readonly UntypedRenderingContextPresentationProvider[]
): Required<Pick<ExplorerNodeDescription, "getDisplayInfo">> & Pick<ExplorerNodeDescription, "icon"> {
    const isScene = getRenderingContextKind(context) === "scene";
    const fallbackPresentation = {
        getDisplayInfo: () => ({ name: getRenderingContextKind(context) }),
        icon: undefined,
    };
    const builtInPresentation = {
        getDisplayInfo: () =>
            isScene
                ? CreateWatchedNameDisplayInfo(watcherService, context as SceneContext, () => GetBuiltInRenderingContextDisplayName(context))
                : { name: GetBuiltInRenderingContextDisplayName(context) },
        icon: GetBuiltInRenderingContextIcon(context),
    };
    let provider: UntypedRenderingContextPresentationProvider | undefined;
    for (let index = providers.length - 1; index >= 0; index--) {
        if (providers[index].predicate(context)) {
            provider = providers[index];
            break;
        }
    }

    return {
        ...fallbackPresentation,
        ...builtInPresentation,
        ...provider?.getPresentation(context),
    };
}

function CreateRenderingContextNode(
    context: RenderingContext,
    watcherService: IWatcherService,
    presentationProviders: readonly UntypedRenderingContextPresentationProvider[]
): ExplorerNodeDescription {
    const presentation = GetRenderingContextPresentation(context, watcherService, presentationProviders);
    return {
        id: `rendering-context-${GetNodeId(context)}`,
        kind: "item",
        entity: context,
        ...presentation,
    };
}

function CreateSurfaceNode(
    engine: EngineContext,
    surface: SurfaceContext,
    watcherService: IWatcherService,
    presentationProviders: readonly UntypedRenderingContextPresentationProvider[]
): ExplorerNodeDescription {
    return {
        id: `surface-${GetNodeId(surface)}`,
        kind: "item",
        entity: surface,
        icon: SurfaceIcon,
        getDisplayInfo: () => ({ name: `Surface ${engine.surfaces.indexOf(surface) + 1}` }),
        getChildren: () => getRenderingContexts(surface).map((context) => CreateRenderingContextNode(context, watcherService, presentationProviders)),
    };
}

function CreateEngineNodes(
    engine: EngineContext,
    watcherService: IWatcherService,
    presentationProviders: readonly UntypedRenderingContextPresentationProvider[]
): readonly ExplorerNodeDescription[] {
    // The engine itself is the primary surface, and it is already represented by the Explorer root node,
    // so its rendering contexts are contributed as children of the root.
    const nodes: ExplorerNodeDescription[] = getRenderingContexts(engine).map((context) => CreateRenderingContextNode(context, watcherService, presentationProviders));

    if (engine.surfaces.length > 1) {
        nodes.push({
            id: "auxiliary-surfaces",
            kind: "group",
            getDisplayInfo: () => ({ name: "Auxiliary Surfaces" }),
            getChildren: () => engine.surfaces.slice(1).map((surface) => CreateSurfaceNode(engine, surface, watcherService, presentationProviders)),
        });
    }

    return nodes;
}

/**
 * Owns the "Explorer" pane of the Babylon Lite Inspector, which displays the engine hierarchy
 * (rendering contexts of the primary surface, and any auxiliary surfaces and their contexts).
 */
export const EngineExplorerServiceDefinition: ServiceDefinition<[IEngineExplorerService, IExplorerService], [IEngineContext, IShellService, ISelectionService, IWatcherService]> = {
    friendlyName: "Babylon Lite Engine Explorer",
    produces: [EngineExplorerServiceIdentity, ExplorerServiceIdentity],
    consumes: [EngineContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, selectionService, watcherService) => {
        const engine = engineContext.engine;
        const nodeProviders = new ObservableCollection<UntypedRenderingContextNodeProvider>();
        const presentationProviders = new ObservableCollection<UntypedRenderingContextPresentationProvider>();
        const explorerService = CreateExplorerService();
        const isRenderingContext = (entity: object): entity is RenderingContext =>
            engine.surfaces.some((surface) => getRenderingContexts(surface).includes(entity as RenderingContext));
        const getTopologySnapshot = (): TopologySnapshot =>
            engine.surfaces.map((surface) => ({
                surface,
                renderingContexts: getRenderingContexts(surface).map((context) => ({
                    context,
                    providers: GetApplicableProviders(context, nodeProviders.items).map((provider) => ({
                        provider,
                        entities: [...provider.getSnapshot(context)],
                    })),
                })),
            }));

        const onNodesChanged = new Observable<void>();
        const paneRegistration = CreateExplorerPaneRegistration(shellService, selectionService, {
            key: "Explorer",
            title: "Explorer",
            getRoot: () => engine,
            rootLabel: "Engine",
            rootIcon: EngineIcon,
            getNodes: () => CreateEngineNodes(engine, watcherService, presentationProviders.items),
            onNodesChanged,
            nodeProviders: explorerService.nodeProviders,
            itemCommandProviders: explorerService.itemCommandProviders,
            groupCommandProviders: explorerService.groupCommandProviders,
        });

        const topologyWatcher = watcherService.watchValue(getTopologySnapshot, () => onNodesChanged.notifyObservers(), AreTopologySnapshotsEqual);
        const nodeProvidersObserver = nodeProviders.observable.add(() => onNodesChanged.notifyObservers());
        const presentationProvidersObserver = presentationProviders.observable.add(() => onNodesChanged.notifyObservers());

        // Lite keeps its rendering-context vocabulary while adapting hierarchy and commands onto the generic
        // entity-attached service. Structural groups such as "Auxiliary Surfaces" remain adapter-owned Explorer groups.
        return {
            addRenderingContextNodeProvider: (provider) => {
                const untypedProvider = UntypeRenderingContextNodeProvider(provider);
                const topologyRegistration = nodeProviders.add(untypedProvider);
                const explorerRegistration = explorerService.addNodeProvider({
                    order: provider.order,
                    predicate: (parent): parent is RenderingContext =>
                        typeof parent === "object" && parent !== null && isRenderingContext(parent) && untypedProvider.predicate(parent),
                    getNodes: untypedProvider.getNodes,
                });
                let isRegistered = true;
                return {
                    dispose: () => {
                        if (!isRegistered) {
                            return;
                        }

                        isRegistered = false;
                        topologyRegistration.dispose();
                        explorerRegistration.dispose();
                    },
                };
            },
            addRenderingContextPresentationProvider: (provider) => presentationProviders.add(UntypeRenderingContextPresentationProvider(provider)),
            addNodeProvider: explorerService.addNodeProvider,
            addItemCommand: explorerService.addItemCommand,
            addGroupCommand: explorerService.addGroupCommand,
            dispose: () => {
                nodeProvidersObserver.remove();
                presentationProvidersObserver.remove();
                topologyWatcher.dispose();
                paneRegistration.dispose();
                nodeProviders.dispose();
                presentationProviders.dispose();
                explorerService.dispose();
                onNodesChanged.clear();
            },
        };
    },
};
