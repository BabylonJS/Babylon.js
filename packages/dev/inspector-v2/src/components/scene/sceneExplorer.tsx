import type { ScrollToInterface } from "@fluentui-contrib/react-virtualizer";
import type { MenuCheckedValueChangeData, MenuCheckedValueChangeEvent, TreeItemValue, TreeOpenChangeData, TreeOpenChangeEvent } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";
import type { ComponentType, FunctionComponent, KeyboardEvent } from "react";

import type { IDisposable, IReadonlyObservable, Nullable, Scene } from "core/index";
import type { DragDropProps, DropProps } from "./sceneExplorerDragDrop";

import { VirtualizerScrollView } from "@fluentui-contrib/react-virtualizer";
import {
    Body1,
    Body1Strong,
    Button,
    FlatTree,
    FlatTreeItem,
    makeStyles,
    Menu,
    MenuDivider,
    MenuItem,
    MenuItemCheckbox,
    MenuList,
    MenuPopover,
    MenuTrigger,
    mergeClasses,
    SearchBox,
    tokens,
    Tooltip,
    TreeItemLayout,
    treeItemLevelToken,
} from "@fluentui/react-components";
import { ArrowCollapseAllRegular, ArrowExpandAllRegular, createFluentIcon, FilterRegular, GlobeRegular, TextSortAscendingRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { CustomTokens } from "shared-ui-components/fluent/primitives/utils";
import { useObservableState } from "../../hooks/observableHooks";
import { useResource } from "../../hooks/resourceHooks";
import { useCompactMode } from "../../hooks/settingsHooks";
import { TraverseGraph } from "../../misc/graphUtils";
import { useSceneExplorerDragDrop } from "./sceneExplorerDragDrop";

type EntityBase = Readonly<{
    uniqueId?: number;
    reservedDataStore?: Record<PropertyKey, unknown>;
}>;

const SyntheticUniqueIds = new WeakMap<EntityBase, number>();
function GetEntityId(entity: EntityBase): number {
    if (entity.uniqueId !== undefined) {
        return entity.uniqueId;
    }

    let id = SyntheticUniqueIds.get(entity);
    if (!id) {
        SyntheticUniqueIds.set(entity, (id = UniqueIdGenerator.UniqueId));
    }
    return id;
}

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

/**
 * Configuration for drag-and-drop behavior within a section.
 */
export type SceneExplorerDragDropConfig<T> = Readonly<{
    /**
     * Determines whether an entity can be dragged.
     * @param entity The entity to check.
     * @returns True if the entity can be dragged, false otherwise.
     */
    canDrag: (entity: T) => boolean;

    /**
     * Determines whether an entity can be dropped onto a target.
     * @param draggedEntity The entity being dragged.
     * @param targetEntity The potential drop target entity, or null if dropping onto the section root.
     * @returns True if the drop is allowed, false otherwise.
     */
    canDrop: (draggedEntity: T, targetEntity: T | null) => boolean;

    /**
     * Called when a drag-and-drop operation completes.
     * @param draggedEntity The entity that was dragged.
     * @param targetEntity The entity it was dropped onto, or null if dropped onto the section root.
     */
    onDrop: (draggedEntity: T, targetEntity: T | null) => void;
}>;

export type SceneExplorerSection<T> = Readonly<{
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

    /**
     * Optional configuration for drag-and-drop behavior within this section.
     * If not provided, drag-and-drop is disabled for this section.
     */
    dragDropConfig?: SceneExplorerDragDropConfig<T>;
}>;

type InlineCommand = {
    /**
     * An icon component to render for the command. Required for inline commands.
     */
    icon: ComponentType;

    /**
     * The mode of the command. Inline commands are shown directly in the tree item layout. Inline by default.
     */
    mode?: "inline";
};

type ContextMenuCommand = {
    /**
     * An icon component to render for the command. Optional for context menu commands.
     */
    icon?: ComponentType;

    /**
     * The mode of the command. Context menu commands are shown in the context menu for the tree item.
     */
    mode: "contextMenu";
};

type CommandMode = NonNullable<(InlineCommand | ContextMenuCommand)["mode"]>;

type ActionCommand = {
    readonly type: "action";

    /**
     * The function that executes the command.
     */
    execute(): void;
};

type ToggleCommand = {
    readonly type: "toggle";

    /**
     * A boolean indicating if the command is enabled.
     */
    isEnabled: boolean;
};

type CommandType = (ActionCommand | ToggleCommand)["type"];

export type SceneExplorerCommand<ModeT extends CommandMode = CommandMode, TypeT extends CommandType = CommandType> = Partial<IDisposable> &
    Readonly<{
        /**
         * The display name of the command (e.g. "Delete", "Rename", etc.).
         */
        displayName: string;

        /**
         * An optional array of hotkeys that trigger the command.
         */
        hotKey?: {
            keyCode: string;
            control?: boolean;
            alt?: boolean;
            shift?: boolean;
            meta?: boolean;
        };

        /**
         * An observable that notifies when the command state changes.
         */
        onChange?: IReadonlyObservable<unknown>;
    }> &
    (ModeT extends "inline" ? InlineCommand : ContextMenuCommand) &
    (TypeT extends "action" ? ActionCommand : ToggleCommand);

export type SceneExplorerCommandProvider<ContextT, ModeT extends CommandMode = CommandMode, TypeT extends CommandType = CommandType> = Readonly<{
    /**
     * An optional order for the section, relative to other commands.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A predicate function that determines if the command is applicable to the given context.
     */
    predicate: (context: unknown) => context is ContextT;

    /**
     * Gets the command information for the given context.
     */
    getCommand: (context: ContextT) => SceneExplorerCommand<ModeT, TypeT>;
}>;

type SceneTreeItemData = { type: "scene"; scene: Scene };

type SectionTreeItemData = {
    type: "section";
    sectionName: string;
    children: EntityTreeItemData[];
    dragDropConfig?: SceneExplorerDragDropConfig<unknown>;
};

type EntityTreeItemData = {
    type: "entity";
    entity: EntityBase;
    depth: number;
    parent: SectionTreeItemData | EntityTreeItemData;
    children?: EntityTreeItemData[];
    icon?: ComponentType<{ entity: unknown }>;
    getDisplayInfo: () => EntityDisplayInfo;
};

type TreeItemData = SceneTreeItemData | SectionTreeItemData | EntityTreeItemData;

function GetEntitySection(entityItem: EntityTreeItemData): SectionTreeItemData {
    let current: SectionTreeItemData | EntityTreeItemData = entityItem;
    while (current.type === "entity") {
        current = current.parent;
    }
    return current;
}

function ExpandOrCollapseAll(treeItem: SectionTreeItemData | EntityTreeItemData, open: boolean, openItems: Set<TreeItemValue>) {
    const addOrRemove = open ? openItems.add.bind(openItems) : openItems.delete.bind(openItems);
    TraverseGraph(
        [treeItem],
        (treeItem) => treeItem.children,
        (treeItem) => addOrRemove(treeItem.type === "entity" ? GetEntityId(treeItem.entity) : treeItem.sectionName)
    );
}

function GetCommandHotKeyDescription(command: SceneExplorerCommand): string {
    if (!command.hotKey) {
        return "";
    }
    const hotKey = command.hotKey;
    return `${hotKey.control ? "Ctrl+" : ""}${hotKey.alt ? "Alt+" : ""}${hotKey.shift ? "Shift+" : ""}${hotKey.meta ? "Meta+" : ""}${hotKey.keyCode}`;
}

function useCommandContextMenuState(commands: readonly SceneExplorerCommand<"contextMenu">[]) {
    const [checkedContextMenuItems, setCheckedContextMenuItems] = useState({ toggleCommands: [] as string[] });

    useEffect(() => {
        const updateCheckedItems = () => {
            const checkedItems: string[] = [];
            for (const command of commands) {
                if (command.type === "toggle" && command.isEnabled) {
                    checkedItems.push(command.displayName);
                }
            }
            setCheckedContextMenuItems({ toggleCommands: checkedItems });
        };

        updateCheckedItems();

        const observers = commands
            .map((command) => command.onChange)
            .filter((onChange) => !!onChange)
            .map((onChange) => onChange.add(updateCheckedItems));

        return () => {
            for (const observer of observers) {
                observer.remove();
            }
        };
    }, [commands]);

    const onContextMenuCheckedValueChange = useCallback(
        (e: MenuCheckedValueChangeEvent, data: MenuCheckedValueChangeData) => {
            for (const command of commands) {
                if (command.type === "toggle") {
                    command.isEnabled = data.checkedItems.includes(command.displayName);
                }
            }
        },
        [commands]
    );

    const contextMenuItems = commands.map((command) =>
        command.type === "action" ? (
            <MenuItem
                key={command.displayName}
                icon={command.icon ? <command.icon /> : undefined}
                secondaryContent={GetCommandHotKeyDescription(command)}
                onClick={() => command.execute()}
            >
                {command.displayName}
            </MenuItem>
        ) : (
            <MenuItemCheckbox
                key={command.displayName}
                // Don't show both a checkmark and an icon. null means no checkmark, undefined means default (checkmark).
                checkmark={command.icon ? null : undefined}
                icon={command.icon ? <command.icon /> : undefined}
                secondaryContent={GetCommandHotKeyDescription(command)}
                name="toggleCommands"
                value={command.displayName}
            >
                {command.displayName}
            </MenuItemCheckbox>
        )
    );

    return [checkedContextMenuItems, onContextMenuCheckedValueChange, contextMenuItems] as const;
}

function CoerceEntityArray(entities: EntityTreeItemData[], sort: boolean): readonly EntityTreeItemData[] {
    // If sorting is requested, create a copy of the array and sort it by display name.
    if (sort) {
        entities = [...entities];
        entities.sort((left, right) => {
            const leftDisplayInfo = left.getDisplayInfo();
            const rightDisplayInfo = right.getDisplayInfo();
            const comparison = leftDisplayInfo.name.localeCompare(rightDisplayInfo.name);
            leftDisplayInfo.dispose?.();
            rightDisplayInfo.dispose?.();
            return comparison;
        });
    }

    return entities;
}

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    toolbarDiv: {
        display: "flex",
        flexDirection: "row",
        paddingLeft: tokens.spacingHorizontalM,
        paddingRight: tokens.spacingHorizontalM,
    },
    searchBox: {
        flex: 1,
        padding: 0,
    },
    tree: {
        rowGap: 0,
        overflow: "hidden",
        flex: 1,
        paddingLeft: tokens.spacingHorizontalM,
        paddingRight: tokens.spacingHorizontalM,
    },
    scrollView: {
        overflowX: "hidden",
        // Create a little padding and negative margin to keep correct alignment but make
        // room for the focus ring so it doesn't get clipped.
        paddingLeft: tokens.spacingHorizontalXXS,
        paddingRight: tokens.spacingHorizontalXXS,
        marginLeft: `calc(-1 * ${tokens.spacingHorizontalXXS})`,
        marginRight: `calc(-1 * ${tokens.spacingHorizontalXXS})`,
    },
    treeItem: {
        // Ensure focused items render their focus ring above adjacent selected/hovered items
        "&:focus": {
            zIndex: 1,
        },
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
    treeItemLayoutCompact: {
        minHeight: CustomTokens.lineHeightSmall,
        maxHeight: CustomTokens.lineHeightSmall,
    },
    // Use tighter indentation than the default (16px instead of 24px per level)
    treeItemLayoutBranch: {
        paddingLeft: `calc((var(${treeItemLevelToken}, 1) - 1) * ${tokens.spacingHorizontalL})`,
    },
    treeItemLayoutLeaf: {
        paddingLeft: `calc(var(${treeItemLevelToken}, 1) * ${tokens.spacingHorizontalL} + ${tokens.spacingHorizontalS})`,
    },
    treeItemDragging: {
        opacity: 0.5,
    },
    treeItemDropTarget: {
        outline: `${tokens.strokeWidthThick} solid ${tokens.colorBrandForeground1}`,
        outlineOffset: `-${tokens.strokeWidthThick}`,
    },
});

function GetCommandDescription(command: SceneExplorerCommand): string {
    return command.hotKey ? `${command.displayName} (${GetCommandHotKeyDescription(command)})` : command.displayName;
}

const ActionCommand: FunctionComponent<{ command: SceneExplorerCommand<"inline", "action"> }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [Icon, execute] = useObservableState(
        useCallback(() => [command.icon, command.execute] as const, [command]),
        command.onChange
    );

    return (
        <Tooltip content={GetCommandDescription(command)} relationship="label" positioning={"after"}>
            <Button icon={<Icon />} appearance="subtle" onClick={() => execute()} />
        </Tooltip>
    );
};

const ToggleCommand: FunctionComponent<{ command: SceneExplorerCommand<"inline", "toggle"> }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [Icon, isEnabled] = useObservableState(
        useCallback(() => [command.icon, command.isEnabled] as const, [command]),
        command.onChange
    );

    // TODO-iv2: Consolidate icon prop passing approach for inspector and shared components
    return (
        <ToggleButton
            appearance="transparent"
            title={GetCommandDescription(command)}
            checkedIcon={Icon as FluentIcon}
            value={isEnabled}
            onChange={(val: boolean) => (command.isEnabled = val)}
        />
    );
};

// This "placeholder" command has a blank icon and is a no-op. It is used for aside
// alignment when some toggle commands are enabled. See more details on the commands
// for setting the aside state.
const PlaceHolderCommand: SceneExplorerCommand<"inline", "action"> = {
    type: "action",
    displayName: "",
    icon: createFluentIcon("Placeholder", "1em", ""),
    execute: () => {
        /* No-op */
    },
};

function MakeInlineCommandElement(command: SceneExplorerCommand<"inline">, isPlaceholder: boolean): JSX.Element {
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
    const [compactMode] = useCompactMode();
    const treeItemLayoutClass = mergeClasses(classes.sceneTreeItemLayout, compactMode ? classes.treeItemLayoutCompact : undefined);

    return (
        <FlatTreeItem
            className={classes.treeItem}
            key="scene"
            value="scene"
            itemType="leaf"
            parentValue={undefined}
            aria-level={1}
            aria-setsize={1}
            aria-posinset={1}
            onClick={select}
        >
            <TreeItemLayout
                iconBefore={<GlobeRegular />}
                className={treeItemLayoutClass}
                style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
            >
                <Body1Strong wrap={false} truncate>
                    Scene
                </Body1Strong>
            </TreeItemLayout>
        </FlatTreeItem>
    );
};

const SectionTreeItem: FunctionComponent<
    {
        scene: Scene;
        section: SectionTreeItemData;
        isFiltering: boolean;
        commandProviders: readonly SceneExplorerCommandProvider<string, "contextMenu">[];
        expandAll: () => void;
        collapseAll: () => void;
        isDropTarget: boolean;
    } & DropProps
> = (props) => {
    const { section, isFiltering, commandProviders, expandAll, collapseAll, isDropTarget, ...dropProps } = props;

    const classes = useStyles();
    const [compactMode] = useCompactMode();

    // Get the commands that apply to this section.
    const commands = useResource(
        useCallback(() => {
            const commands = [...commandProviders].filter((provider) => provider.predicate(section.sectionName)).map((provider) => provider.getCommand(section.sectionName));

            return Object.assign(commands, {
                dispose: () => commands.forEach((command) => command.dispose?.()),
            });
        }, [section.sectionName, commandProviders])
    );

    const hasChildren = section.children.length > 0;

    const [checkedContextMenuItems, onContextMenuCheckedValueChange, contextMenuItems] = useCommandContextMenuState(commands);

    return (
        <Menu openOnContext checkedValues={checkedContextMenuItems} onCheckedValueChange={onContextMenuCheckedValueChange}>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    className={mergeClasses(classes.treeItem, isDropTarget && classes.treeItemDropTarget)}
                    key={section.sectionName}
                    value={section.sectionName}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={!isFiltering && section.children.length > 0 ? "branch" : "leaf"}
                    parentValue={undefined}
                    aria-level={1}
                    aria-setsize={1}
                    aria-posinset={1}
                    {...dropProps}
                >
                    <TreeItemLayout className={mergeClasses(classes.treeItemLayoutBranch, compactMode ? classes.treeItemLayoutCompact : undefined)}>
                        <Body1Strong wrap={false} truncate>
                            {section.sectionName.substring(0, 100)}
                        </Body1Strong>
                    </TreeItemLayout>
                </FlatTreeItem>
            </MenuTrigger>
            <MenuPopover hidden={!hasChildren && commands.length === 0}>
                <MenuList>
                    {hasChildren && (
                        <>
                            <MenuItem onClick={expandAll}>
                                <Body1>Expand All</Body1>
                            </MenuItem>
                            <MenuItem onClick={collapseAll}>
                                <Body1>Collapse All</Body1>
                            </MenuItem>
                        </>
                    )}
                    {hasChildren && commands.length > 0 && <MenuDivider />}
                    {contextMenuItems}
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};

const EntityTreeItem: FunctionComponent<
    {
        scene: Scene;
        entityItem: EntityTreeItemData;
        isSelected: boolean;
        select: () => void;
        isFiltering: boolean;
        commandProviders: readonly SceneExplorerCommandProvider<EntityBase>[];
        expandAll: () => void;
        collapseAll: () => void;
        isDragging: boolean;
        isDropTarget: boolean;
    } & DragDropProps
> = (props) => {
    const { entityItem, isSelected, select, isFiltering, commandProviders, expandAll, collapseAll, isDragging, isDropTarget, ...dragProps } = props;

    const classes = useStyles();
    const [compactMode] = useCompactMode();

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

    const inlineCommands = useMemo(() => commands.filter((command): command is SceneExplorerCommand<"inline"> => command.mode !== "contextMenu"), [commands]);

    // TreeItemLayout actions (totally unrelated to "Action" type commands) are only visible when the item is focused or has pointer hover.
    const actions = useMemo(() => {
        const defaultCommands: SceneExplorerCommand<"inline">[] = [];
        if (hasChildren) {
            defaultCommands.push({
                type: "action",
                displayName: "Expand All",
                icon: () => <ArrowExpandAllRegular />,
                execute: () => expandAll(),
            });
        }

        return [...defaultCommands, ...inlineCommands].map((command) => MakeInlineCommandElement(command, false));
    }, [inlineCommands, hasChildren, expandAll]);

    // TreeItemLayout asides are always visible.
    const [aside, setAside] = useState<readonly JSX.Element[]>([]);

    // This useEffect keeps the aside up-to-date. What should always show is any enabled toggle command, along with
    // placeholders to the right to keep the position of the actions consistent.
    useEffect(() => {
        const updateAside = () => {
            let isAnyCommandEnabled = false;
            const aside: JSX.Element[] = [];
            for (const command of inlineCommands) {
                isAnyCommandEnabled ||= command.type === "toggle" && command.isEnabled;
                if (isAnyCommandEnabled) {
                    aside.push(MakeInlineCommandElement(command, command.type !== "toggle" || !command.isEnabled));
                }
            }
            setAside(aside);
        };

        updateAside();

        const observers = inlineCommands
            .map((command) => command.onChange)
            .filter((onChange) => !!onChange)
            .map((onChange) => onChange.add(updateAside));

        return () => {
            for (const observer of observers) {
                observer.remove();
            }
        };
    }, [inlineCommands]);

    const contextMenuCommands = useMemo(() => commands.filter((command): command is SceneExplorerCommand<"contextMenu"> => command.mode === "contextMenu"), [commands]);

    const [checkedContextMenuItems, onContextMenuCheckedValueChange, contextMenuItems] = useCommandContextMenuState(contextMenuCommands);

    const onKeyDown = useCallback(
        (evt: KeyboardEvent) => {
            const command = commands.find((command) => {
                const hotKey = command.hotKey;
                if (hotKey) {
                    if (
                        evt.code.toLowerCase() === hotKey.keyCode.toLowerCase() &&
                        !!hotKey.control === evt.ctrlKey &&
                        !!hotKey.alt === evt.altKey &&
                        !!hotKey.shift === evt.shiftKey &&
                        !!hotKey.meta === evt.metaKey
                    ) {
                        return true;
                    }
                }
                return false;
            });

            if (command) {
                if (command.type === "action") {
                    command.execute();
                } else {
                    command.isEnabled = !command.isEnabled;
                }
            }
        },
        [commands]
    );

    return (
        <Menu openOnContext checkedValues={checkedContextMenuItems} onCheckedValueChange={onContextMenuCheckedValueChange}>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    className={mergeClasses(classes.treeItem, isDragging && classes.treeItemDragging, isDropTarget && classes.treeItemDropTarget)}
                    key={GetEntityId(entityItem.entity)}
                    value={GetEntityId(entityItem.entity)}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={!isFiltering && hasChildren ? "branch" : "leaf"}
                    parentValue={entityItem.parent.type === "section" ? entityItem.parent.sectionName : GetEntityId(entityItem.parent.entity)}
                    aria-level={entityItem.depth}
                    aria-setsize={1}
                    aria-posinset={1}
                    onClick={select}
                    onKeyDown={onKeyDown}
                    style={{ [treeItemLevelToken]: entityItem.depth }}
                    {...dragProps}
                >
                    <TreeItemLayout
                        iconBefore={entityItem.icon ? <entityItem.icon entity={entityItem.entity} /> : null}
                        className={mergeClasses(
                            hasChildren ? classes.treeItemLayoutBranch : classes.treeItemLayoutLeaf,
                            compactMode ? classes.treeItemLayoutCompact : undefined,
                            isDropTarget && classes.treeItemDropTarget
                        )}
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
            <MenuPopover hidden={!hasChildren && contextMenuCommands.length === 0}>
                <MenuList>
                    {hasChildren && (
                        <>
                            <MenuItem icon={<ArrowExpandAllRegular />} onClick={expandAll}>
                                <Body1>Expand All</Body1>
                            </MenuItem>
                            <MenuItem icon={<ArrowCollapseAllRegular />} onClick={collapseAll}>
                                <Body1>Collapse All</Body1>
                            </MenuItem>
                        </>
                    )}
                    {hasChildren && contextMenuCommands.length > 0 && <MenuDivider />}
                    {contextMenuItems}
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};

export const SceneExplorer: FunctionComponent<{
    sections: readonly SceneExplorerSection<unknown>[];
    entityCommandProviders: readonly SceneExplorerCommandProvider<unknown>[];
    sectionCommandProviders: readonly SceneExplorerCommandProvider<string, "contextMenu">[];
    scene: Scene;
    selectedEntity?: unknown;
    setSelectedEntity?: (entity: unknown) => void;
}> = (props) => {
    const classes = useStyles();

    const { sections, entityCommandProviders, sectionCommandProviders, scene, selectedEntity } = props;

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
    const [isSorted, setIsSorted] = useLocalStorage("Babylon/Settings/SceneExplorer/IsSorted", false);

    // Drag-drop state
    const { draggedEntity, dropTarget, dropTargetIsRoot, createDragProps, createSectionDropProps } = useSceneExplorerDragDrop({
        onDrop: (draggedEntity, targetEntity) => {
            // Expand the target so user can see the dropped item (if not dropping to root)
            if (targetEntity) {
                setOpenItems((prev) => {
                    const next = new Set(prev);
                    next.add(GetEntityId(targetEntity as EntityBase));
                    return next;
                });
            }
            // Select the dragged entity
            setSelectedEntity(draggedEntity);
        },
    });

    useEffect(() => {
        setSceneVersion((version) => version + 1);
    }, [scene]);

    useEffect(() => {
        const onSceneItemAdded = () => {
            setSceneVersion((version) => version + 1);
        };

        const onSceneItemRemoved = (item: unknown) => {
            setSceneVersion((version) => version + 1);

            if (openItems.delete(GetEntityId(item as EntityBase))) {
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
                dragDropConfig: section.dragDropConfig,
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

                allTreeItems.set(GetEntityId(entity), treeItemData);
                return treeItemData;
            };

            const rootEntityTreeItems = rootEntities.map((entity) => createEntityTreeItemData(entity as EntityBase, sectionTreeItem));

            TraverseGraph(
                rootEntityTreeItems,
                // Get children
                (treeItem) => {
                    if (section.getEntityChildren) {
                        const children = section.getEntityChildren(treeItem.entity) as EntityBase[];
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
            traversedItems.push(sectionTreeItem);
            const children = CoerceEntityArray(sectionTreeItem.children, isSorted);
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
                        if (filter || openItems.has(GetEntityId(treeItem.entity))) {
                            if (!treeItem.children) {
                                return null;
                            }
                            return CoerceEntityArray(treeItem.children, isSorted);
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
    }, [sceneTreeItem, sectionTreeItems, allTreeItems, openItems, itemsFilter, isSorted]);

    const getParentStack = useCallback(
        (entity: EntityBase) => {
            const parentStack: TreeItemValue[] = [];
            for (let treeItem = allTreeItems.get(GetEntityId(entity)); treeItem; treeItem = treeItem?.type === "entity" ? treeItem.parent : undefined) {
                parentStack.push(treeItem.type === "entity" ? GetEntityId(treeItem.entity) : treeItem.sectionName);
            }
            // The first item will be the entity itself, so just remove it.
            parentStack.shift();
            return parentStack;
        },
        [allTreeItems]
    );

    const selectEntity = useCallback(
        (selectedEntity: unknown) => {
            const entity = selectedEntity as Nullable<EntityBase>;
            if (entity && entity.uniqueId != undefined) {
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

            previousSelectedEntity.current = selectedEntity;
        },
        [getParentStack, openItems]
    );

    const [isScrollToPending, setIsScrollToPending] = useState(false);

    useEffect(() => {
        if (selectedEntity && selectedEntity !== previousSelectedEntity.current) {
            selectEntity(selectedEntity);
        }
    }, [selectedEntity, selectEntity]);

    useEffect(() => {
        // When the component first mounts, select the currently selected entity to ensure it is visible.
        selectEntity(selectedEntity);
    }, []);

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
            <div className={classes.toolbarDiv}>
                <SearchBox
                    className={classes.searchBox}
                    appearance="underline"
                    contentBefore={<FilterRegular />}
                    placeholder="Filter"
                    value={itemsFilter}
                    onChange={(_, data) => setItemsFilter(data.value)}
                />
                <ToggleButton
                    title="Sort Entities Alphabetically"
                    appearance="transparent"
                    checkedIcon={TextSortAscendingRegular}
                    value={isSorted}
                    onChange={() => setIsSorted((isSorted) => !isSorted)}
                />
            </div>
            <FlatTree className={classes.tree} openItems={openItems} onOpenChange={onOpenChange} aria-label="Scene Explorer Tree">
                <VirtualizerScrollView imperativeRef={scrollViewRef} numItems={visibleItems.length} itemSize={32} container={{ className: classes.scrollView }}>
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
                                    commandProviders={sectionCommandProviders}
                                    expandAll={() => expandAll(item)}
                                    collapseAll={() => collapseAll(item)}
                                    isDropTarget={dropTargetIsRoot && !!item.dragDropConfig}
                                    {...createSectionDropProps(item.dragDropConfig)}
                                />
                            );
                        } else {
                            // Get the section's dragDropConfig for this entity
                            const section = GetEntitySection(item);
                            const getName = () => {
                                const displayInfo = item.getDisplayInfo();
                                const name = displayInfo.name;
                                displayInfo.dispose?.();
                                return name;
                            };
                            const dragProps = createDragProps(item.entity, getName, section.dragDropConfig);

                            return (
                                <EntityTreeItem
                                    key={item.entity.uniqueId}
                                    scene={scene}
                                    entityItem={item}
                                    isSelected={selectedEntity === item.entity}
                                    select={() => setSelectedEntity?.(item.entity)}
                                    isFiltering={!!itemsFilter}
                                    commandProviders={entityCommandProviders as SceneExplorerCommandProvider<EntityBase>[]}
                                    expandAll={() => expandAll(item)}
                                    collapseAll={() => collapseAll(item)}
                                    isDragging={draggedEntity === item.entity}
                                    isDropTarget={dropTarget === item.entity}
                                    {...dragProps}
                                />
                            );
                        }
                    }}
                </VirtualizerScrollView>
            </FlatTree>
        </div>
    );
};
