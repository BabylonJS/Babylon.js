// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IShellService } from "../../shellService";

import { Button, FlatTree, FlatTreeItem, makeStyles, tokens, Tooltip, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";
import { CubeTreeRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useObservableCollection, useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { TraverseGraph } from "../../../misc/graphUtils";
import { ObservableCollection } from "../../../misc/observableCollection";
import { SceneContextIdentity } from "../../sceneContext";
import { ShellServiceIdentity } from "../../shellService";
// import type { ObservableCollection } from "../../../misc/observableCollection";

type EntityBase = Readonly<{
    uniqueId: number;
}>;

export type SceneExplorerChildEnumerator<ParentT, ChildT extends EntityBase> = Readonly<{
    order: number;
    predicate: (entity: unknown) => entity is ParentT;
    getChildren: (scene: Scene, entity: ParentT) => readonly ChildT[];
    component: ComponentType<{ entity: ChildT }>;
    icon?: ComponentType<{ entity: ChildT }>;
    isSelectable?: boolean | ((entity: ChildT) => boolean);
}>;

export type SceneExplorerEntityObservableProvider<T extends EntityBase> = (scene: Scene) => Readonly<{
    entityAddedObservable: Observable<T>;
    entityRemovedObservable: Observable<T>;
}>;

export type SceneExplorerEntityCommandProvider<T extends EntityBase> = Readonly<{
    order: number;
    predicate: (entity: unknown) => entity is T;
    command: (scene: Scene, entity: T) => void;
    displayName: string;
    icon: ComponentType<{ entity: T }>;
}>;

export const SceneExplorerServiceIdentity = Symbol("SceneExplorer");
export interface ISceneExplorerService extends IService<typeof SceneExplorerServiceIdentity> {
    addChildEnumerator<ParentT, ChildT extends EntityBase>(childEnumerator: SceneExplorerChildEnumerator<ParentT, ChildT>): IDisposable;
    addEntityObservableProvider<T extends EntityBase>(provider: SceneExplorerEntityObservableProvider<T>): IDisposable;
    addEntityCommand<T extends EntityBase>(provider: SceneExplorerEntityCommandProvider<T>): IDisposable;
    readonly selectedEntity: Nullable<unknown>;
    readonly onSelectedEntityChanged: Observable<void>;
}

type TreeItemData = {
    entity: EntityBase;
    depth: number;
    parent: Nullable<TreeItemData>;
    hasChildren: boolean;
    component: ComponentType<{ entity: EntityBase }>;
    icon?: ComponentType<{ entity: EntityBase }>;
    isSelectable: boolean;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    tree: {
        margin: tokens.spacingHorizontalXS,
        rowGap: 0,
        overflow: "hidden",
        flex: 1,
    },
});

export const SceneExplorerServiceDefinition: ServiceDefinition<[ISceneExplorerService], [ISceneContext, IShellService]> = {
    friendlyName: "Scene Explorer",
    produces: [SceneExplorerServiceIdentity],
    consumes: [SceneContextIdentity, ShellServiceIdentity],
    factory: (sceneContext, shellService) => {
        const childEnumeratorCollection = new ObservableCollection<SceneExplorerChildEnumerator<unknown, EntityBase>>();
        const entityObservableProviderCollection = new ObservableCollection<SceneExplorerEntityObservableProvider<EntityBase>>();
        const entityCommandProviderCollection = new ObservableCollection<SceneExplorerEntityCommandProvider<EntityBase>>();

        let selectedEntityState: Nullable<unknown> = null;
        const selectedEntityObservable = new Observable<void>();
        const setSelectedItem = (item: Nullable<unknown>) => {
            if (item !== selectedEntityState) {
                selectedEntityState = item;
                selectedEntityObservable.notifyObservers();
            }
        };

        // eslint-disable-next-line @typescript-eslint/naming-convention, jsdoc/require-jsdoc
        const SceneExplorer: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
            const classes = useStyles();

            const childEnumerators = useOrderedObservableCollection(childEnumeratorCollection);
            const entityObservableProviders = useObservableCollection(entityObservableProviderCollection);
            const entityCommandProviders = useOrderedObservableCollection(entityCommandProviderCollection);

            const selectedItem = useObservableState(() => selectedEntityState, selectedEntityObservable);
            const [openItems, setOpenItems] = useState(new Set<TreeItemValue>());

            const [sceneVersion, setSceneVersion] = useState(0);

            // For the filter, we should maybe to the traversal but use onAfterNode so that if the filter matches, we make sure to include the full parent chain.
            // Then just reverse the array of nodes before returning it.
            const [itemsFilter /*, setItemsFilter*/] = useState("");

            useEffect(() => {
                setSceneVersion((version) => version + 1);
            }, [scene]);

            useEffect(() => {
                const onSceneItemAdded = () => {
                    setSceneVersion((version) => version + 1);
                };

                const onSceneItemRemoved = (item: EntityBase) => {
                    setSceneVersion((version) => version + 1);

                    if (openItems.delete(item.uniqueId)) {
                        setOpenItems(new Set(openItems));
                    }

                    if (item === selectedItem) {
                        setSelectedItem(null);
                    }
                };

                const itemAddedObservers = entityObservableProviders.map((provider) => provider(scene).entityAddedObservable.add(onSceneItemAdded));
                const itemRemovedObservers = entityObservableProviders.map((provider) => provider(scene).entityRemovedObservable.add(onSceneItemRemoved));

                return () => {
                    for (const observer of itemAddedObservers) {
                        observer.remove();
                    }
                    for (const observer of itemRemovedObservers) {
                        observer.remove();
                    }
                };
            }, [entityObservableProviders, openItems]);

            const visibleItems = useMemo(() => {
                const visibleItems: TreeItemData[] = [];

                let depth = 0;
                TraverseGraph(
                    [scene],
                    function* (item: Scene | TreeItemData) {
                        const isScene = item instanceof Scene;
                        for (const enumerator of childEnumerators) {
                            if (enumerator.predicate(isScene ? item : item.entity)) {
                                for (const child of enumerator.getChildren(scene, isScene ? item : item.entity)) {
                                    if (!isScene) {
                                        item.hasChildren = true;
                                    }

                                    if (isScene || openItems.has(item.entity.uniqueId)) {
                                        yield {
                                            entity: child,
                                            parent: isScene ? null : item,
                                            depth,
                                            hasChildren: false,
                                            component: enumerator.component,
                                            icon: enumerator.icon,
                                            isSelectable: (enumerator.isSelectable === true || (enumerator.isSelectable !== false && enumerator.isSelectable?.(child))) ?? false,
                                        };
                                    }
                                }
                            }
                        }
                    },
                    (item) => {
                        depth++;
                        if (!(item instanceof Scene)) {
                            visibleItems.push(item);
                        }
                    },
                    () => {
                        depth--;
                    }
                );

                return visibleItems;
            }, [scene, sceneVersion, childEnumerators, openItems, itemsFilter]);

            const onOpenChange = useCallback(
                (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
                    // This makes it so we only consider a click on the chevron to be expanding/collapsing an item, not clicking anywhere on the item.
                    if (data.type !== "Click" && data.type !== "Enter") {
                        setOpenItems(data.openItems);
                    }
                },
                [setOpenItems]
            );

            return (
                <div className={classes.rootDiv}>
                    <FlatTree className={classes.tree} openItems={openItems} onOpenChange={onOpenChange} aria-label="Scene Explorer Tree">
                        <VirtualizerScrollView numItems={visibleItems.length} itemSize={32} container={{ style: { overflowX: "hidden" } }}>
                            {(index: number) => {
                                const item = visibleItems[index];

                                const onItemClick = () => {
                                    setSelectedItem(item.entity);
                                };

                                const commandProviders = entityCommandProviders.filter((provider) => provider.predicate(item.entity));

                                return (
                                    <FlatTreeItem
                                        key={item.entity.uniqueId}
                                        value={item.entity.uniqueId}
                                        parentValue={item.parent?.entity.uniqueId ?? undefined}
                                        itemType={item.hasChildren ? "branch" : "leaf"}
                                        aria-level={item.depth}
                                        aria-setsize={1}
                                        aria-posinset={1}
                                        onClick={item.isSelectable ? onItemClick : undefined}
                                    >
                                        <TreeItemLayout
                                            style={item.entity === selectedItem ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                            iconBefore={item.icon ? <item.icon entity={item.entity} /> : null}
                                            actions={commandProviders.map((provider) => (
                                                <Tooltip key={provider.displayName} content={provider.displayName} relationship="label">
                                                    <Button
                                                        icon={<provider.icon entity={item.entity} />}
                                                        appearance="subtle"
                                                        onClick={() => provider.command(scene, item.entity)}
                                                    />
                                                </Tooltip>
                                            ))}
                                        >
                                            <item.component entity={item.entity} />
                                        </TreeItemLayout>
                                    </FlatTreeItem>
                                );
                            }}
                        </VirtualizerScrollView>
                    </FlatTree>
                </div>
            );
        };

        const registration = shellService.addSidePane({
            key: "Scene Explorer",
            title: "Scene Explorer",
            icon: CubeTreeRegular,
            horizontalLocation: "left",
            suppressTeachingMoment: true,
            content: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                return <>{scene && <SceneExplorer scene={scene} />}</>;
            },
        });

        return {
            addChildEnumerator: (childEnumerator) => childEnumeratorCollection.add(childEnumerator as SceneExplorerChildEnumerator<unknown, EntityBase>),
            addEntityObservableProvider: (provider) => entityObservableProviderCollection.add(provider as SceneExplorerEntityObservableProvider<EntityBase>),
            addEntityCommand: (provider) => entityCommandProviderCollection.add(provider as SceneExplorerEntityCommandProvider<EntityBase>),
            get selectedEntity() {
                return selectedEntityState;
            },
            onSelectedEntityChanged: selectedEntityObservable,
            dispose: () => registration.dispose(),
        };
    },
};
