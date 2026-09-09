import { type ScrollToInterface, VirtualizerScrollView } from "@fluentui-contrib/react-virtualizer";
import {
    type MenuCheckedValueChangeData,
    type MenuCheckedValueChangeEvent,
    type TreeItemValue,
    type TreeItemLayoutProps,
    type TreeOpenChangeData,
    type TreeOpenChangeEvent,
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
    typographyStyles,
    useFluent,
} from "@fluentui/react-components";
import {
    type FluentIcon,
    ArrowCollapseAllRegular,
    ArrowExpandAllRegular,
    ChevronRightRegular,
    createFluentIcon,
    FilterRegular,
    GlobeRegular,
    TextSortAscendingRegular,
    WarningRegular,
} from "@fluentui/react-icons";
import { Fade } from "@fluentui/react-motion-components-preview";
import { type FocusEvent, type FunctionComponent, type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { type IDisposable, type Nullable } from "core/index";
import {
    type ExplorerCommand,
    type ExplorerCommandProvider,
    type ExplorerNode,
    type ExplorerNodeDescription,
    BuildExplorerTree,
    ExpandOrCollapseAll,
    GetAncestorValues,
    GetVisibleExplorerNodes,
} from "./explorerModel";
import { type DragDropProps, type DropProps, useExplorerDragDrop } from "./explorerDragDrop";

import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { CustomTokens } from "shared-ui-components/fluent/primitives/utils";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { useResource } from "shared-ui-components/modularTool/hooks/resourceHooks";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";
import { CompactModeSettingDescriptor } from "../../services/globalSettings";

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
        maxWidth: "none",
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
    rootTreeItemLayout: {
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
    // RootTreeItem supplies the visual root, so its children begin at one indentation level.
    treeItemLayout: {
        paddingLeft: `calc((var(${treeItemLevelToken}, 1) - 1) * ${tokens.spacingHorizontalL})`,
    },
    leadingSlot: {
        width: tokens.spacingHorizontalXXL,
        minWidth: tokens.spacingHorizontalXXL,
        maxWidth: tokens.spacingHorizontalXXL,
        height: tokens.spacingVerticalXXL,
        minHeight: tokens.spacingVerticalXXL,
        maxHeight: tokens.spacingVerticalXXL,
        padding: 0,
        position: "relative",
    },
    leadingLayer: {
        position: "absolute",
        inset: 0,
    },
    leadingIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralForeground2,
        fontSize: tokens.fontSizeBase500,
        lineHeight: tokens.lineHeightBase500,
    },
    leadingChevron: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: tokens.fontSizeBase200,
    },
    leadingChevronOpen: {
        transform: "rotate(90deg)",
    },
    leadingChevronClosedRtl: {
        transform: "rotate(180deg)",
    },
    treeItemDragging: {
        opacity: 0.5,
    },
    treeItemDropTarget: {
        outline: `${tokens.strokeWidthThick} solid ${tokens.colorBrandForeground1}`,
        outlineOffset: `-${tokens.strokeWidthThick}`,
    },
});

const LeadingIconFadeDuration = 50;
const LeadingIconFadeDelay = 25;

function useBranchIconInteraction(enabled: boolean) {
    const [isPointerHovered, setIsPointerHovered] = useState(false);
    const [isKeyboardFocusVisible, setIsKeyboardFocusVisible] = useState(false);

    const onPointerEnter = useCallback(
        (_event: PointerEvent<HTMLDivElement>) => {
            if (enabled) {
                setIsPointerHovered(true);
            }
        },
        [enabled]
    );
    const onPointerLeave = useCallback(
        (_event: PointerEvent<HTMLDivElement>) => {
            if (enabled) {
                setIsPointerHovered(false);
            }
        },
        [enabled]
    );
    const onFocus = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            if (enabled && event.currentTarget === event.target) {
                setIsKeyboardFocusVisible(event.currentTarget.matches(":focus-visible") || event.currentTarget.hasAttribute("data-fui-focus-visible"));
            }
        },
        [enabled]
    );
    const onBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            if (enabled && event.currentTarget === event.target) {
                setIsKeyboardFocusVisible(false);
            }
        },
        [enabled]
    );

    return {
        showChevron: enabled && (isPointerHovered || isKeyboardFocusVisible),
        treeItemInteractionProps: {
            onPointerEnter,
            onPointerLeave,
            onFocus,
            onBlur,
        },
    };
}

type ExplorerTreeItemLayoutProps = Omit<TreeItemLayoutProps, "expandIcon"> & {
    isBranch: boolean;
    isOpen: boolean;
    icon?: ReactNode;
    showChevron: boolean;
    select?: () => void;
};

const ExplorerTreeItemLayout: FunctionComponent<ExplorerTreeItemLayoutProps> = (props) => {
    const { isBranch, isOpen, icon, showChevron, select, ...layoutProps } = props;
    const classes = useStyles();
    const { dir } = useFluent();
    const hasIcon = !!icon;
    const chevron = (
        <div className={mergeClasses(classes.leadingChevron, isOpen ? classes.leadingChevronOpen : dir === "rtl" && classes.leadingChevronClosedRtl)}>
            <ChevronRightRegular />
        </div>
    );

    return (
        <TreeItemLayout
            {...layoutProps}
            expandIcon={{
                className: classes.leadingSlot,
                onClick: isBranch ? undefined : select,
                children:
                    isBranch && hasIcon ? (
                        <>
                            <Fade visible={!showChevron} duration={LeadingIconFadeDuration} delay={LeadingIconFadeDelay} exitDelay={0} easing="linear">
                                <div className={mergeClasses(classes.leadingLayer, classes.leadingIcon)}>{icon}</div>
                            </Fade>
                            <Fade visible={showChevron} duration={LeadingIconFadeDuration} delay={LeadingIconFadeDelay} exitDelay={0} easing="linear">
                                <div
                                    className={mergeClasses(
                                        classes.leadingLayer,
                                        classes.leadingChevron,
                                        isOpen ? classes.leadingChevronOpen : dir === "rtl" && classes.leadingChevronClosedRtl
                                    )}
                                >
                                    <ChevronRightRegular />
                                </div>
                            </Fade>
                        </>
                    ) : hasIcon ? (
                        <div className={classes.leadingIcon}>{icon}</div>
                    ) : isBranch ? (
                        chevron
                    ) : undefined,
            }}
        />
    );
};

function GetCommandHotKeyDescription(command: ExplorerCommand): string {
    if (!command.hotKey) {
        return "";
    }
    const hotKey = command.hotKey;
    return `${hotKey.control ? "Ctrl+" : ""}${hotKey.alt ? "Alt+" : ""}${hotKey.shift ? "Shift+" : ""}${hotKey.meta ? "Meta+" : ""}${hotKey.keyCode}`;
}

function GetCommandDescription(command: ExplorerCommand): string {
    return command.hotKey ? `${command.displayName} (${GetCommandHotKeyDescription(command)})` : command.displayName;
}

function useCommandContextMenuState(commands: readonly ExplorerCommand<"contextMenu">[]) {
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

const useTruncatingBody1Styles = makeStyles({
    container: {
        display: "block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        ...typographyStyles.body1,
    },
});

const TruncatingBody1: FunctionComponent<{ text: string }> = (props) => {
    const { text } = props;
    const classes = useTruncatingBody1Styles();
    const ref = useRef<HTMLSpanElement | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return undefined;
        }

        const update = () => {
            setIsTruncated(element.scrollWidth > element.clientWidth);
        };

        update();

        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [text]);

    return (
        <Tooltip content={text} positioning="after" relationship="description" visible={isTruncated && isHovered} onVisibleChange={(_, data) => setIsHovered(data.visible)}>
            {/*
              Body1 isn't used here: it doesn't forward refs (so we can't measure the rendered element)
              and it reapplies its own white-space styling that overrides ours when wrapped, which would
              break truncation for names containing spaces. Instead, render a single ref'd <span> styled
              with Fluent typography tokens so we get the same look while keeping full control over
              truncation and overflow measurement.
            */}
            <span ref={ref} className={classes.container}>
                {text}
            </span>
        </Tooltip>
    );
};

const ActionCommand: FunctionComponent<{ command: ExplorerCommand<"inline", "action"> }> = (props) => {
    const { command } = props;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [Icon, execute] = useObservableState(
        useCallback(() => [command.icon, command.execute] as const, [command]),
        command.onChange
    );

    return (
        <Tooltip content={GetCommandDescription(command)} relationship="label" positioning="after">
            <Button icon={<Icon />} appearance="subtle" onClick={() => execute()} />
        </Tooltip>
    );
};

const ToggleCommand: FunctionComponent<{ command: ExplorerCommand<"inline", "toggle"> }> = (props) => {
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
            titlePositioning="after"
            checkedIcon={Icon as FluentIcon}
            value={isEnabled}
            onChange={(val: boolean) => (command.isEnabled = val)}
        />
    );
};

// This "placeholder" command has a blank icon and is a no-op. It is used for aside
// alignment when some toggle commands are enabled. See more details on the commands
// for setting the aside state.
const PlaceHolderCommand: ExplorerCommand<"inline", "action"> = {
    type: "action",
    displayName: "",
    icon: createFluentIcon("Placeholder", "1em", ""),
    execute: () => {
        /* No-op */
    },
};

function MakeInlineCommandElement(command: ExplorerCommand<"inline">, isPlaceholder: boolean): JSX.Element {
    if (isPlaceholder) {
        // Placeholders are not visible and not interacted with, so they are always ActionCommand
        // components, just to ensure the exact right amount of space is taken up.
        return <ActionCommand key={command.displayName} command={PlaceHolderCommand} />;
    }

    return command.type === "action" ? <ActionCommand key={command.displayName} command={command} /> : <ToggleCommand key={command.displayName} command={command} />;
}

/**
 * Resolves the (possibly live) display info for a node.
 * @param node The node to resolve the display info for.
 * @returns The display info, guaranteed to have a dispose function.
 */
function useNodeDisplayInfo(node: ExplorerNode) {
    return useResource(
        useCallback(() => {
            const displayInfo = node.getDisplayInfo();
            if (!displayInfo.dispose) {
                displayInfo.dispose = () => {
                    /* No-op */
                };
            }
            return displayInfo as typeof displayInfo & IDisposable;
        }, [node])
    );
}

const RootTreeItem: FunctionComponent<{
    node: ExplorerNode;
    isSelected: boolean;
    isOpen: boolean;
    select?: () => void;
    isFiltering: boolean;
    expandAll: () => void;
    collapseAll: () => void;
}> = (props) => {
    const { node, isSelected, isOpen, select, isFiltering, expandAll, collapseAll } = props;

    const classes = useStyles();
    const [compactMode] = useSetting(CompactModeSettingDescriptor);
    const treeItemLayoutClass = mergeClasses(classes.rootTreeItemLayout, compactMode ? classes.treeItemLayoutCompact : undefined);

    const displayInfo = useNodeDisplayInfo(node);
    const name = useObservableState(() => displayInfo.name, displayInfo.onChange);
    const hasChildren = node.children.length > 0;
    const isBranch = !isFiltering && hasChildren;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Icon = node.icon;
    const icon = Icon && node.entity ? <Icon entity={node.entity} /> : <GlobeRegular />;
    const { showChevron, treeItemInteractionProps } = useBranchIconInteraction(isBranch && !!icon);
    const actions = useMemo(
        () =>
            hasChildren
                ? [
                      MakeInlineCommandElement(
                          {
                              type: "action",
                              displayName: "Expand All",
                              icon: () => <ArrowExpandAllRegular />,
                              execute: expandAll,
                          },
                          false
                      ),
                  ]
                : [],
        [hasChildren, expandAll]
    );

    return (
        <Menu openOnContext>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    className={classes.treeItem}
                    key={node.value}
                    value={node.value}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={isBranch ? "branch" : "leaf"}
                    parentValue={node.parent?.value}
                    aria-level={node.depth}
                    aria-setsize={1}
                    aria-posinset={1}
                    onClick={select}
                    {...treeItemInteractionProps}
                >
                    <ExplorerTreeItemLayout
                        isBranch={isBranch}
                        isOpen={isOpen}
                        icon={icon}
                        showChevron={showChevron}
                        select={select}
                        className={treeItemLayoutClass}
                        style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                        actions={{ children: actions }}
                    >
                        <Body1Strong wrap={false} truncate>
                            {name}
                        </Body1Strong>
                    </ExplorerTreeItemLayout>
                </FlatTreeItem>
            </MenuTrigger>
            <MenuPopover hidden={!hasChildren}>
                <MenuList>
                    <MenuItem icon={<ArrowExpandAllRegular />} onClick={expandAll}>
                        <Body1>Expand All</Body1>
                    </MenuItem>
                    <MenuItem icon={<ArrowCollapseAllRegular />} onClick={collapseAll}>
                        <Body1>Collapse All</Body1>
                    </MenuItem>
                </MenuList>
            </MenuPopover>
        </Menu>
    );
};

const GroupTreeItem: FunctionComponent<
    {
        node: ExplorerNode;
        isFiltering: boolean;
        commandProviders: readonly ExplorerCommandProvider<string, "contextMenu">[];
        expandAll: () => void;
        collapseAll: () => void;
        isSelected: boolean;
        isOpen: boolean;
        select?: () => void;
        isDropTarget: boolean;
    } & DropProps
> = (props) => {
    const { node, isFiltering, commandProviders, expandAll, collapseAll, isSelected, isOpen, select, isDropTarget, ...dropProps } = props;

    const classes = useStyles();
    const [compactMode] = useSetting(CompactModeSettingDescriptor);

    const displayInfo = useNodeDisplayInfo(node);
    const name = useObservableState(() => displayInfo.name, displayInfo.onChange);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Icon = node.icon;

    // Get the commands that apply to this group.
    const commands = useResource(
        useCallback(() => {
            const commands = [...commandProviders].filter((provider) => provider.predicate(name)).map((provider) => provider.getCommand(name));

            return Object.assign(commands, {
                dispose: () => commands.forEach((command) => command.dispose?.()),
            });
        }, [name, commandProviders])
    );

    const hasChildren = node.children.length > 0;
    const isBranch = !isFiltering && hasChildren;
    const icon = Icon && node.entity ? <Icon entity={node.entity} /> : undefined;
    const { showChevron, treeItemInteractionProps } = useBranchIconInteraction(isBranch && !!icon);

    const [checkedContextMenuItems, onContextMenuCheckedValueChange, contextMenuItems] = useCommandContextMenuState(commands);

    return (
        <Menu openOnContext checkedValues={checkedContextMenuItems} onCheckedValueChange={onContextMenuCheckedValueChange}>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    className={mergeClasses(classes.treeItem, isDropTarget && classes.treeItemDropTarget)}
                    key={node.value}
                    value={node.value}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={isBranch ? "branch" : "leaf"}
                    parentValue={node.parent?.value}
                    aria-level={node.depth}
                    aria-setsize={1}
                    aria-posinset={1}
                    onClick={select}
                    style={{ [treeItemLevelToken]: node.depth }}
                    {...dropProps}
                    {...treeItemInteractionProps}
                >
                    <ExplorerTreeItemLayout
                        isBranch={isBranch}
                        isOpen={isOpen}
                        icon={icon}
                        showChevron={showChevron}
                        select={select}
                        className={mergeClasses(classes.treeItemLayout, compactMode ? classes.treeItemLayoutCompact : undefined)}
                        style={isSelected ? { backgroundColor: tokens.colorNeutralBackground1Selected } : undefined}
                    >
                        <Body1Strong wrap={false} truncate>
                            {name.substring(0, 100)}
                        </Body1Strong>
                    </ExplorerTreeItemLayout>
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

const ItemTreeItem: FunctionComponent<
    {
        node: ExplorerNode;
        entity: object;
        isSelected: boolean;
        select: () => void;
        isFiltering: boolean;
        commandProviders: readonly ExplorerCommandProvider<object>[];
        expandAll: () => void;
        collapseAll: () => void;
        isDragging: boolean;
        isDropTarget: boolean;
        isOpen: boolean;
    } & DragDropProps
> = (props) => {
    const { node, entity, isSelected, select, isFiltering, commandProviders, expandAll, collapseAll, isDragging, isDropTarget, isOpen, ...dragProps } = props;

    const classes = useStyles();
    const [compactMode] = useSetting(CompactModeSettingDescriptor);

    const hasChildren = node.children.length > 0;
    const isBranch = !isFiltering && hasChildren;

    const displayInfo = useNodeDisplayInfo(node);

    const name = useObservableState(() => displayInfo.name, displayInfo.onChange);

    // Get the commands that apply to this entity.
    const commands = useResource(
        useCallback(() => {
            const commands: readonly ExplorerCommand[] = [...commandProviders]
                .filter((provider) => provider.predicate(entity))
                .map((provider) => {
                    return {
                        order: provider.order,
                        command: provider.getCommand(entity),
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
        }, [entity, commandProviders])
    );

    const inlineCommands = useMemo(() => commands.filter((command): command is ExplorerCommand<"inline"> => command.mode !== "contextMenu"), [commands]);

    // TreeItemLayout actions (totally unrelated to "Action" type commands) are only visible when the item is focused or has pointer hover.
    const actions = useMemo(() => {
        const defaultCommands: ExplorerCommand<"inline">[] = [];
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

    const contextMenuCommands = useMemo(() => commands.filter((command): command is ExplorerCommand<"contextMenu"> => command.mode === "contextMenu"), [commands]);

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

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const Icon = node.icon;
    const icon = displayInfo.validationError ? (
        <Tooltip content={displayInfo.validationError} relationship="description">
            <WarningRegular />
        </Tooltip>
    ) : Icon ? (
        <Icon entity={entity} />
    ) : null;
    const { showChevron, treeItemInteractionProps } = useBranchIconInteraction(isBranch && !!icon);

    return (
        <Menu openOnContext checkedValues={checkedContextMenuItems} onCheckedValueChange={onContextMenuCheckedValueChange}>
            <MenuTrigger disableButtonEnhancement>
                <FlatTreeItem
                    className={mergeClasses(classes.treeItem, isDragging && classes.treeItemDragging, isDropTarget && classes.treeItemDropTarget)}
                    key={node.value}
                    value={node.value}
                    // Disable manual expand/collapse when a filter is active.
                    itemType={isBranch ? "branch" : "leaf"}
                    parentValue={node.parent?.value}
                    aria-level={node.depth}
                    aria-setsize={1}
                    aria-posinset={1}
                    onClick={select}
                    onKeyDown={onKeyDown}
                    style={{ [treeItemLevelToken]: node.depth }}
                    {...dragProps}
                    {...treeItemInteractionProps}
                >
                    <ExplorerTreeItemLayout
                        isBranch={isBranch}
                        isOpen={isOpen}
                        icon={icon}
                        showChevron={showChevron}
                        select={select}
                        className={mergeClasses(classes.treeItemLayout, compactMode ? classes.treeItemLayoutCompact : undefined, isDropTarget && classes.treeItemDropTarget)}
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
                        <TruncatingBody1 text={name} />
                    </ExplorerTreeItemLayout>
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

/**
 * A generic, recursive tree explorer.
 *
 * The Explorer is intentionally product agnostic: it renders whatever hierarchy is described by the
 * {@link ExplorerNodeDescription}s returned from `getNodes`, which means nodes of different kinds backed by
 * completely unrelated entity types can be arbitrarily nested within each other.
 * @param props The props describing the hierarchy to render, the available commands, and the selection state.
 * @returns The explorer tree component.
 */
export const Explorer: FunctionComponent<{
    /**
     * Enumerates the top level nodes of the tree. This is re-invoked whenever the tree needs to be rebuilt
     * (e.g. when one of the change observables of the described nodes fires), so it should always reflect
     * the current state of the hierarchy. It must be referentially stable (e.g. wrapped in `useCallback`).
     */
    getNodes: () => readonly ExplorerNodeDescription[];

    /**
     * Command providers for nodes that represent an entity.
     */
    itemCommandProviders: readonly ExplorerCommandProvider<object>[];

    /**
     * Command providers for group nodes. The provider context is the group's display name.
     */
    groupCommandProviders: readonly ExplorerCommandProvider<string, "contextMenu">[];

    /**
     * The currently selected entity.
     */
    selectedEntity?: Nullable<object>;

    /**
     * Called when the selected entity changes.
     */
    setSelectedEntity?: (entity: Nullable<object>) => void;

    /**
     * The accessible label of the tree.
     */
    ariaLabel?: string;
}> = (props) => {
    const classes = useStyles();

    const { getNodes, itemCommandProviders, groupCommandProviders, selectedEntity = null, ariaLabel = "Scene Explorer Tree" } = props;

    const [treeVersion, setTreeVersion] = useState(0);
    const tree = useMemo(() => BuildExplorerTree(getNodes()), [getNodes, treeVersion]);
    const previousTreeRef = useRef(tree);
    const initialRootValues = tree.nodes.filter((node) => node.kind === "root").map((node) => node.value);
    const initializedRootValues = useRef(new Set(initialRootValues));
    const [openItems, setOpenItems] = useState(new Set<TreeItemValue>(initialRootValues));
    const scrollViewRef = useRef<ScrollToInterface>(null);
    // We only want to scroll to the selected item if it was externally selected (outside of the Explorer).
    const previousSelectedEntity = useRef(selectedEntity);
    const setSelectedEntity = useCallback(
        (entity: Nullable<object>) => {
            previousSelectedEntity.current = entity;
            props.setSelectedEntity?.(entity);
        },
        [props.setSelectedEntity]
    );

    const [itemsFilter, setItemsFilter] = useState("");
    const [isSorted, setIsSorted] = useSetting({ key: "SceneExplorer/IsSorted", defaultValue: false });

    // Drag-drop state
    const { draggedEntity, dropTarget, dropTargetIsRoot, createDragProps, createGroupDropProps } = useExplorerDragDrop({
        onDrop: (draggedEntity, targetEntity) => {
            // Expand the target so user can see the dropped item (if not dropping to root)
            if (targetEntity) {
                setOpenItems((prev) => {
                    const next = new Set(prev);
                    for (const node of tree.nodesByEntity.get(targetEntity) ?? []) {
                        next.add(node.value);
                    }
                    return next;
                });
            }
            // Select the dragged entity
            setSelectedEntity(draggedEntity);
        },
    });

    useEffect(() => {
        const previousTree = previousTreeRef.current;
        previousTreeRef.current = tree;
        if (selectedEntity && previousTree?.nodesByEntity.has(selectedEntity) && !tree.nodesByEntity.has(selectedEntity)) {
            setSelectedEntity(null);
        }
    }, [tree, selectedEntity, setSelectedEntity]);

    useEffect(() => {
        setOpenItems((currentOpenItems) => {
            let updatedOpenItems: Set<TreeItemValue> | undefined;
            for (const node of tree.nodes) {
                if (node.kind === "root" && !initializedRootValues.current.has(node.value)) {
                    initializedRootValues.current.add(node.value);
                    updatedOpenItems ??= new Set(currentOpenItems);
                    updatedOpenItems.add(node.value);
                }
            }
            return updatedOpenItems ?? currentOpenItems;
        });
    }, [tree]);

    useEffect(() => {
        const onItemAdded = () => {
            setTreeVersion((version) => version + 1);
        };

        const onItemRemoved = (item: object) => {
            setTreeVersion((version) => version + 1);

            const itemNodes = tree.nodesByEntity.get(item);
            if (itemNodes?.length === 1 && openItems.delete(itemNodes[0].value)) {
                setOpenItems(new Set(openItems));
            }
        };

        const addObservers = tree.changeObservables.added.map((observable) => observable.add(onItemAdded));
        const removeObservers = tree.changeObservables.removed.map((observable) => observable.add(onItemRemoved));
        const moveObservers = tree.changeObservables.moved.map((observable) => observable.add(onItemAdded));

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
    }, [tree, openItems]);

    const visibleNodes = useMemo(
        () => GetVisibleExplorerNodes(tree.nodes, { openItems, filter: itemsFilter.toLocaleLowerCase(), sortItems: isSorted }),
        [tree, openItems, itemsFilter, isSorted]
    );

    const selectEntity = useCallback(
        (entity: Nullable<object>) => {
            if (entity) {
                const ancestorValues = GetAncestorValues(tree, entity);
                if (ancestorValues.length > 0) {
                    const newOpenItems = new Set<TreeItemValue>(openItems);
                    for (const ancestorValue of ancestorValues) {
                        newOpenItems.add(ancestorValue);
                    }
                    setOpenItems(newOpenItems);
                }

                if (tree.nodesByEntity.has(entity)) {
                    setIsScrollToPending(true);
                }
            }

            previousSelectedEntity.current = entity;
        },
        [tree, openItems]
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
            const selectedItemIndex = visibleNodes.findIndex((node) => node.entity === selectedEntity);
            if (selectedItemIndex >= 0 && scrollViewRef.current) {
                scrollViewRef.current.scrollTo(selectedItemIndex, "smooth");
                setIsScrollToPending(false);
            }
        }
    }, [isScrollToPending, selectedEntity, visibleNodes]);

    const onOpenChange = useCallback(
        (event: TreeOpenChangeEvent, data: TreeOpenChangeData) => {
            // This makes it so we only consider a click on the chevron to be expanding/collapsing an item, not clicking anywhere on the item.
            if (data.type !== "Click" && data.type !== "Enter") {
                // Shift or Ctrl mean expand/collapse all descendants.
                if (event.shiftKey || event.ctrlKey) {
                    const node = tree.nodesByValue.get(data.value);
                    if (node) {
                        ExpandOrCollapseAll(node, data.open, data.openItems);
                    }
                }
                setOpenItems(data.openItems);
            }
        },
        [setOpenItems, tree]
    );

    const expandAll = (node: ExplorerNode) => {
        ExpandOrCollapseAll(node, true, openItems);
        setOpenItems(new Set(openItems));
    };

    const collapseAll = (node: ExplorerNode) => {
        ExpandOrCollapseAll(node, false, openItems);
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
            <FlatTree className={classes.tree} openItems={openItems} onOpenChange={onOpenChange} aria-label={ariaLabel}>
                <VirtualizerScrollView imperativeRef={scrollViewRef} numItems={visibleNodes.length} itemSize={32} container={{ className: classes.scrollView }}>
                    {(index: number) => {
                        const node = visibleNodes[index];
                        const entity = node.entity;

                        if (node.kind === "root") {
                            return (
                                <RootTreeItem
                                    key={node.value}
                                    node={node}
                                    isSelected={!!entity && selectedEntity === entity}
                                    isOpen={openItems.has(node.value)}
                                    select={entity ? () => setSelectedEntity(entity) : undefined}
                                    isFiltering={!!itemsFilter}
                                    expandAll={() => expandAll(node)}
                                    collapseAll={() => collapseAll(node)}
                                />
                            );
                        } else if (node.kind === "item" && entity) {
                            const getName = () => {
                                const displayInfo = node.getDisplayInfo();
                                const name = displayInfo.name;
                                displayInfo.dispose?.();
                                return name;
                            };
                            const dragProps = createDragProps(entity, getName, node.dragDropConfig);

                            return (
                                <ItemTreeItem
                                    key={node.value}
                                    node={node}
                                    entity={entity}
                                    isSelected={selectedEntity === entity}
                                    select={() => setSelectedEntity(entity)}
                                    isFiltering={!!itemsFilter}
                                    commandProviders={itemCommandProviders}
                                    expandAll={() => expandAll(node)}
                                    collapseAll={() => collapseAll(node)}
                                    isDragging={draggedEntity === entity}
                                    isDropTarget={dropTarget === entity}
                                    isOpen={openItems.has(node.value)}
                                    {...dragProps}
                                />
                            );
                        } else {
                            return (
                                <GroupTreeItem
                                    key={node.value}
                                    node={node}
                                    isFiltering={!!itemsFilter}
                                    commandProviders={groupCommandProviders}
                                    expandAll={() => expandAll(node)}
                                    collapseAll={() => collapseAll(node)}
                                    isSelected={!!entity && selectedEntity === entity}
                                    isOpen={openItems.has(node.value)}
                                    select={entity ? () => setSelectedEntity(entity) : undefined}
                                    isDropTarget={dropTargetIsRoot && !!node.dragDropConfig}
                                    {...createGroupDropProps(node.dragDropConfig)}
                                />
                            );
                        }
                    }}
                </VirtualizerScrollView>
            </FlatTree>
        </div>
    );
};
