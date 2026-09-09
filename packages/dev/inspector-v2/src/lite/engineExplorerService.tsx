import { getRenderingContextKind, getRenderingContexts, type EngineContext, type RenderingContext, type SceneContext, type SurfaceContext } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { EngineRegular, GlobeRegular, PersonSquareRegular, TextFieldRegular, WindowRegular } from "@fluentui/react-icons";
import { type FunctionComponent } from "react";

import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";

import { type ExplorerNodeDescription } from "../components/explorer/explorerModel";
import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { CreateExplorerPaneRegistration } from "../services/panes/explorer/explorerPane";
import { type ISelectionService, SelectionServiceIdentity } from "../services/selectionService";
import { type IWatcherService, WatcherServiceIdentity } from "../services/watcherService";
import { type IEngineContext, EngineContextIdentity } from "./engineContext";
import { CreateWatchedNameDisplayInfo } from "./explorerDisplayInfo";

/**
 * The unique identity symbol for the Babylon Lite engine explorer service.
 */
export const EngineExplorerServiceIdentity = Symbol("EngineExplorer");

/**
 * Contributes child nodes beneath a compatible Babylon Lite rendering context.
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
 * Allows product-specific services to contribute hierarchy beneath Babylon Lite rendering contexts.
 */
export interface IEngineExplorerService extends IService<typeof EngineExplorerServiceIdentity> {
    addRenderingContextNodeProvider<T extends RenderingContext>(provider: RenderingContextNodeProvider<T>): IDisposable;
}

type UntypedRenderingContextNodeProvider = RenderingContextNodeProvider<RenderingContext>;

function UntypeRenderingContextNodeProvider<T extends RenderingContext>(provider: RenderingContextNodeProvider<T>): UntypedRenderingContextNodeProvider {
    return {
        order: provider.order,
        predicate: (context): context is RenderingContext => provider.predicate(context),
        getNodes: (context) => (provider.predicate(context) ? provider.getNodes(context) : []),
        getSnapshot: (context) => (provider.predicate(context) ? provider.getSnapshot(context) : []),
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

function GetRenderingContextDisplayName(context: RenderingContext): string {
    const kind = getRenderingContextKind(context);
    if (kind === "scene") {
        return (context as SceneContext).name || "Scene";
    }
    return RenderingContextDisplayNames.get(kind) ?? kind;
}

function GetRenderingContextIcon(context: RenderingContext): FunctionComponent | undefined {
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

function CreateRenderingContextNode(
    context: RenderingContext,
    providers: readonly UntypedRenderingContextNodeProvider[],
    watcherService: IWatcherService
): ExplorerNodeDescription {
    const isScene = getRenderingContextKind(context) === "scene";
    return {
        id: `rendering-context-${GetNodeId(context)}`,
        kind: "item",
        entity: context,
        icon: GetRenderingContextIcon(context),
        getDisplayInfo: () =>
            isScene
                ? CreateWatchedNameDisplayInfo(watcherService, context as SceneContext, () => GetRenderingContextDisplayName(context))
                : { name: GetRenderingContextDisplayName(context) },
        getChildren: () => GetApplicableProviders(context, providers).flatMap((provider) => provider.getNodes(context)),
    };
}

function CreateSurfaceNode(
    engine: EngineContext,
    surface: SurfaceContext,
    providers: readonly UntypedRenderingContextNodeProvider[],
    watcherService: IWatcherService
): ExplorerNodeDescription {
    return {
        id: `surface-${GetNodeId(surface)}`,
        kind: "item",
        entity: surface,
        icon: SurfaceIcon,
        getDisplayInfo: () => ({ name: `Surface ${engine.surfaces.indexOf(surface) + 1}` }),
        getChildren: () => getRenderingContexts(surface).map((context) => CreateRenderingContextNode(context, providers, watcherService)),
    };
}

function CreateEngineNodes(engine: EngineContext, providers: readonly UntypedRenderingContextNodeProvider[], watcherService: IWatcherService): readonly ExplorerNodeDescription[] {
    // The engine itself is the primary surface, and it is already represented by the Explorer root node,
    // so its rendering contexts are contributed as children of the root.
    const nodes: ExplorerNodeDescription[] = getRenderingContexts(engine).map((context) => CreateRenderingContextNode(context, providers, watcherService));

    if (engine.surfaces.length > 1) {
        nodes.push({
            id: "auxiliary-surfaces",
            kind: "group",
            getDisplayInfo: () => ({ name: "Auxiliary Surfaces" }),
            getChildren: () => engine.surfaces.slice(1).map((surface) => CreateSurfaceNode(engine, surface, providers, watcherService)),
        });
    }

    return nodes;
}

/**
 * Owns the "Explorer" pane of the Babylon Lite Inspector, which displays the engine hierarchy
 * (rendering contexts of the primary surface, and any auxiliary surfaces and their contexts).
 */
export const EngineExplorerServiceDefinition: ServiceDefinition<[IEngineExplorerService], [IEngineContext, IShellService, ISelectionService, IWatcherService]> = {
    friendlyName: "Babylon Lite Engine Explorer",
    produces: [EngineExplorerServiceIdentity],
    consumes: [EngineContextIdentity, ShellServiceIdentity, SelectionServiceIdentity, WatcherServiceIdentity],
    factory: (engineContext, shellService, selectionService, watcherService) => {
        const engine = engineContext.engine;
        const nodeProviders = new ObservableCollection<UntypedRenderingContextNodeProvider>();
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
            getNodes: () => CreateEngineNodes(engine, nodeProviders.items, watcherService),
            onNodesChanged,
        });

        const topologyWatcher = watcherService.watchValue(getTopologySnapshot, () => onNodesChanged.notifyObservers(), AreTopologySnapshotsEqual);
        const providersObserver = nodeProviders.observable.add(() => onNodesChanged.notifyObservers());

        return {
            addRenderingContextNodeProvider: (provider) => nodeProviders.add(UntypeRenderingContextNodeProvider(provider)),
            dispose: () => {
                providersObserver.remove();
                topologyWatcher.dispose();
                paneRegistration.dispose();
                onNodesChanged.clear();
            },
        };
    },
};
