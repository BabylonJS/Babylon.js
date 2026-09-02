import { type IDisposable, type IReadonlyObservable, type Nullable } from "core/index";

import { type ComponentType, type FunctionComponent, useCallback, useEffect, useState } from "react";

import { type ExplorerCommandProvider, type ExplorerNodeDescription } from "../../../components/explorer/explorerModel";
import { Explorer } from "../../../components/explorer/explorer";
import { type ISelectionService } from "../../selectionService";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

import { CubeTreeRegular } from "@fluentui/react-icons";

import { useObservableState, useOrderedObservableCollection } from "shared-ui-components/modularTool/hooks/observableHooks";
import { ObservableCollection } from "shared-ui-components/modularTool/misc/observableCollection";

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
     * Gets the root object of the hierarchy (e.g. a Scene for the Full Inspector, or an engine for
     * the Babylon Lite Inspector). It is displayed as the root node, and nothing is rendered while
     * it is null. This is re-evaluated whenever `onRootChanged` notifies.
     */
    getRoot: () => Nullable<object>;

    /**
     * The name displayed for the root node (e.g. "Scene" or "Engine").
     */
    rootLabel: string;

    /**
     * An optional icon component to render for the root node.
     */
    rootIcon?: ComponentType<{ entity: object }>;

    /**
     * An optional observable that notifies when the object returned by `getRoot` changes. Products
     * with a fixed root (such as the Babylon Lite Inspector, which inspects a single engine for the
     * lifetime of the pane) can omit it.
     */
    onRootChanged?: IReadonlyObservable<unknown>;

    /**
     * Enumerates the top level nodes of the hierarchy (excluding the root node, which represents the
     * object being inspected and is added automatically). This is re-invoked whenever the Explorer
     * rebuilds its tree, so it should always reflect the current state.
     */
    getNodes: () => readonly ExplorerNodeDescription[];

    /**
     * An optional observable that notifies when the set of nodes returned by `getNodes` changes
     * (e.g. a new top level node was added). Changes within an already described node are
     * communicated through that node's own change observables instead.
     */
    onNodesChanged?: IReadonlyObservable<void>;

    /**
     * Optional command providers for nodes that represent an entity.
     */
    itemCommandProviders?: ObservableCollection<ExplorerCommandProvider<object>>;

    /**
     * Optional command providers for group nodes (the command context is the group's display name).
     */
    groupCommandProviders?: ObservableCollection<ExplorerCommandProvider<string, "contextMenu">>;
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

type ExplorerPaneProps = Readonly<{
    selectionService: ISelectionService;
    getRoot: () => Nullable<object>;
    rootLabel: string;
    rootIcon?: ComponentType<{ entity: object }>;
    onRootChanged?: IReadonlyObservable<unknown>;
    getNodes: () => readonly ExplorerNodeDescription[];
    onNodesChanged?: IReadonlyObservable<void>;
    itemCommandProviders: ObservableCollection<ExplorerCommandProvider<object>>;
    groupCommandProviders: ObservableCollection<ExplorerCommandProvider<string, "contextMenu">>;
}>;

const ExplorerPane: FunctionComponent<ExplorerPaneProps> = (props) => {
    const { selectionService, getRoot, rootLabel, rootIcon, onRootChanged, getNodes, onNodesChanged, itemCommandProviders, groupCommandProviders } = props;

    const itemCommands = useOrderedObservableCollection(itemCommandProviders);
    const groupCommands = useOrderedObservableCollection(groupCommandProviders);
    const nodesVersion = useNodesVersion(onNodesChanged);
    const root = useObservableState(
        useCallback(() => getRoot(), [getRoot]),
        onRootChanged
    );
    const entity = useObservableState(() => selectionService.selectedEntity, selectionService.onSelectedEntityChanged);

    const getExplorerNodes = useCallback(() => {
        if (!root) {
            return [];
        }

        // The root node represents the object being inspected (e.g. a Scene or an Engine). It is a sibling
        // (not an ancestor) of the top level nodes, which keeps indentation flat and shallow.
        const rootNode: ExplorerNodeDescription = {
            id: "root",
            kind: "root",
            entity: root,
            icon: rootIcon,
            getDisplayInfo: () => ({ name: rootLabel }),
        };

        return [rootNode, ...getNodes()];
    }, [rootLabel, rootIcon, getNodes, nodesVersion, root]);

    return (
        <>
            {root && (
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
    const { key, title, getRoot, rootLabel, rootIcon, onRootChanged, getNodes, onNodesChanged } = options;

    // These are created once per pane so the identities passed to the hooks below are stable.
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
                getRoot={getRoot}
                rootLabel={rootLabel}
                rootIcon={rootIcon}
                onRootChanged={onRootChanged}
                getNodes={getNodes}
                onNodesChanged={onNodesChanged}
                itemCommandProviders={itemCommandProviders}
                groupCommandProviders={groupCommandProviders}
            />
        ),
    });
}
