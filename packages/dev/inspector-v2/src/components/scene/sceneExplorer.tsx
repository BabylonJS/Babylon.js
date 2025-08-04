import type { AbstractMesh, IDisposable, IReadonlyObservable, Nullable, Scene } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { ScrollToInterface } from "@fluentui/react-components/unstable";
import type { ComponentType, FunctionComponent } from "react";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { Body1, Body1Strong, Button, FlatTree, FlatTreeItem, makeStyles, SearchBox, tokens, Tooltip, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";
import { FilterRegular, MoviesAndTvRegular } from "@fluentui/react-icons";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useObservableState } from "../../hooks/observableHooks";
import { TraverseGraph } from "../../misc/graphUtils";

export type EntityBase = Readonly<{
    uniqueId: number;
}>;

export type EntityDisplayInfo = Readonly<
    {
        /**
         * The name of the entity to display in the Scene Explorer tree.
         */
        name: string;

        /**
         * An observable that notifies when the display info (such as the name) changes.
         */
        onChange?: IReadonlyObservable<void>;
    } & Partial<IDisposable>
>;

export type SceneExplorerSection<T extends EntityBase> = Readonly<{
    /**
     * The display name of the section (e.g. "Nodes", "Materials", etc.).
     */
    displayName: string;

    /**
     * An optional order for the section, relative to other sections.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A predicate function that determines if the entity belongs to this section.
     */
    predicate: (entity: unknown) => entity is T;

    /**
     * A function that returns the root entities for this section.
     */
    getRootEntities: () => readonly T[];

    /**
     * An optional function that returns the children of a given entity.
     */
    getEntityChildren?: (entity: T) => readonly T[];

    /**
     * An optional function that returns the parent of a given entity.
     */
    getEntityParent?: (entity: T) => Nullable<T>;

    /**
     * Gets the display information for a given entity.
     * This is ideally "live" display info (e.g. updates to the display info are taken into account and communicated via the observable).
     * This means in many cases the display info will need to be disposed when it is no longer needed so observable registrations can be removed.
     */
    getEntityDisplayInfo: (entity: T) => EntityDisplayInfo;

    /**
     * An optional icon component to render for the entity.
     */
    entityIcon?: ComponentType<{ entity: T }>;

    /**
     * A function that returns an array of observables for when entities are added to the scene.
     */
    getEntityAddedObservables: () => readonly IReadonlyObservable<T>[];

    /**
     * A function that returns an array of observables for when entities are removed from the scene.
     */
    getEntityRemovedObservables: () => readonly IReadonlyObservable<T>[];

    /**
     * A function that returns an array of observables for when entities are moved (e.g. re-parented) within the scene.
     */
    getEntityMovedObservables?: () => readonly IReadonlyObservable<T>[];
}>;

type EntityCommandBase<T extends EntityBase> = Readonly<{
    /**
     * An optional order for the section, relative to other commands.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A predicate function that determines if the command is applicable to the given entity.
     */
    predicate: (entity: unknown) => entity is T;

    /**
     * The display name of the command (e.g. "Delete", "Rename", etc.).
     */
    displayName: string;

    /**
     * An icon component to render for the command.
     */
    icon: ComponentType<{ entity: T }>;
}>;

type ActionCommand<T extends EntityBase> = EntityCommandBase<T> &
    Readonly<{
        type: "action";
        /**
         * The function that executes the command on the given entity.
         */
        execute: (scene: Scene, entity: T) => void;
    }>;

type ToggleCommand<T extends EntityBase> = EntityCommandBase<T> &
    Readonly<{
        type: "toggle";
        /**
         * A boolean indicating if the command is enabled.
         */
        isEnabled: (scene: Scene, entity: T) => boolean;

        /**
         * The function that sets the enabled state of the command on the given entity.
         */
        setEnabled: (scene: Scene, entity: T, enabled: boolean) => void;

        /**
         * An optional icon component to render when the command is disabled.
         */
        disabledIcon?: ComponentType<{ entity: T }>;
    }>;

export type SceneExplorerEntityCommand<T extends EntityBase> = ActionCommand<T> | ToggleCommand<T>;

type SceneTreeItemData = { type: "scene"; scene: Scene };

type SectionTreeItemData = {
    type: "section";
    sectionName: string;
    hasChildren: boolean;
};

type EntityTreeItemData = {
    type: "entity";
    entity: EntityBase;
    depth: number;
    parent: SectionTreeItemData | EntityTreeItemData;
    hasChildren: boolean;
    icon?: ComponentType<{ entity: EntityBase }>;
    getDisplayInfo: () => EntityDisplayInfo;
};

type TreeItemData = SceneTreeItemData | SectionTreeItemData | EntityTreeItemData;

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: `0 ${tokens.spacingHorizontalM}`,
    },
    searchBox: {
        padding: 0,
    },
    tree: {
        rowGap: 0,
        overflow: "hidden",
        flex: 1,
    },
    sceneTreeItemLayout: {
        padding: 0,
    },
});

const ActionCommand: FunctionComponent<{ command: ActionCommand<EntityBase>; entity: EntityBase; scene: Scene }> = (props) => {
    const { command, entity, scene } = props;

    return (
        <Tooltip key={command.displayName} content={command.displayName} relationship="label">
            <Button icon={<command.icon entity={entity} />} appearance="subtle" onClick={() => command.execute(scene, entity)} />
        </Tooltip>
    );
};

const ToggleCommand: FunctionComponent<{ command: ToggleCommand<EntityBase>; entity: EntityBase; scene: Scene }> = (props) => {
    const { command, entity, scene } = props;
    const [checked] = useState(command.isEnabled(scene, entity));

    return (
        <ToggleButton
            enabledIcon={<command.icon entity={entity} />}
            disabledIcon={command.disabledIcon ? <command.disabledIcon entity={entity} /> : undefined}
            value={checked}
            onChange={(enabled: boolean) => command.setEnabled(scene, entity, enabled)}
            title={command.displayName}
        />
    );
};

const EntityTreeItemComponent: FunctionComponent<{ item: EntityTreeItemData }> = (props) => {
    const { item } = props;

    const [displayInfo, setDisplayInfo] = useState<EntityDisplayInfo>();

    useEffect(() => {
        const displayInfo = item.getDisplayInfo();
        setDisplayInfo(displayInfo);
        return () => displayInfo.dispose?.();
    }, [item]);

    const name = useObservableState(() => displayInfo?.name, displayInfo?.onChange);

    return (
        <Body1 wrap={false} truncate>
            {name?.substring(0, 100)}
        </Body1>
    );
};

export const SceneExplorer: FunctionComponent<{
    sections: readonly SceneExplorerSection<EntityBase>[];
    commands: readonly SceneExplorerEntityCommand<EntityBase>[];
    scene: Scene;
    selectedEntity?: unknown;
    setSelectedEntity?: (entity: unknown) => void;
}> = (props) => {
    const classes = useStyles();

    const { sections, commands, scene, selectedEntity } = props;

    const [openItems, setOpenItems] = useState(new Set<TreeItemValue>());
    const [sceneVersion, setSceneVersion] = useState(0);
    const scrollViewRef = useRef<ScrollToInterface>(null);
    // We only want to scroll to the selected item if it was externally selected (outside of SceneExplorer).
    const previousSelectedEntity = useRef(selectedEntity);
    const setSelectedEntity = (entity: unknown) => {
        previousSelectedEntity.current = entity;
        props.setSelectedEntity?.(entity);
    };

    const [itemsFilter, setItemsFilter] = useState("");

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

            if (item === selectedEntity) {
                setSelectedEntity?.(null);
            }
        };

        const addObservers = sections.flatMap((section) => section.getEntityAddedObservables().map((observable) => observable.add(onSceneItemAdded)));
        const removeObservers = sections.flatMap((section) => section.getEntityRemovedObservables().map((observable) => observable.add(onSceneItemRemoved)));
        const moveObservers = sections
            .map((section) => section.getEntityMovedObservables)
            .filter((getEntityMovedObservable) => !!getEntityMovedObservable)
            .flatMap((getEntityMovedObservable) => getEntityMovedObservable().map((observable) => observable.add(onSceneItemAdded)));

        return () => {
            for (const observer of addObservers) {
                observer.remove();
            }
            for (const observer of removeObservers) {
                observer.remove();
            }
            for (const observer of moveObservers) {
                observer.remove();
            }
        };
    }, [sections, openItems]);

    const visibleItems = useMemo(() => {
        // This will track the items in the order they were traversed (which is what the flat tree expects).
        const traversedItems: TreeItemData[] = [];
        // This will track the items that are visible based on either the open state or the filter.
        const visibleItems = new Set<TreeItemData>();
        const filter = itemsFilter.toLocaleLowerCase();

        const sceneTreeItem = {
            type: "scene",
            scene: scene,
        } as const satisfies SceneTreeItemData;

        traversedItems.push(sceneTreeItem);
        // The scene tree item is always visible.
        visibleItems.add(sceneTreeItem);

        for (const section of sections) {
            const rootEntities = section.getRootEntities();

            const sectionTreeItem = {
                type: "section",
                sectionName: section.displayName,
                hasChildren: rootEntities.length > 0,
            } as const satisfies SectionTreeItemData;

            traversedItems.push(sectionTreeItem);
            // Section tree items are always visible when not filtering.
            if (!filter) {
                visibleItems.add(sectionTreeItem);
            }

            // When an item filter is present, always traverse the full scene graph (e.g. ignore the open item state).
            if (filter || openItems.has(section.displayName)) {
                let depth = 2;

                const createEntityTreeItemData = (entity: EntityBase, parent: SectionTreeItemData | EntityTreeItemData) => {
                    return {
                        type: "entity",
                        entity,
                        depth,
                        parent,
                        hasChildren: !!section.getEntityChildren && section.getEntityChildren(entity).length > 0,
                        icon: section.entityIcon,
                        getDisplayInfo: () => section.getEntityDisplayInfo(entity),
                    } as const satisfies EntityTreeItemData;
                };

                const rootEntityTreeItems = rootEntities.map((entity) => createEntityTreeItemData(entity, sectionTreeItem));

                TraverseGraph(
                    rootEntityTreeItems,
                    // Get children
                    (treeItem) => {
                        // When an item filter is present, always traverse the full scene graph (e.g. ignore the open item state).
                        if ((filter || openItems.has(treeItem.entity.uniqueId)) && section.getEntityChildren) {
                            const children = section.getEntityChildren(treeItem.entity);
                            return children.map((child) => createEntityTreeItemData(child, treeItem));
                        }
                        return null;
                    },
                    // Before traverse
                    (treeItem) => {
                        depth++;

                        traversedItems.push(treeItem);

                        if (!filter) {
                            // If there is no filter and we made it this far, then the item's parent is in an open state and this item is visible.
                            //!(treeItem as AbstractMesh).reservedDataStore?.hidden &&
                            visibleItems.add(treeItem);
                        } else {
                            // Otherwise we have an item filter and we need to check for a match.
                            const displayInfo = treeItem.getDisplayInfo();
                            if (displayInfo.name.toLocaleLowerCase().includes(filter)) {
                                // The item is a match, add it to the set.
                                visibleItems.add(treeItem);

                                // Also add all ancestors as a match since we want to be able to see the tree structure up to the matched item.
                                let currentItem: Nullable<SectionTreeItemData | EntityTreeItemData> = treeItem.parent;
                                while (currentItem) {
                                    // If this item is already in the matched set, then all its ancestors must also already be in the set.
                                    if (visibleItems.has(currentItem)) {
                                        break;
                                    }

                                    visibleItems.add(currentItem);

                                    // If the parent is the section, then there are no more parents to traverse.
                                    if (currentItem.type === "section") {
                                        currentItem = null;
                                    } else {
                                        currentItem = currentItem.parent;
                                    }
                                }
                            }
                            displayInfo.dispose?.();
                        }
                    },
                    // After traverse
                    () => {
                        depth--;
                    }
                );
            }
        }

        // Filter the traversal ordered items by those that should actually be visible.
        return traversedItems.filter((item) => visibleItems.has(item));
    }, [scene, sceneVersion, sections, openItems, itemsFilter]);

    const getParentStack = useCallback(
        (entity: EntityBase) => {
            const parentStack: TreeItemValue[] = [];

            for (const section of sections) {
                if (section.predicate(entity)) {
                    for (let parent = section.getEntityParent?.(entity); parent; parent = section.getEntityParent?.(parent)) {
                        parentStack.push(parent.uniqueId);
                    }
                    parentStack.push(section.displayName);
                    break;
                }
            }

            return parentStack;
        },
        [scene, openItems, sections]
    );

    // We only want the effect below to execute when the selectedEntity changes, so we use a ref to keep the latest version of getParentStack.
    const getParentStackRef = useRef(getParentStack);
    getParentStackRef.current = getParentStack;

    const [isScrollToPending, setIsScrollToPending] = useState(false);

    useEffect(() => {
        if (selectedEntity && selectedEntity !== previousSelectedEntity.current) {
            const entity = selectedEntity as EntityBase;
            if (entity.uniqueId != undefined) {
                const parentStack = getParentStackRef.current(entity);
                if (parentStack.length > 0) {
                    const newOpenItems = new Set<TreeItemValue>(openItems);
                    for (const parent of parentStack) {
                        newOpenItems.add(parent);
                    }
                    setOpenItems(newOpenItems);
                    setIsScrollToPending(true);
                }
            }
        }

        previousSelectedEntity.current = selectedEntity;
    }, [selectedEntity, setOpenItems, setIsScrollToPending]);

    // We need to wait for a render to complete before we can scroll to the item, hence the isScrollToPending.
    useEffect(() => {
        if (isScrollToPending) {
            const selectedItemIndex = visibleItems.findIndex((item) => item.type === "entity" && item.entity === selectedEntity);
            if (selectedItemIndex >= 0 && scrollViewRef.current) {
                scrollViewRef.current.scrollTo(selectedItemIndex, "smooth");
                setIsScrollToPending(false);
            }
        }
    }, [isScrollToPending, selectedEntity, visibleItems]);

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
            <SearchBox
                className={classes.searchBox}
                appearance="underline"
                contentBefore={<FilterRegular />}
                placeholder="Filter"
                value={itemsFilter}
                onChange={(_, data) => setItemsFilter(data.value)}
            />
            <FlatTree className={classes.tree} openItems={openItems} onOpenChange={onOpenChange} aria-label="Scene Explorer Tree">
                <VirtualizerScrollView imperativeRef={scrollViewRef} numItems={visibleItems.length} itemSize={32} container={{ style: { overflowX: "hidden" } }}>
                    {(index: number) => {
                        const item = visibleItems[index];

                        if (item.type === "scene") {
                            return (
                                <FlatTreeItem
                                    key="scene"
                                    value="scene"
                                    itemType="leaf"
                                    parentValue={undefined}
                                    aria-level={1}
                                    aria-setsize={1}
                                    aria-posinset={1}
                                    onClick={() => setSelectedEntity?.(scene)}
                                >
                                    <TreeItemLayout
                                        iconBefore={<MoviesAndTvRegular />}
                                        className={classes.sceneTreeItemLayout}
                                        style={scene === selectedEntity ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                    >
                                        <Body1Strong wrap={false} truncate>
                                            Scene
                                        </Body1Strong>
                                    </TreeItemLayout>
                                </FlatTreeItem>
                            );
                        } else if (item.type === "section") {
                            return (
                                <FlatTreeItem
                                    key={item.sectionName}
                                    value={item.sectionName}
                                    // Disable manual expand/collapse when a filter is active.
                                    itemType={!itemsFilter && item.hasChildren ? "branch" : "leaf"}
                                    parentValue={undefined}
                                    aria-level={1}
                                    aria-setsize={1}
                                    aria-posinset={1}
                                >
                                    <TreeItemLayout>
                                        <Body1Strong wrap={false} truncate>
                                            {item.sectionName.substring(0, 100)}
                                        </Body1Strong>
                                    </TreeItemLayout>
                                </FlatTreeItem>
                            );
                        } else {
                            return (
                                <FlatTreeItem
                                    key={item.entity.uniqueId}
                                    value={item.entity.uniqueId}
                                    // Disable manual expand/collapse when a filter is active.
                                    itemType={!itemsFilter && item.hasChildren ? "branch" : "leaf"}
                                    parentValue={item.parent.type === "section" ? item.parent.sectionName : item.entity.uniqueId}
                                    aria-level={item.depth}
                                    aria-setsize={1}
                                    aria-posinset={1}
                                    onClick={() => setSelectedEntity?.(item.entity)}
                                >
                                    <TreeItemLayout
                                        iconBefore={item.icon ? <item.icon entity={item.entity} /> : null}
                                        style={item.entity === selectedEntity ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                                        actions={commands
                                            .filter((command) => command.predicate(item.entity))
                                            .map((command) =>
                                                command.type === "action" ? (
                                                    <ActionCommand key={command.displayName} command={command} entity={item.entity} scene={scene} />
                                                ) : (
                                                    <ToggleCommand key={command.displayName} command={command} entity={item.entity} scene={scene} />
                                                )
                                            )}
                                    >
                                        <EntityTreeItemComponent item={item} />
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
