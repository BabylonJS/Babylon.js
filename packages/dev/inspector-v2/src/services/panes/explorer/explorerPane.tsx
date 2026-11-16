import { type IDisposable, type IReadonlyObservable } from "core/index";

import { type ComponentType, type FunctionComponent, useCallback, useEffect, useState } from "react";

import { type ExplorerCommandProvider, type ExplorerNodeDescription } from "../../../components/explorer/explorerModel";
import { Explorer } from "../../../components/explorer/explorer";
import { GetExplorerNodeChildren, type ExplorerNodeProvider } from "./explorerService";
import { type ISelectionService } from "../../selectionService";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

import { CubeTreeRegular } from "@fluentui/react-icons";

import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type IReadonlyObservableCollection, ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";

/**
 * Describes an Explorer side pane, including the services it needs and the hierarchy it displays.
 *
 * This is intentionally not a service: products (such as the Full/BJS Inspector's Scene Explorer or the
 * Babylon Lite engine explorer) own their pane directly and use this to share the common pane plumbing.
 * @internal
 */
export type ExplorerPaneOptions = Readonly<{
    /**
     * The unique key of the side pane.
     */
    key: string;

    /**
     * The title displayed on the side pane.
     */
    title: string;

    /**
     * Gets the root nodes of the hierarchy. Each root represents an inspected object and may
     * contribute its own top-level nodes.
     */
    getRoots: () => readonly ExplorerPaneRoot[];

    /**
     * Notifies when the roots returned by `getRoots` change.
     */
    onRootsChanged?: IReadonlyObservable<unknown>;

    /**
     * An optional observable that notifies when the nodes returned beneath any root change.
     * Changes within an already described node are communicated through that node's own change observables.
     */
    onNodesChanged?: IReadonlyObservable<void>;

    /**
     * Optional providers that contribute nodes beneath compatible entity-backed nodes.
     */
    nodeProviders?: IReadonlyObservableCollection<ExplorerNodeProvider<object>>;

    /**
     * Optional command providers for nodes that represent an entity.
     */
    itemCommandProviders?: IReadonlyObservableCollection<ExplorerCommandProvider<object>>;

    /**
     * Optional command providers for group nodes (the command context is the group's display name).
     */
    groupCommandProviders?: IReadonlyObservableCollection<ExplorerCommandProvider<string, "contextMenu">>;
}>;

/**
 * Describes one root in an Explorer hierarchy.
 * @internal
 */
export type ExplorerPaneRoot = Readonly<{
    /**
     * An identifier that is stable across rebuilds and unique among the roots in the pane.
     */
    id: string;
    /**
     * The object represented by this root.
     */
    entity: object;
    /**
     * The name displayed for the root node.
     */
    label: string;
    /**
     * An optional icon component to render for the root node.
     */
    icon?: ComponentType<{ entity: object }>;
    /**
     * Enumerates the top-level nodes beneath this root.
     */
    getNodes: () => readonly ExplorerNodeDescription[];
}>;

// Rebuilds the tree when the owner reports that its set of top level nodes changed.
function useNodesVersion(onNodesChanged: IReadonlyObservable<void> | undefined): number {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const observer = onNodesChanged?.add(() => setVersion((version) => version + 1));

        return () => {
            observer?.remove();
        };
    }, [onNodesChanged]);

    return version;
}

function useNodeProvidersVersion(providers: IReadonlyObservableCollection<ExplorerNodeProvider<object>>): number {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let providerObservers = providers.items.map((provider) => provider.onChanged?.add(() => setVersion((version) => version + 1)));
        const collectionObserver = providers.observable.add(() => {
            providerObservers.forEach((observer) => observer?.remove());
            providerObservers = providers.items.map((provider) => provider.onChanged?.add(() => setVersion((version) => version + 1)));
        });

        return () => {
            collectionObserver.remove();
            providerObservers.forEach((observer) => observer?.remove());
        };
    }, [providers]);

    return version;
}

type ExplorerPaneProps = Readonly<{
    selectionService: ISelectionService;
    getRoots: () => readonly ExplorerPaneRoot[];
    onRootsChanged?: IReadonlyObservable<unknown>;
    onNodesChanged?: IReadonlyObservable<void>;
    nodeProviders: IReadonlyObservableCollection<ExplorerNodeProvider<object>>;
    itemCommandProviders: IReadonlyObservableCollection<ExplorerCommandProvider<object>>;
    groupCommandProviders: IReadonlyObservableCollection<ExplorerCommandProvider<string, "contextMenu">>;
}>;

const ExplorerPane: FunctionComponent<ExplorerPaneProps> = (props) => {
    const { selectionService, getRoots, onRootsChanged, onNodesChanged, nodeProviders, itemCommandProviders, groupCommandProviders } = props;

    const currentNodeProviders = useObservableCollection(nodeProviders);
    const itemCommands = useOrderedObservableCollection(itemCommandProviders);
    const groupCommands = useOrderedObservableCollection(groupCommandProviders);
    const nodesVersion = useNodesVersion(onNodesChanged);
    const nodeProvidersVersion = useNodeProvidersVersion(nodeProviders);
    const roots = useObservableState(
        useCallback(() => getRoots(), [getRoots]),
        onRootsChanged
    );
    const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);

    const getExplorerNodes = useCallback(() => {
        return roots.map((root) => ({
            id: `root-${root.id}`,
            kind: "root" as const,
            entity: root.entity,
            icon: root.icon,
            getDisplayInfo: () => ({ name: root.label }),
            getChildren: () => GetExplorerNodeChildren(root.entity, root.getNodes(), currentNodeProviders),
        }));
    }, [roots, nodesVersion, nodeProvidersVersion, currentNodeProviders]);

    return (
        <>
            {roots.length > 0 && (
                <Explorer
                    getNodes={getExplorerNodes}
                    itemCommandProviders={itemCommands}
                    groupCommandProviders={groupCommands}
                    selectedEntity={entity}
                    setSelectedEntity={(entity) => (selectionService.selectedEntity = entity)}
                />
            )}
        </>
    );
};

/**
 * Registers an Explorer side pane that enables browsing a hierarchy and executing commands on its entities.
 * @param shellService The shell service the pane is added to.
 * @param selectionService The selection service used to read and update the selected entity.
 * @param options Options describing the pane, its root object, and the hierarchy it displays.
 * @returns A disposable that removes the pane.
 * @internal
 */
export function CreateExplorerPaneRegistration(shellService: IShellService, selectionService: ISelectionService, options: ExplorerPaneOptions): IDisposable {
    const { key, title, getRoots, onRootsChanged, onNodesChanged } = options;

    // These are created once per pane so the identities passed to the hooks below are stable.
    const nodeProviders = options.nodeProviders ?? new ObservableCollection<ExplorerNodeProvider<object>>();
    const itemCommandProviders = options.itemCommandProviders ?? new ObservableCollection<ExplorerCommandProvider<object>>();
    const groupCommandProviders = options.groupCommandProviders ?? new ObservableCollection<ExplorerCommandProvider<string, "contextMenu">>();

    return shellService.addSidePane({
        key,
        title,
        icon: CubeTreeRegular,
        horizontalLocation: "left",
        verticalLocation: "top",
        teachingMoment: false,
        keepMounted: true,
        content: () => (
            <ExplorerPane
                selectionService={selectionService}
                getRoots={getRoots}
                onRootsChanged={onRootsChanged}
                onNodesChanged={onNodesChanged}
                nodeProviders={nodeProviders}
                itemCommandProviders={itemCommandProviders}
                groupCommandProviders={groupCommandProviders}
            />
        ),
    });
}
