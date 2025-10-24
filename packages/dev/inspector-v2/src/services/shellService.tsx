import type { MenuTriggerProps } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";

import type { IDisposable } from "core/index";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";

import {
    Button,
    Divider,
    Toolbar as FluentToolbar,
    makeStyles,
    Menu,
    MenuGroup,
    MenuGroupHeader,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    mergeClasses,
    Portal,
    Subtitle2Stronger,
    tokens,
    ToolbarRadioButton,
    Tooltip,
} from "@fluentui/react-components";
import {
    LayoutColumnTwoFocusLeftFilled,
    LayoutColumnTwoFocusRightFilled,
    LayoutColumnTwoSplitLeftFocusBottomLeftFilled,
    LayoutColumnTwoSplitLeftFocusTopLeftFilled,
    LayoutColumnTwoSplitRightFocusBottomRightFilled,
    LayoutColumnTwoSplitRightFocusTopRightFilled,
    MoreHorizontalRegular,
    PanelLeftContractRegular,
    PanelLeftExpandRegular,
    PanelRightContractRegular,
    PanelRightExpandRegular,
} from "@fluentui/react-icons";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Observable } from "core/Misc/observable";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { TeachingMoment } from "../components/teachingMoment";
import { Theme } from "../components/theme";
import { useOrderedObservableCollection } from "../hooks/observableHooks";
import { useSidePaneDockOverrides } from "../hooks/settingsHooks";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { useResizeHandle } from "../hooks/useResizeHandle";
import { ObservableCollection } from "../misc/observableCollection";

export type HorizontalLocation = "left" | "right";
export type VerticalLocation = "top" | "bottom";

type DockLocation = `${VerticalLocation}-${HorizontalLocation}` | `full-${HorizontalLocation}`;

/**
 * Describes an item that can be added to one of the shell's toolbars.
 */
export type ToolbarItemDefinition = {
    /**
     * A unique key for the toolbar item.
     */
    key: string;

    /**
     * The component to render for the toolbar item.
     */
    component: ComponentType;

    /**
     * An optional order for the toolbar item, relative to other items.
     * Defaults to 0.
     */
    order?: number;

    /**
     * The horizontal location of the toolbar item.
     * Can be either "left" or "right".
     * In "compact" toolbar mode, "left" and "right" mean the "compact" toolbars at the top/bottom of the left/right side panes.
     * In "full" toolbar mode, "left" and "right" mean the left side and right side of the full width toolbars above/below the side panes.
     */
    horizontalLocation: HorizontalLocation;

    /**
     * The vertical location of the toolbar item.
     * Can be either "top" or "bottom".
     */
    verticalLocation: VerticalLocation;

    /**
     * An optional display name for the toolbar item, used for teaching moments, tooltips, etc.
     */
    displayName?: string;

    /**
     * An optional flag to suppress the teaching moment for this toolbar item.
     * Defaults to false.
     * Teaching moments are more helpful for dynamically added items, possibly from extensions.
     */
    suppressTeachingMoment?: boolean;
};

/**
 * Describes a side pane that can be added to the shell's left or right side.
 */
export type SidePaneDefinition = {
    /**
     * A unique key for the side pane.
     */
    key: string;

    /**
     * An icon component to render for the pane tab.
     */
    icon: ComponentType;

    /**
     * The component to render for the side pane's content.
     */
    content: ComponentType;

    /**
     * An optional order for the side pane, relative to other panes.
     * Defaults to 0.
     */
    order?: number;

    /**
     * The horizontal location of the side pane.
     * Can be either "left" or "right".
     */
    horizontalLocation: HorizontalLocation;

    /**
     * The vertical location of the side pane.
     * Can be either "top" or "bottom".
     */
    verticalLocation: VerticalLocation;

    /**
     * The title of the side pane, displayed as a standardized header at the top of the pane.
     */
    title: string;

    /**
     * An optional flag to suppress the teaching moment for this side pane.
     * Defaults to false.
     * Teaching moments are more helpful for dynamically added panes, possibly from extensions.
     */
    suppressTeachingMoment?: boolean;
};

type SidePaneEntry = SidePaneDefinition & {
    container: HTMLElement;
};

type RegisteredSidePane = {
    key: string;
    select(): void;
};

/**
 * Describes content that can be added to the shell's central area (between the side panes and toolbars - e.g. the main content).
 */
export type CentralContentDefinition = {
    /**
     * A unique key for the central content.
     */
    key: string;

    /**
     * The component to render for the central content.
     */
    component: ComponentType;

    /**
     * An optional order for content, relative to other central content.
     * Defaults to 0.
     */
    order?: number;
};

export const RootComponentServiceIdentity = Symbol("RootComponent");

/**
 * Exposes a top level component that should be rendered as the React root.
 */
export interface IRootComponentService extends IService<typeof RootComponentServiceIdentity> {
    /**
     * The root component that should be rendered as the React root.
     */
    readonly rootComponent: ComponentType;
}

export const ShellServiceIdentity = Symbol("ShellService");

/**
 * Provides a shell for the application, including toolbars, side panes, and central content.
 * This service allows adding toolbar items, side panes, and central content dynamically.
 */
export interface IShellService extends IService<typeof ShellServiceIdentity> {
    /**
     * Adds a new item to one of the shell's toolbars.
     * @param item Defines the item to add.
     */
    addToolbarItem(item: Readonly<ToolbarItemDefinition>): IDisposable;

    /**
     * Adds a new side pane to the shell.
     * @param pane Defines the side pane to add.
     */
    addSidePane(pane: Readonly<SidePaneDefinition>): IDisposable;

    /**
     * Adds new central content to the shell.
     * @param content Defines the content area to add.
     */
    addCentralContent(content: Readonly<CentralContentDefinition>): IDisposable;

    /**
     * Resets the side pane layout to the default configuration.
     */
    resetSidePaneLayout(): void;

    /**
     * The side panes currently present in the shell.
     */
    readonly sidePanes: readonly RegisteredSidePane[];
}

type ToolbarMode = "full" | "compact";

/**
 * Options for configuring the shell service.
 */
export type ShellServiceOptions = {
    /**
     * The default width of the left side pane.
     */
    leftPaneDefaultWidth?: number;

    /**
     * The minimum width of the left side pane.
     */
    leftPaneMinWidth?: number;

    /**
     * The default width of the right side pane.
     */
    rightPaneDefaultWidth?: number;

    /**
     * The minimum width of the right side pane.
     */
    rightPaneMinWidth?: number;

    /**
     * The mode of the toolbars.
     * Can be either "full" (default) or "compact".
     * In "full" mode, toolbars are displayed above and below the side panes.
     * In "compact" mode, toolbars are displayed at the top and bottom of the left and right side panes.
     */
    toolbarMode?: ToolbarMode;

    /**
     * A function that can remap the default location of side panes.
     * @param sidePane The side pane to remap.
     * @returns The new location for the side pane.
     */
    sidePaneRemapper?: (sidePane: Readonly<SidePaneDefinition>) => { horizontalLocation: HorizontalLocation; verticalLocation: VerticalLocation };
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    mainView: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    verticallyCentralContent: {
        flexGrow: 1,
        display: "flex",
        overflow: "hidden",
    },
    barDiv: {
        display: "flex",
        flexDirection: "row",
        flex: "0 0 auto",
        height: "36px",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    bar: {
        display: "flex",
        flex: "1",
        height: "32px",
        overflow: "hidden",
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXXS}`,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderBottomWidth: 0,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    barTop: {
        borderTopWidth: 0,
    },
    barLeft: {
        marginRight: "auto",
        display: "flex",
        alignItems: "center",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalSNudge,
    },
    barRight: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        flexDirection: "row-reverse",
        columnGap: tokens.spacingHorizontalSNudge,
    },
    barItem: {
        display: "flex",
    },
    paneTabListDiv: {
        backgroundColor: tokens.colorNeutralBackground2,
        flex: "0 0 auto",
        display: "flex",
    },
    paneTabListDivLeft: {
        flexDirection: "row-reverse",
    },
    paneTabListDivRight: {
        flexDirection: "row",
    },
    paneCollapseButton: {
        margin: `0 ${tokens.spacingHorizontalSNudge}`,
    },
    pane: {
        backgroundColor: tokens.colorNeutralBackground2,
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
    },
    paneLeft: {
        flexDirection: "row",
    },
    paneRight: {
        flexDirection: "row-reverse",
    },
    paneContainer: {
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "hidden",
    },
    paneContent: {
        display: "flex",
        flexGrow: 1,
        flexDirection: "column",
        overflow: "hidden",
    },
    paneHeaderDiv: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        height: "36px",
    },
    paneHeaderText: {
        flex: 1,
        marginLeft: tokens.spacingHorizontalM,
    },
    paneHeaderButton: {
        color: "inherit",
    },
    paneDivider: {
        flex: "0 0 auto",
        marginTop: tokens.spacingVerticalM,
        margin: "0",
        minHeight: tokens.spacingVerticalM,
        cursor: "ns-resize",
        alignItems: "end",
    },
    tabToolbar: {
        padding: 0,
    },
    tab: {
        display: "flex",
        height: "100%",
        width: "36px",
        justifyContent: "center",
        borderTopLeftRadius: tokens.borderRadiusMedium,
        borderTopRightRadius: tokens.borderRadiusMedium,
    },
    unselectedTab: {
        backgroundColor: "transparent",
    },
    tabRadioButton: {
        backgroundColor: "transparent",
    },
    selectedTabIcon: {
        color: tokens.colorNeutralForeground1,
    },
    resizer: {
        width: "8px",
        cursor: "ew-resize",
        zIndex: 1000,
    },
    resizerLeft: {
        marginRight: "-8px",
        transform: "translateX(-8px)",
    },
    resizerRight: {
        marginLeft: "-8px",
        transform: "translateX(8px)",
    },
    centralContent: {
        position: "relative",
        flexGrow: 1,
        display: "flex",
        overflow: "hidden",
    },
});

const DockMenu: FunctionComponent<
    Pick<MenuTriggerProps, "children"> & { openOnContext?: boolean; sidePaneId: string; dockOptions: Map<DockLocation, (sidePaneKey: string) => void> }
> = (props) => {
    const { openOnContext, sidePaneId, dockOptions, children } = props;

    const dockLeft = dockOptions.get("full-left");
    const dockTopLeft = dockOptions.get("top-left");
    const dockBottomLeft = dockOptions.get("bottom-left");
    const dockRight = dockOptions.get("full-right");
    const dockTopRight = dockOptions.get("top-right");
    const dockBottomRight = dockOptions.get("bottom-right");

    return (
        <Menu openOnContext={openOnContext}>
            <MenuTrigger disableButtonEnhancement>{children}</MenuTrigger>
            <Theme>
                <MenuPopover>
                    <MenuList>
                        <MenuGroup>
                            <MenuGroupHeader>Dock</MenuGroupHeader>
                            {dockLeft && (
                                <MenuItem icon={<LayoutColumnTwoFocusLeftFilled />} onClick={() => dockLeft(sidePaneId)}>
                                    Left
                                </MenuItem>
                            )}
                            {dockTopLeft && (
                                <MenuItem icon={<LayoutColumnTwoSplitLeftFocusTopLeftFilled />} onClick={() => dockTopLeft(sidePaneId)}>
                                    Top Left
                                </MenuItem>
                            )}
                            {dockBottomLeft && (
                                <MenuItem icon={<LayoutColumnTwoSplitLeftFocusBottomLeftFilled />} onClick={() => dockBottomLeft(sidePaneId)}>
                                    Bottom Left
                                </MenuItem>
                            )}
                            {dockRight && (
                                <MenuItem icon={<LayoutColumnTwoFocusRightFilled />} onClick={() => dockRight(sidePaneId)}>
                                    Right
                                </MenuItem>
                            )}
                            {dockTopRight && (
                                <MenuItem icon={<LayoutColumnTwoSplitRightFocusTopRightFilled />} onClick={() => dockTopRight(sidePaneId)}>
                                    Top Right
                                </MenuItem>
                            )}
                            {dockBottomRight && (
                                <MenuItem icon={<LayoutColumnTwoSplitRightFocusBottomRightFilled />} onClick={() => dockBottomRight(sidePaneId)}>
                                    Bottom Right
                                </MenuItem>
                            )}
                        </MenuGroup>
                    </MenuList>
                </MenuPopover>
            </Theme>
        </Menu>
    );
};

const PaneHeader: FunctionComponent<{ id: string; title: string; dockOptions: Map<DockLocation, (sidePaneKey: string) => void> }> = (props) => {
    const { id, title, dockOptions } = props;

    const classes = useStyles();

    return (
        <Theme invert>
            <div className={classes.paneHeaderDiv}>
                <Subtitle2Stronger className={classes.paneHeaderText}>{title}</Subtitle2Stronger>
                <DockMenu sidePaneId={id} dockOptions={dockOptions}>
                    <Button className={classes.paneHeaderButton} appearance="transparent" icon={<MoreHorizontalRegular />} />
                </DockMenu>
            </div>
        </Theme>
    );
};

// This is a wrapper for an item in a toolbar that simply adds a teaching moment, which is useful for dynamically added items, possibly from extensions.
const ToolbarItem: FunctionComponent<{
    verticalLocation: VerticalLocation;
    horizontalLocation: HorizontalLocation;
    id: string;
    component: ComponentType;
    displayName?: string;
    suppressTeachingMoment?: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
}> = ({ verticalLocation, horizontalLocation, id, component: Component, displayName: displayName, suppressTeachingMoment }) => {
    const classes = useStyles();

    const useTeachingMoment = useMemo(() => MakePopoverTeachingMoment(`Bar/${verticalLocation}/${horizontalLocation}/${displayName ?? id}`), [displayName, id]);
    const teachingMoment = useTeachingMoment(suppressTeachingMoment);

    return (
        <>
            <TeachingMoment
                {...teachingMoment}
                shouldDisplay={teachingMoment.shouldDisplay && !suppressTeachingMoment}
                title={displayName ?? "Extension"}
                description={`The "${displayName ?? id}" extension can be accessed here.`}
            />
            <div className={classes.barItem} ref={teachingMoment.targetRef}>
                <Component />
            </div>
        </>
    );
};

// TODO: Handle overflow, possibly via https://react.fluentui.dev/?path=/docs/components-overflow--docs with priority.
// This component just renders a toolbar with left aligned toolbar items on the left and right aligned toolbar items on the right.
const Toolbar: FunctionComponent<{ location: VerticalLocation; components: Readonly<ToolbarItemDefinition[]> }> = ({ location, components }) => {
    const classes = useStyles();

    const leftComponents = useMemo(() => components.filter((entry) => entry.horizontalLocation === "left"), [components]);
    const rightComponents = useMemo(() => components.filter((entry) => entry.horizontalLocation === "right"), [components]);

    return (
        <>
            {components.length > 0 && (
                <div className={`${classes.bar} ${location === "top" ? classes.barTop : null}`}>
                    <div className={classes.barLeft}>
                        {leftComponents.map((entry) => (
                            <ToolbarItem
                                key={entry.key}
                                verticalLocation={location}
                                horizontalLocation={entry.horizontalLocation}
                                id={entry.key}
                                component={entry.component}
                                displayName={entry.displayName}
                                suppressTeachingMoment={entry.suppressTeachingMoment}
                            />
                        ))}
                    </div>
                    <div className={classes.barRight}>
                        {rightComponents.map((entry) => (
                            <ToolbarItem
                                key={entry.key}
                                verticalLocation={location}
                                horizontalLocation={entry.horizontalLocation}
                                id={entry.key}
                                component={entry.component}
                                displayName={entry.displayName}
                                suppressTeachingMoment={entry.suppressTeachingMoment}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

// This is a wrapper for a tab in a side pane that simply adds a teaching moment, which is useful for dynamically added items, possibly from extensions.
const SidePaneTab: FunctionComponent<
    { location: HorizontalLocation; id: string; isSelected: boolean; dockOptions: Map<DockLocation, (sidePaneKey: string) => void> } & Pick<
        Readonly<SidePaneDefinition>,
        "title" | "icon" | "suppressTeachingMoment"
    >
> = (props) => {
    const {
        location,
        id,
        isSelected,
        dockOptions,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        icon: Icon,
        title,
        suppressTeachingMoment,
    } = props;
    const classes = useStyles();
    const useTeachingMoment = useMemo(() => MakePopoverTeachingMoment(`Pane/${location}/${title ?? id}`), [title, id]);
    const teachingMoment = useTeachingMoment(suppressTeachingMoment);

    const tabClass = mergeClasses(classes.tab, isSelected ? undefined : classes.unselectedTab);

    return (
        <>
            <TeachingMoment
                {...teachingMoment}
                shouldDisplay={teachingMoment.shouldDisplay && !suppressTeachingMoment}
                title={title ?? "Extension"}
                description={`The "${title ?? id}" extension can be accessed here.`}
            />
            <Theme className={tabClass} invert={isSelected}>
                <DockMenu openOnContext sidePaneId={id} dockOptions={dockOptions}>
                    <ToolbarRadioButton
                        ref={teachingMoment.targetRef}
                        title={title ?? id}
                        appearance="transparent"
                        className={classes.tabRadioButton}
                        name="selectedTab"
                        value={id}
                        icon={{
                            className: isSelected ? classes.selectedTabIcon : undefined,
                            children: <Icon />,
                        }}
                    />
                </DockMenu>
            </Theme>
        </>
    );
};

// This hook provides a side pane container and the tab list.
// In "compact" mode, the tab list is integrated into the pane itself.
// In "full" mode, the returned tab list is later injected into the toolbar.
function usePane(
    location: HorizontalLocation,
    defaultWidth: number,
    minWidth: number,
    sidePanes: SidePaneEntry[],
    topPaneContainerRef: (element: HTMLElement | null) => void,
    bottomPaneContainerRef: (element: HTMLElement | null) => void,
    onSelectSidePane: Observable<string>,
    dockOperations: Map<DockLocation, (sidePaneKey: string) => void>,
    toolbarMode: ToolbarMode,
    topBarItems: Readonly<ToolbarItemDefinition[]>,
    bottomBarItems: Readonly<ToolbarItemDefinition[]>
) {
    const classes = useStyles();

    const [topSelectedTab, setTopSelectedTab] = useState<SidePaneEntry>();
    const [bottomSelectedTab, setBottomSelectedTab] = useState<SidePaneEntry>();
    const [collapsed, setCollapsed] = useState(false);

    const onExpandCollapseClick = useCallback(() => {
        setCollapsed((collapsed) => !collapsed);
    }, [collapsed]);

    const widthStorageKey = `Babylon/Settings/${location}Pane/WidthAdjust`;
    const heightStorageKey = `Babylon/Settings/${location}Pane/HeightAdjust`;

    const currentSidePanes = useMemo(() => sidePanes.filter((entry) => entry.horizontalLocation === location), [sidePanes, location]);
    const topPanes = useMemo(() => currentSidePanes.filter((entry) => entry.verticalLocation === "top"), [currentSidePanes]);
    const bottomPanes = useMemo(() => currentSidePanes.filter((entry) => entry.verticalLocation === "bottom"), [currentSidePanes]);

    const getValidDockOperations = useCallback(
        (verticalLocation: VerticalLocation) => {
            const validDockOperations = new Map(dockOperations);

            // Can't re-dock to the current location.
            validDockOperations.delete(`${verticalLocation}-${location}`);

            // Full would mean there are no bottom panes, so this is also re-docking to the current location.
            validDockOperations.delete(`full-${location}`);

            // If there is only one pane left, it can't be docked to the bottom (as this would leave no top panes).
            if (currentSidePanes.length === 1) {
                validDockOperations.delete(`bottom-${location}`);
            }

            return validDockOperations;
        },
        [location, dockOperations, currentSidePanes]
    );

    const validTopDockOptions = useMemo(() => getValidDockOperations("top"), [getValidDockOperations]);
    const validBottomDockOptions = useMemo(() => getValidDockOperations("bottom"), [getValidDockOperations]);

    // Selects a default top tab (during initialization or if the selected tab is removed).
    useEffect(() => {
        if ((topSelectedTab && !topPanes.includes(topSelectedTab)) || (!topSelectedTab && topPanes.length > 0)) {
            setTopSelectedTab(topPanes[0]);
        } else if (topSelectedTab && topPanes.length === 0) {
            setTopSelectedTab(undefined);
        }
    }, [topSelectedTab, topPanes]);

    // Selects a default bottom tab (during initialization or if the selected tab is removed).
    useEffect(() => {
        if ((bottomSelectedTab && !bottomPanes.includes(bottomSelectedTab)) || (!bottomSelectedTab && bottomPanes.length > 0)) {
            setBottomSelectedTab(bottomPanes[0]);
        } else if (bottomSelectedTab && bottomPanes.length === 0) {
            setBottomSelectedTab(undefined);
        }
    }, [bottomSelectedTab, bottomPanes]);

    // Selects a tab when explicitly requested.
    useEffect(() => {
        const observer = onSelectSidePane.add((key) => {
            const topPane = topPanes.find((entry) => entry.key === key);
            if (topPane) {
                setTopSelectedTab(topPane);
                setCollapsed(false);
            }

            const bottomPane = bottomPanes.find((entry) => entry.key === key);
            if (bottomPane) {
                setBottomSelectedTab(bottomPane);
                setCollapsed(false);
            }
        });

        return () => observer.remove();
    }, [topPanes, bottomPanes, onSelectSidePane]);

    const expandCollapseIcon = useMemo(() => {
        if (location === "left") {
            return collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />;
        } else {
            return collapsed ? <PanelRightExpandRegular /> : <PanelRightContractRegular />;
        }
    }, [collapsed, location]);

    const createPaneTabList = useCallback(
        (
            paneComponents: SidePaneEntry[],
            toolbarMode: "full" | "compact",
            selectedTab: SidePaneEntry | undefined,
            setSelectedTab: (tab: SidePaneEntry | undefined) => void,
            dockOptions: Map<DockLocation, (sidePaneKey: string) => void>
        ) => {
            return (
                <>
                    {paneComponents.length > 0 && (
                        <div className={`${classes.paneTabListDiv} ${location === "left" || toolbarMode === "compact" ? classes.paneTabListDivLeft : classes.paneTabListDivRight}`}>
                            {/* Only render the tab list if there is more than tab. It's kind of pointless to show a tab list with just one tab. */}
                            {paneComponents.length > 1 && (
                                <>
                                    <FluentToolbar
                                        className={classes.tabToolbar}
                                        checkedValues={{ selectedTab: [selectedTab?.key ?? ""] }}
                                        onCheckedValueChange={(event, data) => {
                                            const tab = paneComponents.find((entry) => entry.key === data.checkedItems[0]);
                                            setSelectedTab(tab);
                                            setCollapsed(false);
                                        }}
                                    >
                                        {paneComponents.map((entry) => {
                                            const isSelected = selectedTab?.key === entry.key;
                                            return (
                                                <SidePaneTab
                                                    key={entry.key}
                                                    location={location}
                                                    id={entry.key}
                                                    title={entry.title}
                                                    icon={entry.icon}
                                                    suppressTeachingMoment={entry.suppressTeachingMoment}
                                                    isSelected={isSelected && !collapsed}
                                                    dockOptions={dockOptions}
                                                />
                                            );
                                        })}
                                    </FluentToolbar>
                                </>
                            )}

                            {/* When the toolbar mode is "full", we add an extra button that allows the side panes to be collapsed. */}
                            {toolbarMode === "full" && (
                                <>
                                    {paneComponents.length > 1 && (
                                        <>
                                            <Divider vertical inset style={{ minHeight: 0 }} />{" "}
                                        </>
                                    )}
                                    <Tooltip content={collapsed ? "Show Side Pane" : "Hide Side Pane"} relationship="label">
                                        <Button className={classes.paneCollapseButton} appearance="subtle" icon={expandCollapseIcon} onClick={onExpandCollapseClick} />
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    )}
                </>
            );
        },
        [location, collapsed]
    );

    // This memos the TabList to make it easy for the JSX to be inserted at the top of the pane (in "compact" mode) or returned to the caller to be used in the toolbar (in "full" mode).
    const topPaneTabList = useMemo(
        () => createPaneTabList(topPanes, toolbarMode, topSelectedTab, setTopSelectedTab, validTopDockOptions),
        [createPaneTabList, topPanes, toolbarMode, topSelectedTab]
    );
    const bottomPaneTabList = useMemo(
        () => createPaneTabList(bottomPanes, "compact", bottomSelectedTab, setBottomSelectedTab, validBottomDockOptions),
        [createPaneTabList, bottomPanes, bottomSelectedTab]
    );

    // This manages the CSS variable that controls the width of the side pane.
    const paneWidthAdjustCSSVar = "--pane-width-adjust";
    const {
        elementRef: paneHorizontalResizeElementRef,
        handleRef: paneHorizontalResizeHandleRef,
        setValue: setPaneWidthAdjust,
    } = useResizeHandle({
        growDirection: location === "left" ? "end" : "start",
        variableName: paneWidthAdjustCSSVar,
        minValue: minWidth - defaultWidth,
        onChange: (value) => {
            // Whenever the width is adjusted, store the value.
            localStorage.setItem(widthStorageKey, value.toString());
        },
    });

    // This manages the CSS variable that controls the height of the bottom pane.
    const paneHeightAdjustCSSVar = "--pane-height-adjust";
    const {
        elementRef: paneVerticalResizeElementRef,
        handleRef: paneVerticalResizeHandleRef,
        setValue: setPaneHeightAdjust,
    } = useResizeHandle({
        growDirection: "up",
        variableName: paneHeightAdjustCSSVar,
        onChange: (value) => {
            // Whenever the height is adjusted, store the value.
            localStorage.setItem(heightStorageKey, value.toString());
        },
    });

    // This ensures that when the component is first rendered, the CSS variable is set from storage.
    useLayoutEffect(() => {
        const storedPaneWidthAdjust = localStorage.getItem(widthStorageKey);
        if (storedPaneWidthAdjust) {
            setPaneWidthAdjust(Number.parseInt(storedPaneWidthAdjust));
        }

        const storedPaneHeightAdjust = localStorage.getItem(heightStorageKey);
        if (storedPaneHeightAdjust) {
            setPaneHeightAdjust(Number.parseInt(storedPaneHeightAdjust));
        }
    }, []);

    // This memoizes the pane itself, which may or may not include the tab list, depending on the toolbar mode.
    const pane = useMemo(() => {
        return (
            <>
                {(topPanes.length > 0 || bottomPanes.length > 0) && (
                    <div className={`${classes.pane} ${location === "left" ? classes.paneLeft : classes.paneRight}`}>
                        <Collapse orientation="horizontal" visible={!collapsed}>
                            <div
                                ref={paneHorizontalResizeElementRef}
                                className={classes.paneContainer}
                                style={{ width: `clamp(${minWidth}px, calc(${defaultWidth}px + var(${paneWidthAdjustCSSVar}, 0px)), 1000px)` }}
                            >
                                {/* If toolbar mode is "compact" then the top toolbar is embedded at the top of the pane. */}
                                {toolbarMode === "compact" && (topPanes.length > 1 || topBarItems.length > 0) && (
                                    <>
                                        <div className={classes.barDiv}>
                                            {/* The tablist gets merged in with the toolbar. */}
                                            {topPaneTabList}
                                            <Toolbar location="top" components={topBarItems} />
                                        </div>
                                    </>
                                )}

                                {/* Render the top pane content. */}
                                {topPanes.length > 0 && (
                                    <div className={classes.paneContent}>
                                        {topSelectedTab && (
                                            <>
                                                <PaneHeader id={topSelectedTab.key} title={topSelectedTab.title} dockOptions={validTopDockOptions} />
                                                <div ref={topPaneContainerRef} className={classes.paneContent} />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* If we have both top and bottom panes, show a divider. This divider is also the resizer for the bottom pane. */}
                                {topPanes.length > 0 && bottomPanes.length > 0 && <Divider ref={paneVerticalResizeHandleRef} className={classes.paneDivider} />}

                                {/* Render the bottom pane tablist. */}
                                {bottomPanes.length > 1 && (
                                    <>
                                        <div className={classes.barDiv}>{bottomPaneTabList}</div>
                                    </>
                                )}

                                {/* Render the bottom pane content. This is the element that can be resized vertically. */}
                                {bottomPanes.length > 0 && (
                                    <div
                                        ref={paneVerticalResizeElementRef}
                                        className={classes.paneContent}
                                        style={{ height: `clamp(200px, calc(45% + var(${paneHeightAdjustCSSVar}, 0px)), 100% - 300px)`, flex: "0 0 auto" }}
                                    >
                                        {bottomSelectedTab && (
                                            <>
                                                <PaneHeader id={bottomSelectedTab.key} title={bottomSelectedTab.title} dockOptions={validBottomDockOptions} />
                                                <div ref={bottomPaneContainerRef} className={classes.paneContent} />
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* If toolbar mode is "compact" then the bottom toolbar is embedded at the bottom of the pane. */}
                                {toolbarMode === "compact" && bottomBarItems.length > 0 && (
                                    <>
                                        <div className={classes.barDiv}>
                                            <Toolbar location="bottom" components={bottomBarItems} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Collapse>
                        {/* This is the resizer (width) for the pane container. */}
                        <div
                            ref={paneHorizontalResizeHandleRef}
                            className={`${classes.resizer} ${location === "left" ? classes.resizerLeft : classes.resizerRight}`}
                            style={{ pointerEvents: `${collapsed ? "none" : "auto"}` }}
                        />
                    </div>
                )}
            </>
        );
    }, [
        topPanes,
        topSelectedTab,
        validTopDockOptions,
        bottomPanes,
        bottomSelectedTab,
        validBottomDockOptions,
        topBarItems,
        bottomBarItems,
        topPaneTabList,
        bottomPaneTabList,
        collapsed,
    ]);

    return [topPaneTabList, pane, topSelectedTab, bottomSelectedTab] as const;
}

export function MakeShellServiceDefinition({
    leftPaneDefaultWidth = 350,
    leftPaneMinWidth = 350,
    rightPaneDefaultWidth = 350,
    rightPaneMinWidth = 350,
    toolbarMode = "full",
    sidePaneRemapper = undefined,
}: ShellServiceOptions = {}): ServiceDefinition<[IShellService, IRootComponentService], []> {
    return {
        friendlyName: "MainView",
        produces: [ShellServiceIdentity, RootComponentServiceIdentity],
        factory: () => {
            const toolbarItemCollection = new ObservableCollection<Readonly<ToolbarItemDefinition>>();
            const sidePaneCollection = new ObservableCollection<Readonly<SidePaneDefinition>>();
            const centralContentCollection = new ObservableCollection<Readonly<CentralContentDefinition>>();

            const onSelectSidePane = new Observable<string>(undefined, true);

            const rootComponent: FunctionComponent = () => {
                const classes = useStyles();

                const [sidePaneDockOverrides, setSidePaneDockOverrides] = useSidePaneDockOverrides();

                // This function returns a promise that resolves after the dock change takes effect so that
                // we can then select the re-docked pane.
                const pendingPaneReselects = useRef<string[]>([]);
                const updateSidePaneDockOverride = useCallback(
                    (key: string, horizontalLocation: HorizontalLocation, verticalLocation: VerticalLocation) => {
                        setSidePaneDockOverrides((current) => ({
                            ...current,
                            [key]: { horizontalLocation, verticalLocation },
                        }));

                        pendingPaneReselects.current.push(key);
                    },
                    [setSidePaneDockOverrides]
                );

                const toolbarItems = useOrderedObservableCollection(toolbarItemCollection);

                const sidePanes = useOrderedObservableCollection(sidePaneCollection);
                const coercedSidePaneCache = useRef(new Map<string, SidePaneEntry>());
                const coercedSidePanes = useMemo(() => {
                    // First pass - apply overrides and respect the side pane mode.
                    const coercedSidePanes = sidePanes.map((sidePaneDefinition) => {
                        let sidePaneEntry = coercedSidePaneCache.current.get(sidePaneDefinition.key);
                        if (!sidePaneEntry) {
                            // Manually create html element containers outside the React tree to prevent unmounting/mounting
                            // when panes are re-docked or the selected tabs change. This preserves state within the side panes.
                            // This is combined with the usage of React portals to make it all work.
                            const sidePaneContainer = document.createElement("div");
                            sidePaneContainer.style.display = "flex";
                            sidePaneContainer.style.flex = "1";
                            sidePaneContainer.style.flexDirection = "column";
                            sidePaneContainer.style.overflow = "hidden";
                            sidePaneEntry = { ...sidePaneDefinition, container: sidePaneContainer };
                            coercedSidePaneCache.current.set(sidePaneDefinition.key, sidePaneEntry);
                        }

                        const override = sidePaneDockOverrides[sidePaneDefinition.key];
                        if (override) {
                            // Override (user manually re-docked) has the highest priority.
                            sidePaneEntry.horizontalLocation = override.horizontalLocation;
                            sidePaneEntry.verticalLocation = override.verticalLocation;
                        } else if (sidePaneRemapper) {
                            // A side pane remapper has the next highest priority.
                            const { horizontalLocation, verticalLocation } = sidePaneRemapper(sidePaneDefinition);
                            sidePaneEntry.horizontalLocation = horizontalLocation;
                            sidePaneEntry.verticalLocation = verticalLocation;
                        } else {
                            // Otherwise use the default defined location.
                            sidePaneEntry.horizontalLocation = sidePaneDefinition.horizontalLocation;
                            sidePaneEntry.verticalLocation = sidePaneDefinition.verticalLocation;
                        }

                        return sidePaneEntry;
                    });

                    // Second pass - correct any invalid state, specifically if there are only bottom panes, force them to be top panes.
                    for (const side of ["left", "right"] as const) {
                        const topPanes = coercedSidePanes.filter((entry) => entry.horizontalLocation === side && entry.verticalLocation === "top");
                        const bottomPanes = coercedSidePanes.filter((entry) => entry.horizontalLocation === side && entry.verticalLocation === "bottom");
                        if (bottomPanes.length > 0 && topPanes.length === 0) {
                            for (const pane of bottomPanes) {
                                pane.verticalLocation = "top";
                                updateSidePaneDockOverride(pane.key, side, "top");
                            }
                        }
                    }

                    // Cleanup any cached panes that are no longer present.
                    for (const key of coercedSidePaneCache.current.keys()) {
                        if (!coercedSidePanes.some((entry) => entry.key === key)) {
                            coercedSidePaneCache.current.delete(key);
                        }
                    }

                    return coercedSidePanes;
                }, [sidePanes, sidePaneDockOverrides, updateSidePaneDockOverride, sidePaneRemapper]);

                useEffect(() => {
                    for (const paneKey of pendingPaneReselects.current.splice(0)) {
                        onSelectSidePane.notifyObservers(paneKey);
                    }
                }, [coercedSidePanes]);

                const sidePaneDockOperations = useMemo(() => {
                    const sidePaneDockOperations = new Map<DockLocation, (sidePaneKey: string) => void>();
                    for (const side of ["left", "right"] as const) {
                        const currentSidePanes = coercedSidePanes.filter((entry) => entry.horizontalLocation === side);

                        const dockTop = (sidePaneKey: string) => {
                            updateSidePaneDockOverride(sidePaneKey, side, "top");
                        };
                        const dockBottom = (sidePaneKey: string) => {
                            updateSidePaneDockOverride(sidePaneKey, side, "bottom");
                        };

                        if (currentSidePanes.some((entry) => entry.verticalLocation === "bottom")) {
                            // If there are bottom panes, there must also be top panes, and so top and bottom are valid locations.
                            sidePaneDockOperations.set(`top-${side}`, dockTop);
                            sidePaneDockOperations.set(`bottom-${side}`, dockBottom);
                        } else if (currentSidePanes.length > 0) {
                            // If there are only top panes, then full and bottom are valid locations.
                            sidePaneDockOperations.set(`full-${side}`, dockTop);
                            sidePaneDockOperations.set(`bottom-${side}`, dockBottom);
                        } else {
                            // If there are no panes, then only full is a valid location.
                            sidePaneDockOperations.set(`full-${side}`, dockTop);
                        }
                    }
                    return sidePaneDockOperations;
                }, [coercedSidePanes]);

                const hasLeftPanes = coercedSidePanes.some((entry) => entry.horizontalLocation === "left");
                const hasRightPanes = coercedSidePanes.some((entry) => entry.horizontalLocation === "right");

                // If we are in compact toolbar mode, we may need to move toolbar items from the left to the right or vice versa,
                // depending on whether there are any side panes on that side.
                const coerceToolBarItemHorizontalLocation = useMemo(
                    () => (item: Readonly<ToolbarItemDefinition>) => {
                        let horizontalLocation = item.horizontalLocation;
                        // Coercion is only needed in compact toolbar mode since there might not be a left or right pane.
                        if (toolbarMode === "compact") {
                            if (horizontalLocation === "left" && !hasLeftPanes) {
                                horizontalLocation = "right";
                            }
                            if (horizontalLocation === "right" && !hasRightPanes) {
                                horizontalLocation = "left";
                            }
                        }
                        return horizontalLocation;
                    },
                    [toolbarMode, hasLeftPanes, hasRightPanes]
                );

                const topToolBarItems = useMemo(() => toolbarItems.filter((entry) => entry.verticalLocation === "top"), [toolbarItems]);
                const bottomToolBarItems = useMemo(() => toolbarItems.filter((entry) => entry.verticalLocation === "bottom"), [toolbarItems]);

                const topBarLeftItems = useMemo(
                    () => topToolBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "left"),
                    [topToolBarItems, coerceToolBarItemHorizontalLocation]
                );
                const topBarRightItems = useMemo(
                    () => topToolBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "right"),
                    [topToolBarItems, coerceToolBarItemHorizontalLocation]
                );
                const bottomBarLeftItems = useMemo(
                    () => bottomToolBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "left"),
                    [bottomToolBarItems, coerceToolBarItemHorizontalLocation]
                );
                const bottomBarRightItems = useMemo(
                    () => bottomToolBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "right"),
                    [bottomToolBarItems, coerceToolBarItemHorizontalLocation]
                );

                const centralContents = useOrderedObservableCollection(centralContentCollection);

                const [topLeftPaneContainer, setTopLeftPaneContainer] = useState<HTMLElement | null>(null);
                const [bottomLeftPaneContainer, setBottomLeftPaneContainer] = useState<HTMLElement | null>(null);
                const [topRightPaneContainer, setTopRightPaneContainer] = useState<HTMLElement | null>(null);
                const [bottomRightPaneContainer, setBottomRightPaneContainer] = useState<HTMLElement | null>(null);

                const [leftPaneTabList, leftPane, topLeftSelectedPane, bottomLeftSelectedPane] = usePane(
                    "left",
                    leftPaneDefaultWidth,
                    leftPaneMinWidth,
                    coercedSidePanes,
                    setTopLeftPaneContainer,
                    setBottomLeftPaneContainer,
                    onSelectSidePane,
                    sidePaneDockOperations,
                    toolbarMode,
                    topBarLeftItems,
                    bottomBarLeftItems
                );

                const [rightPaneTabList, rightPane, topRightSelectedPane, bottomRightSelectedPane] = usePane(
                    "right",
                    rightPaneDefaultWidth,
                    rightPaneMinWidth,
                    coercedSidePanes,
                    setTopRightPaneContainer,
                    setBottomRightPaneContainer,
                    onSelectSidePane,
                    sidePaneDockOperations,
                    toolbarMode,
                    topBarRightItems,
                    bottomBarRightItems
                );

                // Update the content of the top left pane container.
                useEffect(() => {
                    topLeftPaneContainer?.replaceChildren(...(topLeftSelectedPane ? [topLeftSelectedPane.container] : []));
                }, [topLeftPaneContainer, topLeftSelectedPane]);

                // Update the content of the bottom left pane container.
                useEffect(() => {
                    bottomLeftPaneContainer?.replaceChildren(...(bottomLeftSelectedPane ? [bottomLeftSelectedPane.container] : []));
                }, [bottomLeftPaneContainer, bottomLeftSelectedPane]);

                // Update the content of the top right pane container.
                useEffect(() => {
                    topRightPaneContainer?.replaceChildren(...(topRightSelectedPane ? [topRightSelectedPane.container] : []));
                }, [topRightPaneContainer, topRightSelectedPane]);

                // Update the content of the bottom right pane container.
                useEffect(() => {
                    bottomRightPaneContainer?.replaceChildren(...(bottomRightSelectedPane ? [bottomRightSelectedPane.container] : []));
                }, [bottomRightPaneContainer, bottomRightSelectedPane]);

                return (
                    <div className={classes.mainView}>
                        {/* Only render the top toolbar if the toolbar mode is "full". Otherwise it will be embedded at the top of the side panes. */}
                        {toolbarMode === "full" && (
                            <>
                                <div className={classes.barDiv}>
                                    {leftPaneTabList}
                                    <Toolbar location="top" components={topToolBarItems} />
                                    {rightPaneTabList}
                                </div>
                            </>
                        )}

                        {/* This renders the side panes and the main/central content. */}
                        <div className={classes.verticallyCentralContent}>
                            {/* Render the left pane container. */}
                            {leftPane}

                            {/* Render the main/central content. */}
                            <div className={classes.centralContent}>
                                {centralContents.map((entry) => (
                                    <entry.component key={entry.key} />
                                ))}
                            </div>

                            {/* Render the right pane container. */}
                            {rightPane}
                        </div>

                        {/* Only render the bottom toolbar if the toolbar mode is "full". Otherwise it will be embedded at the bottom of the side panes. */}
                        {toolbarMode === "full" && (
                            <>
                                <div className={classes.barDiv}>
                                    <Toolbar location="bottom" components={bottomToolBarItems} />
                                </div>
                            </>
                        )}

                        {/* Always render all side panes, but render them into portals so we can relocate them (undock/redock) without losing their state. */}
                        {coercedSidePanes.map((sidePaneDefinition) => {
                            return (
                                <Portal key={sidePaneDefinition.key} mountNode={sidePaneDefinition.container}>
                                    <sidePaneDefinition.content />
                                </Portal>
                            );
                        })}
                    </div>
                );
            };
            rootComponent.displayName = "Shell Service Root";

            return {
                addToolbarItem: (entry) => {
                    if (!entry.component.displayName) {
                        entry.component.displayName = `${entry.key} | ${entry.verticalLocation} ${entry.horizontalLocation} bar item`;
                    }

                    return toolbarItemCollection.add(entry);
                },
                addSidePane: (entry) => {
                    if (!entry.content.displayName) {
                        entry.content.displayName = `${entry.key} | ${entry.horizontalLocation} pane`;
                    }

                    return sidePaneCollection.add(entry);
                },
                addCentralContent: (entry) => centralContentCollection.add(entry),
                resetSidePaneLayout: () => localStorage.removeItem("Babylon/Settings/SidePaneDockOverrides"),
                get sidePanes() {
                    return [...sidePaneCollection.items].map((sidePaneDefinition) => {
                        return {
                            key: sidePaneDefinition.key,
                            select: () => onSelectSidePane.notifyObservers(sidePaneDefinition.key),
                        };
                    });
                },
                rootComponent,
            };
        },
    };
}
