import type { ScrollToInterface } from "@fluentui-contrib/react-virtualizer";
import type { TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import type { ComponentType, FunctionComponent } from "react";

import type { IDisposable, IReadonlyObservable, Nullable, Scene } from "core/index";

import { VirtualizerScrollView } from "@fluentui-contrib/react-virtualizer";
import {
    Body1,
    Body1Strong,
    Button,
    FlatTree,
    FlatTreeItem,
    makeStyles,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    SearchBox,
    tokens,
    Tooltip,
    TreeItemLayout,
} from "@fluentui/react-components";
import { ArrowExpandAllRegular, createFluentIcon, FilterRegular, GlobeRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
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
     * A function that returns the root entities for this section.
     */
    getRootEntities: () => readonly T[];

    /**
     * An optional function that returns the children of a given entity.
     */
    getEntityChildren?: (entity: T) => readonly T[];

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

type Command = Partial<IDisposable> &
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

type ActionCommand = Command & {
    readonly type: "action";

    /**
     * The function that executes the command.
     */
    execute(): void;
};

type ToggleCommand = Command & {
    readonly type: "toggle";

    /**
     * A boolean indicating if the command is enabled.
     */
    isEnabled: boolean;
};

export type SceneExplorerCommand = ActionCommand | ToggleCommand;

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
    getCommand: (entity: T) => SceneExplorerCommand;
}>;

type SceneTreeItemData = { type: "scene"; scene: Scene };

type SectionTreeItemData = {
    type: "section";
    sectionName: string;
    children: EntityTreeItemData[];
};

type EntityTreeItemData = {
    type: "entity";
    entity: EntityBase;
    depth: number;
    parent: SectionTreeItemData | EntityTreeItemData;
    children?: EntityTreeItemData[];
    icon?: ComponentType<{ entity: EntityBase }>;
    getDisplayInfo: () => EntityDisplayInfo;
};

type TreeItemData = SceneTreeItemData | SectionTreeItemData | EntityTreeItemData;

function ExpandOrCollapseAll(treeItem: SectionTreeItemData | EntityTreeItemData, open: boolean, openItems: Set<TreeItemValue>) {
    const addOrRemove = open ? openItems.add.bind(openItems) : openItems.delete.bind(openItems);
    TraverseGraph(
        [treeItem],
        (treeItem) => treeItem.children,
        (treeItem) => addOrRemove(treeItem.type === "entity" ? treeItem.entity.uniqueId : treeItem.sectionName)
    );
}

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
    treeItemLayoutAside: {
        gap: 0,
        paddingLeft: tokens.spacingHorizontalS,
        paddingRight: tokens.spacingHorizontalS,
    },
    treeItemLayoutMain: {
        flex: "1 1 0",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
});

const ActionCommand: FunctionComponent<{ command: ActionCommand }> = (props) => {
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

const ToggleCommand: FunctionComponent<{ command: ToggleCommand }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [displayName, Icon, isEnabled] = useObservableState(
        useCallback(() => [command.displayName, command.icon, command.isEnabled] as const, [command]),
        command.onChange
    );

    // TODO-iv2: Consolidate icon prop passing approach for inspector and shared components
    return <ToggleButton appearance="transparent" title={displayName} checkedIcon={Icon as FluentIcon} value={isEnabled} onChange={(val: boolean) => (command.isEnabled = val)} />;
};

// This "placeholder" command has a blank icon and is a no-op. It is used for aside
// alignment when some toggle commands are enabled. See more details on the commands
// for setting the aside state.
const PlaceHolderCommand: ActionCommand = {
    type: "action",
    displayName: "",
    icon: createFluentIcon("Placeholder", "1em", ""),
    execute: () => {
        /* No-op */
    },
};

function MakeCommandElement(command: SceneExplorerCommand, isPlaceholder: boolean): JSX.Element {
    if (isPlaceholder) {
        // Placeholders are not visible and not interacted with, so they are always ActionCommand
        // components, just to ensure the exact right amount of space is taken up.
        return <ActionCommand key={command.displayName} command={PlaceHolderCommand} />;
    }

    return command.type === "action" ? <ActionCommand key={command.displayName} command={command} /> : <ToggleCommand key={command.displayName} command={command} />;
}

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
                iconBefore={<GlobeRegular />}
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
    expandAll: () => void;
    collapseAll: () => void;
}> = (props) => {
    const { section, isFiltering, expandAll, collapseAll } = props;

    return (
        <Menu openOnContext>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    key={section.sectionName}
                    value={section.sectionName}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={!isFiltering && section.children.length > 0 ? "branch" : "leaf"}
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
            </MenuTrigger>
            <MenuPopover hidden={!section.children.length}>
                <MenuList>
                    <MenuItem onClick={expandAll}>
                        <Body1>Expand All</Body1>
                    </MenuItem>
                    <MenuItem onClick={collapseAll}>
                        <Body1>Collapse All</Body1>
                    </MenuItem>
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};

const EntityTreeItem: FunctionComponent<{
    scene: Scene;
    entityItem: EntityTreeItemData;
    isSelected: boolean;
    select: () => void;
    isFiltering: boolean;
    commandProviders: readonly SceneExplorerCommandProvider<EntityBase>[];
    expandAll: () => void;
    collapseAll: () => void;
}> = (props) => {
    const { entityItem, isSelected, select, isFiltering, commandProviders, expandAll, collapseAll } = props;

    const classes = useStyles();

    const hasChildren = !!entityItem.children?.length;

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
            const commands: readonly SceneExplorerCommand[] = [...commandProviders]
                .filter((provider) => provider.predicate(entityItem.entity))
                .map((provider) => {
                    return {
                        order: provider.order,
                        command: provider.getCommand(entityItem.entity),
                    };
                })
                .sort((a, b) => {
                    // Action commands always come before toggle commands, because toggle commands will remain
                    // visible when they are enabled, even when the pointer is not hovering the item, and we
                    // don't want a bunch of blank space.
                    if (a.command.type !== b.command.type) {
                        return a.command.type === "action" ? -1 : 1;
                    }

                    // Within each group of command types, sort by order (default 0) ascending.
                    return (a.order ?? 0) - (b.order ?? 0);
                })
                .map((entry) => entry.command);

            return Object.assign(commands, {
                dispose: () => commands.forEach((command) => command.dispose?.()),
            });
        }, [entityItem.entity, commandProviders])
    );

    // TreeItemLayout actions (totally unrelated to "Action" type commands) are only visible when the item is focused or has pointer hover.
    const actions = useMemo(() => {
        const defaultCommands: SceneExplorerCommand[] = [];
        if (hasChildren) {
            defaultCommands.push({
                type: "action",
                displayName: "Expand All",
                icon: () => <ArrowExpandAllRegular />,
                execute: () => expandAll(),
            });
        }

        return [...defaultCommands, ...commands].map((command) => MakeCommandElement(command, false));
    }, [commands, hasChildren, expandAll]);

    // TreeItemLayout asides are always visible.
    const [aside, setAside] = useState<readonly JSX.Element[]>([]);

    // This useEffect keeps the aside up-to-date. What should always show is any enabled toggle command, along with
    // placeholders to the right to keep the position of the actions consistent.
    useEffect(() => {
        const updateAside = () => {
            let isAnyCommandEnabled = false;
            const aside: JSX.Element[] = [];
            for (const command of commands) {
                isAnyCommandEnabled ||= command.type === "toggle" && command.isEnabled;
                if (isAnyCommandEnabled) {
                    aside.push(MakeCommandElement(command, command.type !== "toggle" || !command.isEnabled));
                }
            }
            setAside(aside);
        };

        updateAside();

        const observers = commands
            .map((command) => command.onChange)
            .filter((onChange) => !!onChange)
            .map((onChange) => onChange.add(updateAside));

        return () => {
            for (const observer of observers) {
                observer.remove();
            }
        };
    }, [commands]);

    return (
        <Menu openOnContext>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    key={entityItem.entity.uniqueId}
                    value={entityItem.entity.uniqueId}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={!isFiltering && hasChildren ? "branch" : "leaf"}
                    parentValue={entityItem.parent.type === "section" ? entityItem.parent.sectionName : entityItem.entity.uniqueId}
                    aria-level={entityItem.depth}
                    aria-setsize={1}
                    aria-posinset={1}
                    onClick={select}
                >
                    <TreeItemLayout
                        iconBefore={entityItem.icon ? <entityItem.icon entity={entityItem.entity} /> : null}
                        style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                        actions={actions}
                        aside={{
                            // Match the gap and padding of the actions.
                            className: classes.treeItemLayoutAside,
                            children: aside,
                        }}
                        main={{
                            // Prevent the "main" content (the Body1 below) from growing too large and pushing the actions/aside out of view.
                            className: classes.treeItemLayoutMain,
                        }}
                    >
                        <Body1 wrap={false} truncate>
                            {name}
                        </Body1>
                    </TreeItemLayout>
                </FlatTreeItem>
            </MenuTrigger>
            <MenuPopover hidden={!hasChildren}>
                <MenuList>
                    <MenuItem onClick={expandAll}>
                        <Body1>Expand All</Body1>
                    </MenuItem>
                    <MenuItem onClick={collapseAll}>
                        <Body1>Collapse All</Body1>
                    </MenuItem>
                </MenuList>
            </MenuPopover>
        </Menu>
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

    const [sceneTreeItem, sectionTreeItems, allTreeItems] = useMemo(() => {
        const sectionTreeItems: SectionTreeItemData[] = [];
        const allTreeItems = new Map<TreeItemValue, SectionTreeItemData | EntityTreeItemData>();

        const sceneTreeItem: SceneTreeItemData = {
            type: "scene",
            scene: scene,
        };

        for (const section of sections) {
            const rootEntities = section.getRootEntities();

            const sectionTreeItem = {
                type: "section",
                sectionName: section.displayName,
                children: [],
            } as const satisfies SectionTreeItemData;

            sectionTreeItems.push(sectionTreeItem);
            allTreeItems.set(sectionTreeItem.sectionName, sectionTreeItem);

            let depth = 2;
            const createEntityTreeItemData = (entity: EntityBase, parent: SectionTreeItemData | EntityTreeItemData) => {
                const treeItemData = {
                    type: "entity",
                    entity,
                    depth,
                    parent,
                    icon: section.entityIcon,
                    getDisplayInfo: () => section.getEntityDisplayInfo(entity),
                } as const satisfies EntityTreeItemData;

                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(treeItemData);

                allTreeItems.set(entity.uniqueId, treeItemData);
                return treeItemData;
            };

            const rootEntityTreeItems = rootEntities.map((entity) => createEntityTreeItemData(entity, sectionTreeItem));

            TraverseGraph(
                rootEntityTreeItems,
                // Get children
                (treeItem) => {
                    if (section.getEntityChildren) {
                        const children = section.getEntityChildren(treeItem.entity);
                        return children.filter((child) => !child.reservedDataStore?.hidden).map((child) => createEntityTreeItemData(child, treeItem));
                    }
                    return null;
                },
                // Before traverse
                () => {
                    depth++;
                },
                // After traverse
                () => {
                    depth--;
                }
            );
        }

        return [sceneTreeItem, sectionTreeItems, allTreeItems] as const;
    }, [scene, sceneVersion, sections]);

    const visibleItems = useMemo(() => {
        // This will track the items in the order they were traversed (which is what the flat tree expects).
        const traversedItems: TreeItemData[] = [];
        // This will track the items that are visible based on either the open state or the filter.
        const visibleItems = new Set<TreeItemData>();
        const filter = itemsFilter.toLocaleLowerCase();

        traversedItems.push(sceneTreeItem);
        // The scene tree item is always visible.
        visibleItems.add(sceneTreeItem);

        for (const sectionTreeItem of sectionTreeItems) {
            const children = sectionTreeItem.children;
            traversedItems.push(sectionTreeItem);
            if (!children.length) {
                continue;
            }

            // Section tree items are always visible when not filtering.
            if (!filter) {
                visibleItems.add(sectionTreeItem);
            }

            // When an item filter is present, always traverse the full scene graph (e.g. ignore the open item state).
            if (filter || openItems.has(sectionTreeItem.sectionName)) {
                TraverseGraph(
                    children,
                    // Get children
                    (treeItem) => {
                        if (filter || openItems.has(treeItem.entity.uniqueId)) {
                            return treeItem.children ?? null;
                        }
                        return null;
                    },
                    // Before traverse
                    (treeItem) => {
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
                    }
                );
            }
        }

        // Filter the traversal ordered items by those that should actually be visible.
        return traversedItems.filter((item) => visibleItems.has(item));
    }, [sceneTreeItem, sectionTreeItems, allTreeItems, openItems, itemsFilter]);

    const getParentStack = useCallback(
        (entity: EntityBase) => {
            const parentStack: TreeItemValue[] = [];
            for (let treeItem = allTreeItems.get(entity.uniqueId); treeItem; treeItem = treeItem?.type === "entity" ? treeItem.parent : undefined) {
                parentStack.push(treeItem.type === "entity" ? treeItem.entity.uniqueId : treeItem.sectionName);
            }
            return parentStack;
        },
        [allTreeItems]
    );

    const [isScrollToPending, setIsScrollToPending] = useState(false);

    useEffect(() => {
        if (selectedEntity && selectedEntity !== previousSelectedEntity.current) {
            const entity = selectedEntity as EntityBase;
            if (entity.uniqueId != undefined) {
                const parentStack = getParentStack(entity);
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
    }, [selectedEntity]);

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
                // Shift or Ctrl mean expand/collapse all descendants.
                if (event.shiftKey || event.ctrlKey) {
                    const treeItem = allTreeItems.get(data.value);
                    if (treeItem) {
                        ExpandOrCollapseAll(treeItem, data.open, data.openItems);
                    }
                }
                setOpenItems(data.openItems);
            }
        },
        [setOpenItems, allTreeItems]
    );

    const expandAll = (treeItem: SectionTreeItemData | EntityTreeItemData) => {
        ExpandOrCollapseAll(treeItem, true, openItems);
        setOpenItems(new Set(openItems));
    };

    const collapseAll = (treeItem: SectionTreeItemData | EntityTreeItemData) => {
        ExpandOrCollapseAll(treeItem, false, openItems);
        setOpenItems(new Set(openItems));
    };

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
                            return (
                                <SectionTreeItem
                                    key={item.sectionName}
                                    scene={scene}
                                    section={item}
                                    isFiltering={!!itemsFilter}
                                    expandAll={() => expandAll(item)}
                                    collapseAll={() => collapseAll(item)}
                                />
                            );
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
                                    expandAll={() => expandAll(item)}
                                    collapseAll={() => collapseAll(item)}
                                />
                            );
                        }
                    }}
                </VirtualizerScrollView>
            </FlatTree>
        </div>
    );
};
