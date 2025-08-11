import type { IDisposable, IReadonlyObservable, Nullable, Scene } from "core/index";

import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { ScrollToInterface } from "@fluentui/react-components/unstable";
import type { ComponentType, FunctionComponent } from "react";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { Body1, Body1Strong, Button, FlatTree, FlatTreeItem, makeStyles, SearchBox, tokens, Tooltip, TreeItemLayout } from "@fluentui/react-components";
import { VirtualizerScrollView } from "@fluentui/react-components/unstable";
import { FilterRegular, MoviesAndTvRegular } from "@fluentui/react-icons";
import type { FluentIcon } from "@fluentui/react-icons";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useObservableState } from "../../hooks/observableHooks";
import { useResource } from "../../hooks/resourceHooks";
import { TraverseGraph } from "../../misc/graphUtils";

export type EntityBase = Readonly<{
    uniqueId: number;
    reservedDataStore?: Record<PropertyKey, unknown>;
}>;

export type EntityDisplayInfo = Partial<IDisposable> &
    Readonly<{
        /**
         * The name of the entity to display in the Scene Explorer tree.
         */
        name: string;

        /**
         * An observable that notifies when the display info (such as the name) changes.
         */
        onChange?: IReadonlyObservable<void>;
    }>;

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

type Command<T extends EntityBase> = Partial<IDisposable> &
    Readonly<{
        /**
         * The display name of the command (e.g. "Delete", "Rename", etc.).
         */
        displayName: string;

        /**
         * An icon component to render for the command.
         */
        icon: ComponentType;

        /**
         * An observable that notifies when the command state changes.
         */
        onChange?: IReadonlyObservable<unknown>;
    }>;

type ActionCommand<T extends EntityBase> = Command<T> & {
    readonly type: "action";

    /**
     * The function that executes the command.
     */
    execute(): void;
};

type ToggleCommand<T extends EntityBase> = Command<T> & {
    readonly type: "toggle";

    /**
     * A boolean indicating if the command is enabled.
     */
    isEnabled: boolean;
};

export type SceneExplorerCommand<T extends EntityBase> = ActionCommand<T> | ToggleCommand<T>;

export type SceneExplorerCommandProvider<T extends EntityBase> = Readonly<{
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
     * Gets the command information for the given entity.
     */
    getCommand: (entity: T) => SceneExplorerCommand<T>;
}>;

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

const ActionCommand: FunctionComponent<{ command: ActionCommand<EntityBase>; entity: EntityBase }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [displayName, Icon, execute] = useObservableState(
        useCallback(() => [command.displayName, command.icon, command.execute] as const, [command]),
        command.onChange
    );

    return (
        <Tooltip content={displayName} relationship="label" positioning={"after"}>
            <Button icon={<Icon />} appearance="subtle" onClick={() => execute()} />
        </Tooltip>
    );
};

const ToggleCommand: FunctionComponent<{ command: ToggleCommand<EntityBase>; entity: EntityBase }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [displayName, Icon, isEnabled] = useObservableState(
        useCallback(() => [command.displayName, command.icon, command.isEnabled] as const, [command]),
        command.onChange
    );

    // TODO-iv2: Consolidate icon prop passing approach for inspector and shared components
    return <ToggleButton title={displayName} enabledIcon={Icon as FluentIcon} value={isEnabled} onChange={(val: boolean) => (command.isEnabled = val)} />;
};

const SceneTreeItem: FunctionComponent<{
    scene: Scene;
    isSelected: boolean;
    select: () => void;
    isFiltering: boolean;
}> = (props) => {
    const { isSelected, select } = props;

    const classes = useStyles();

    return (
        <FlatTreeItem key="scene" value="scene" itemType="leaf" parentValue={undefined} aria-level={1} aria-setsize={1} aria-posinset={1} onClick={select}>
            <TreeItemLayout
                iconBefore={<MoviesAndTvRegular />}
                className={classes.sceneTreeItemLayout}
                style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
            >
                <Body1Strong wrap={false} truncate>
                    Scene
                </Body1Strong>
            </TreeItemLayout>
        </FlatTreeItem>
    );
};

const SectionTreeItem: FunctionComponent<{
    scene: Scene;
    section: SectionTreeItemData;
    isFiltering: boolean;
}> = (props) => {
    const { section, isFiltering } = props;

    return (
        <FlatTreeItem
            key={section.sectionName}
            value={section.sectionName}
            // Disable manual expand/collapse when a filter is active.
            itemType={!isFiltering && section.hasChildren ? "branch" : "leaf"}
            parentValue={undefined}
            aria-level={1}
            aria-setsize={1}
            aria-posinset={1}
        >
            <TreeItemLayout>
                <Body1Strong wrap={false} truncate>
                    {section.sectionName.substring(0, 100)}
                </Body1Strong>
            </TreeItemLayout>
        </FlatTreeItem>
    );
};

const EntityTreeItem: FunctionComponent<{
    scene: Scene;
    entityItem: EntityTreeItemData;
    isSelected: boolean;
    select: () => void;
    isFiltering: boolean;
    commandProviders: readonly SceneExplorerCommandProvider<EntityBase>[];
}> = (props) => {
    const { entityItem, isSelected, select, isFiltering, commandProviders } = props;

    const displayInfo = useResource(
        useCallback(() => {
            const displayInfo = entityItem.getDisplayInfo();
            if (!displayInfo.dispose) {
                displayInfo.dispose = () => {
                    /* No-op */
                };
            }
            return displayInfo as typeof displayInfo & IDisposable;
        }, [entityItem])
    );

    const name = useObservableState(() => displayInfo.name, displayInfo.onChange);

    // Get the commands that apply to this entity.
    const commands = useResource(
        useCallback(() => {
            const commands: readonly SceneExplorerCommand<EntityBase>[] = commandProviders
                .filter((provider) => provider.predicate(entityItem.entity))
                .map((provider) => provider.getCommand(entityItem.entity));

            return Object.assign(commands, {
                dispose: () => commands.forEach((command) => command.dispose?.()),
            });
        }, [entityItem.entity, commandProviders])
    );

    const [enabledToggleCommands, setEnabledToggleCommands] = useState<readonly ToggleCommand<EntityBase>[]>([]);

    // For enabled/active toggle commands, we should always show them so the user knows this command is toggled on.
    useEffect(() => {
        const toggleCommands = commands.filter((command) => command.type === "toggle");

        const updateEnabledToggleCommands = () => {
            setEnabledToggleCommands(toggleCommands.filter((command) => command.isEnabled));
        };

        updateEnabledToggleCommands();

        const observers = toggleCommands
            .map((command) => command.onChange)
            .filter((onChange) => !!onChange)
            .map((onChange) => onChange.add(updateEnabledToggleCommands));

        return () => {
            for (const observer of observers) {
                observer.remove();
            }
        };
    }, [commands]);

    return (
        <FlatTreeItem
            key={entityItem.entity.uniqueId}
            value={entityItem.entity.uniqueId}
            // Disable manual expand/collapse when a filter is active.
            itemType={!isFiltering && entityItem.hasChildren ? "branch" : "leaf"}
            parentValue={entityItem.parent.type === "section" ? entityItem.parent.sectionName : entityItem.entity.uniqueId}
            aria-level={entityItem.depth}
            aria-setsize={1}
            aria-posinset={1}
            onClick={select}
        >
            <TreeItemLayout
                iconBefore={entityItem.icon ? <entityItem.icon entity={entityItem.entity} /> : null}
                style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                // Actions are only visible when the item is focused or has pointer hover.
                actions={commands.map((command) =>
                    command.type === "action" ? (
                        <ActionCommand key={command.displayName} command={command} entity={entityItem.entity} />
                    ) : (
                        <ToggleCommand key={command.displayName} command={command} entity={entityItem.entity} />
                    )
                )}
                // Asides are always visible.
                aside={{
                    // Match the gap and padding of the actions.
                    style: { gap: 0, paddingRight: tokens.spacingHorizontalS },
                    children: enabledToggleCommands.map((command) => <ToggleCommand key={command.displayName} command={command} entity={entityItem.entity} />),
                }}
            >
                <Body1 wrap={false} truncate>
                    {name.substring(0, 100)}
                </Body1>
            </TreeItemLayout>
        </FlatTreeItem>
    );
};

export const SceneExplorer: FunctionComponent<{
    sections: readonly SceneExplorerSection<EntityBase>[];
    commandProviders: readonly SceneExplorerCommandProvider<EntityBase>[];
    scene: Scene;
    selectedEntity?: unknown;
    setSelectedEntity?: (entity: unknown) => void;
}> = (props) => {
    const classes = useStyles();

    const { sections, commandProviders, scene, selectedEntity } = props;

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
                        if (treeItem.entity.reservedDataStore?.hidden) {
                            return; // Don't display the treeItem or its children if reservedDataStore.hidden is true
                        }
                        if (!filter) {
                            // If there is no filter and we made it this far, then the item's parent is in an open state and this item is visible.
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
                                <SceneTreeItem
                                    key="scene"
                                    scene={scene}
                                    isSelected={selectedEntity === scene}
                                    select={() => setSelectedEntity?.(scene)}
                                    isFiltering={!!itemsFilter}
                                />
                            );
                        } else if (item.type === "section") {
                            return <SectionTreeItem key={item.sectionName} scene={scene} section={item} isFiltering={!!itemsFilter} />;
                        } else {
                            return (
                                <EntityTreeItem
                                    key={item.entity.uniqueId}
                                    scene={scene}
                                    entityItem={item}
                                    isSelected={selectedEntity === item.entity}
                                    select={() => setSelectedEntity?.(item.entity)}
                                    isFiltering={!!itemsFilter}
                                    commandProviders={commandProviders}
                                />
                            );
                        }
                    }}
                </VirtualizerScrollView>
            </FlatTree>
        </div>
    );
};
