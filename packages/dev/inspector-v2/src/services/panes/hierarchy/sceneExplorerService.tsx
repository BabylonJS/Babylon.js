// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable, Scene } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";
import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IShellService } from "../../shellService";

import { FlatTree, FlatTreeItem, makeStyles, Text, tokens, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";
import { CubeTreeRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useObservableState, useOrderedObservableCollection } from "../../../hooks/observableHooks";
import { TraverseGraph } from "../../../misc/graphUtils";
import { SceneContextIdentity } from "../../sceneContext";
import { ShellServiceIdentity } from "../../shellService";
import { ObservableCollection } from "../../../misc/observableCollection";
// import type { ObservableCollection } from "../../../misc/observableCollection";

type EntityBase = {
    uniqueId: number;
};

export type SceneExplorerEntityDescriptor<T extends EntityBase> = {
    name: string;
    order: number;
    getRootEntities: (scene: Scene) => readonly T[];
    getChildren?: (entity: T) => readonly T[];
    entityAddedObservable: Observable<T>;
    entityRemovedObservable: Observable<T>;
    component: ComponentType<{ entity: T }>;
    icon?: ComponentType<{ entity: T }>;
};

export const SceneExplorerServiceIdentity = Symbol("SceneExplorer");
export interface ISceneExplorerService extends IService<typeof SceneExplorerServiceIdentity> {
    addEntityType<T extends EntityBase>(entityDescriptor: Readonly<SceneExplorerEntityDescriptor<T>>): IDisposable;
    readonly selectedEntity: Nullable<unknown>;
    readonly onSelectedEntityChanged: Observable<void>;
}

type TreeItemData =
    | {
          type: "group";
          groupName: string;
          hasChildren: boolean;
      }
    | {
          type: "entity";
          entity: EntityBase;
          depth: number;
          hasChildren: boolean;
          component: ComponentType<{ entity: EntityBase }>;
          icon?: ComponentType<{ entity: EntityBase }>;
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
        const entityDescriptorCollection = new ObservableCollection<Readonly<SceneExplorerEntityDescriptor<EntityBase>>>();

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

            const entityDescriptors = useOrderedObservableCollection(entityDescriptorCollection);

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

                const itemAddedObservers = entityDescriptorCollection.items.map((descriptor) => descriptor.entityAddedObservable.add(onSceneItemAdded));
                const itemRemovedObservers = entityDescriptorCollection.items.map((descriptor) => descriptor.entityRemovedObservable.add(onSceneItemRemoved));

                return () => {
                    for (const observer of itemAddedObservers) {
                        observer.remove();
                    }
                    for (const observer of itemRemovedObservers) {
                        observer.remove();
                    }
                };
            }, [entityDescriptorCollection, openItems]);

            const visibleItems2 = useMemo(() => {
                const visibleItems: TreeItemData[] = [];

                for (const descriptor of entityDescriptors) {
                    visibleItems.push({
                        type: "group",
                        groupName: descriptor.name,
                        hasChildren: descriptor.getRootEntities(scene).length > 0,
                    });

                    if (openItems.has(descriptor.name)) {
                        let depth = 0;
                        TraverseGraph(
                            descriptor.getRootEntities(scene),
                            (entity) => {
                                if (openItems.has(entity.uniqueId) && descriptor.getChildren) {
                                    return descriptor.getChildren(entity);
                                }
                                return null;
                            },
                            (entity) => {
                                depth++;
                                visibleItems.push({
                                    type: "entity",
                                    entity,
                                    depth,
                                    hasChildren: !!descriptor.getChildren && descriptor.getChildren(entity).length > 0,
                                    component: descriptor.component,
                                    icon: descriptor.icon,
                                });
                            },
                            () => {
                                depth--;
                            }
                        );
                    }
                }

                return visibleItems;
            }, [scene, sceneVersion, entityDescriptors, openItems, itemsFilter]);

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
                        <VirtualizerScrollView numItems={visibleItems2.length} itemSize={32} container={{ style: { overflowX: "hidden" } }}>
                            {(index: number) => {
                                const item = visibleItems2[index];

                                if (item.type === "group") {
                                    return (
                                        <FlatTreeItem
                                            key={item.groupName}
                                            value={item.groupName}
                                            itemType={item.hasChildren ? "branch" : "leaf"}
                                            aria-level={0}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                        >
                                            <TreeItemLayout>
                                                <Text weight="bold">{item.groupName}</Text>
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                } else {
                                    return (
                                        <FlatTreeItem
                                            key={item.entity.uniqueId}
                                            value={item.entity.uniqueId}
                                            itemType={item.hasChildren ? "branch" : "leaf"}
                                            aria-level={item.depth}
                                            aria-setsize={1}
                                            aria-posinset={1}
                                            //onClick
                                        >
                                            <TreeItemLayout iconBefore={item.type === "entity" && item.icon ? <item.icon entity={item.entity} /> : null}>
                                                <item.component entity={item.entity} />
                                            </TreeItemLayout>
                                        </FlatTreeItem>
                                    );
                                }
                            }}
                        </VirtualizerScrollView>
                    </FlatTree>
                </div>
            );
        };

        const registration = shellService.addToLeftPane({
            key: "Scene Explorer",
            title: "Scene Explorer",
            icon: CubeTreeRegular,
            suppressTeachingMoment: true,
            content: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                return <>{scene && <SceneExplorer scene={scene} />}</>;
            },
        });

        return {
            addEntityType: (entityDescriptor) => entityDescriptorCollection.add(entityDescriptor as unknown as Readonly<SceneExplorerEntityDescriptor<EntityBase>>),
            get selectedEntity() {
                return selectedEntityState;
            },
            onSelectedEntityChanged: selectedEntityObservable,
            dispose: () => registration.dispose(),
        };
    },
};
