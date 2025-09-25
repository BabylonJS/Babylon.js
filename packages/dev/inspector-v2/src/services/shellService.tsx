import type { IDisposable } from "core/index";

import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";

import { useResizeHandle } from "@fluentui-contrib/react-resize-handle";
import { Button, Divider, makeStyles, Tab, TabList, Title3, tokens, Tooltip } from "@fluentui/react-components";
import { PanelLeftContractRegular, PanelLeftExpandRegular, PanelRightContractRegular, PanelRightExpandRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { TeachingMoment } from "../components/teachingMoment";
import { useOrderedObservableCollection } from "../hooks/observableHooks";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ObservableCollection } from "../misc/observableCollection";

/**
 * Describes an item that can be added to one of the shell's toolbars.
 */
export type ToolbarItem = Readonly<{
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
    horizontalLocation: "left" | "right";

    /**
     * The vertical location of the toolbar item.
     * Can be either "top" or "bottom".
     */
    verticalLocation: "top" | "bottom";

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
}>;

/**
 * Describes a side pane that can be added to the shell's left or right side.
 */
export type SidePane = Readonly<{
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
    horizontalLocation: "left" | "right";

    /**
     * The vertical location of the side pane.
     * Can be either "top" or "bottom".
     */
    verticalLocation: "top" | "bottom";

    /**
     * An optional title for the side pane, displayed as a standardized header at the top of the pane.
     */
    title?: string;

    /**
     * An optional flag to suppress the teaching moment for this side pane.
     * Defaults to false.
     * Teaching moments are more helpful for dynamically added panes, possibly from extensions.
     */
    suppressTeachingMoment?: boolean;
}>;

/**
 * Describes content that can be added to the shell's central area (between the side panes and toolbars - e.g. the main content).
 */
export type CentralContent = Readonly<{
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
}>;

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
    addToolbarItem(item: ToolbarItem): IDisposable;
    addSidePane(pane: SidePane): IDisposable;
    addCentralContent(content: CentralContent): IDisposable;
}

type ToolbarMode = "full" | "compact";

type SidePaneMode = "both" | "right";

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
     * The mode of the side panes.
     * Can be either "both" (default) or "right".
     * In "both" mode, side panes can be added to both the left and right sides.
     * In "right" mode, all left panes are moved to the upper right, and all right panes are moved to the lower right.
     */
    sidePaneMode?: SidePaneMode;
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
        backgroundColor: tokens.colorNeutralBackground2,
    },
    bar: {
        display: "flex",
        flex: "1",
        height: "32px",
        overflow: "hidden",
        padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalSNudge}`,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    barTop: {
        borderTopWidth: 0,
    },
    barBottom: {
        borderBottomWidth: 0,
    },
    barLeft: {
        marginRight: "auto",
        display: "flex",
        flexDirection: "row",
        columnGap: tokens.spacingHorizontalSNudge,
    },
    barRight: {
        marginLeft: "auto",
        display: "flex",
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
        paddingTop: tokens.spacingVerticalS,
        overflow: "hidden",
    },
    paneHeader: {
        marginLeft: tokens.spacingHorizontalM,
    },
    headerDivider: {
        flex: "0 0 auto",
        marginTop: tokens.spacingVerticalM,
    },
    tab: {
        paddingTop: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
        paddingLeft: tokens.spacingHorizontalS,
        paddingRight: tokens.spacingHorizontalS,
        alignSelf: "center",
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

// This is a wrapper for an item in a toolbar that simply adds a teaching moment, which is useful for dynamically added items, possibly from extensions.
const ToolbarItem: FunctionComponent<{
    location: "top" | "bottom";
    alignment: "left" | "right";
    id: string;
    component: ComponentType;
    displayName?: string;
    suppressTeachingMoment?: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
}> = ({ location, alignment, id, component: Component, displayName: displayName, suppressTeachingMoment }) => {
    const classes = useStyles();

    const useTeachingMoment = useMemo(() => MakePopoverTeachingMoment(`Bar/${location}/${alignment}/${displayName ?? id}`), [displayName, id]);
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
const Toolbar: FunctionComponent<{ location: "top" | "bottom"; components: ToolbarItem[] }> = ({ location, components }) => {
    const classes = useStyles();

    const leftComponents = useMemo(() => components.filter((entry) => entry.horizontalLocation === "left"), [components]);
    const rightComponents = useMemo(() => components.filter((entry) => entry.horizontalLocation === "right"), [components]);

    return (
        <>
            {components.length > 0 && (
                <div className={`${classes.bar} ${location === "top" ? classes.barTop : classes.barBottom}`}>
                    <div className={classes.barLeft}>
                        {leftComponents.map((entry) => (
                            <ToolbarItem
                                key={entry.key}
                                location={location}
                                alignment={entry.horizontalLocation}
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
                                location={location}
                                alignment={entry.horizontalLocation}
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
const SidePaneTab: FunctionComponent<{ alignment: "left" | "right"; id: string } & Pick<SidePane, "title" | "icon" | "suppressTeachingMoment">> = ({
    alignment,
    id,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    icon: Icon,
    title,
    suppressTeachingMoment,
}) => {
    const classes = useStyles();
    const useTeachingMoment = useMemo(() => MakePopoverTeachingMoment(`Pane/${alignment}/${title ?? id}`), [title, id]);
    const teachingMoment = useTeachingMoment(suppressTeachingMoment);

    return (
        <>
            <TeachingMoment
                {...teachingMoment}
                shouldDisplay={teachingMoment.shouldDisplay && !suppressTeachingMoment}
                title={title ?? "Extension"}
                description={`The "${title ?? id}" extension can be accessed here.`}
            />
            <Tab
                ref={teachingMoment.targetRef}
                className={classes.tab}
                key={id}
                value={id}
                icon={
                    <Tooltip content={title ?? id} relationship="description">
                        <Icon />
                    </Tooltip>
                }
            />
        </>
    );
};

// This hook provides a side pane container and the tab list.
// In "compact" mode, the tab list is integrated into the pane itself.
// In "full" mode, the returned tab list is later injected into the toolbar.
function usePane(
    alignment: "left" | "right",
    defaultWidth: number,
    minWidth: number,
    topPaneComponents: SidePane[],
    bottomPaneComponents: SidePane[],
    toolbarMode: ToolbarMode,
    topBarComponents: ToolbarItem[],
    bottomBarComponents: ToolbarItem[]
) {
    const classes = useStyles();

    const [topSelectedTab, setTopSelectedTab] = useState<SidePane>();
    const [bottomSelectedTab, setBottomSelectedTab] = useState<SidePane>();
    const [collapsed, setCollapsed] = useState(false);

    const onExpandCollapseClick = useCallback(() => {
        setCollapsed((collapsed) => !collapsed);
    }, [collapsed]);

    const widthStorageKey = `Babylon/Settings/${alignment}Pane/Width`;
    const heightStorageKey = `Babylon/Settings/${alignment}Pane/HeightAdjust`;

    const [width, setWidth] = useState(Number.parseInt(localStorage.getItem(widthStorageKey) ?? "") || Math.max(defaultWidth, minWidth));
    const [resizing, setResizing] = useState(false);

    useEffect(() => {
        if ((topSelectedTab && !topPaneComponents.includes(topSelectedTab)) || (!topSelectedTab && topPaneComponents.length > 0)) {
            setTopSelectedTab(topPaneComponents[0]);
        } else if (topSelectedTab && topPaneComponents.length === 0) {
            setTopSelectedTab(undefined);
        }
    }, [topSelectedTab, topPaneComponents]);

    useEffect(() => {
        if ((bottomSelectedTab && !bottomPaneComponents.includes(bottomSelectedTab)) || (!bottomSelectedTab && bottomPaneComponents.length > 0)) {
            setBottomSelectedTab(bottomPaneComponents[0]);
        } else if (bottomSelectedTab && bottomPaneComponents.length === 0) {
            setBottomSelectedTab(undefined);
        }
    }, [bottomSelectedTab, bottomPaneComponents]);

    const expandCollapseIcon = useMemo(() => {
        if (alignment === "left") {
            return collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />;
        } else {
            return collapsed ? <PanelRightExpandRegular /> : <PanelRightContractRegular />;
        }
    }, [collapsed, alignment]);

    // TODO: Replace this custom resizing logic with useResizeHandle.
    // This function handles resizing the side pane width.
    const onResizerPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const currentTarget = event.currentTarget;
            const pointerId = event.pointerId;
            event.preventDefault();
            setResizing(true);
            currentTarget.setPointerCapture(pointerId);
            let newWidth = width;
            let finalWidth = newWidth;

            const onPointerMove = (event: PointerEvent) => {
                event.preventDefault();
                let movementX = event.movementX;
                if (alignment === "right") {
                    movementX *= -1;
                }
                newWidth = Math.max(0, newWidth + movementX);
                finalWidth = Math.max(minWidth, newWidth);
                setWidth(finalWidth);
            };
            currentTarget.addEventListener("pointermove", onPointerMove);

            currentTarget.addEventListener(
                "pointerup",
                (event) => {
                    event.preventDefault();
                    currentTarget.removeEventListener("pointermove", onPointerMove);
                    currentTarget.releasePointerCapture(pointerId);
                    setResizing(false);
                    localStorage.setItem(widthStorageKey, finalWidth.toString());
                },
                { once: true }
            );
        },
        [resizing]
    );

    const createPaneTabList = useCallback(
        (paneComponents: SidePane[], toolbarMode: "full" | "compact", selectedTab: SidePane | undefined, setSelectedTab: (tab: SidePane | undefined) => void) => {
            return (
                <>
                    {paneComponents.length > 0 && (
                        <div
                            className={`${classes.paneTabListDiv} ${alignment === "left" || toolbarMode === "compact" ? classes.paneTabListDivLeft : classes.paneTabListDivRight}`}
                        >
                            {/* Only render the tab list if there is more than tab. It's kind of pointless to show a tab list with just one tab. */}
                            {paneComponents.length > 1 && (
                                <>
                                    <TabList
                                        selectedValue={selectedTab?.key ?? ""}
                                        onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                                            const tab = paneComponents.find((entry) => entry.key === data.value);
                                            setSelectedTab(tab);
                                            setCollapsed(false);
                                        }}
                                    >
                                        {paneComponents.map((entry) => (
                                            <SidePaneTab
                                                key={entry.key}
                                                alignment={alignment}
                                                id={entry.key}
                                                title={entry.title}
                                                icon={entry.icon}
                                                suppressTeachingMoment={entry.suppressTeachingMoment}
                                            />
                                        ))}
                                    </TabList>
                                </>
                            )}

                            {/* When the toolbar mode is "full", we add an extra button that allows the side panes to be collapsed. */}
                            {toolbarMode === "full" && (
                                <>
                                    <Divider vertical inset />
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
        [alignment, collapsed]
    );

    // This memos the TabList to make it easy for the JSX to be inserted at the top of the pane (in "compact" mode) or returned to the caller to be used in the toolbar (in "full" mode).
    const topPaneTabList = useMemo(() => createPaneTabList(topPaneComponents, toolbarMode, topSelectedTab, setTopSelectedTab), [topPaneComponents, toolbarMode, topSelectedTab]);
    const bottomPaneTabList = useMemo(() => createPaneTabList(bottomPaneComponents, "compact", bottomSelectedTab, setBottomSelectedTab), [bottomPaneComponents, bottomSelectedTab]);

    // This manages the CSS variable that controls the height of the bottom pane.
    const paneHeightAdjustCSSVar = "--pane-height-adjust";
    const {
        elementRef: paneVerticalResizeElementRef,
        handleRef: paneVerticalResizeHandleRef,
        setValue: setPaneHeightAdjust,
    } = useResizeHandle({
        growDirection: "up",
        relative: true,
        variableName: paneHeightAdjustCSSVar,
        variableTarget: "element",
        onChange: (event, data) => {
            // Whenever the height is adjusted, store the value.
            localStorage.setItem(heightStorageKey, data.value.toString());
        },
    });

    // This ensures that when the component is first rendered, the CSS variable is set from storage.
    useLayoutEffect(() => {
        const storedPaneHeightAdjust = localStorage.getItem(heightStorageKey);
        if (storedPaneHeightAdjust) {
            setPaneHeightAdjust(Number.parseInt(storedPaneHeightAdjust));
        }
    });

    // This memoizes the pane itself, which may or may not include the tab list, depending on the toolbar mode.
    const pane = useMemo(() => {
        return (
            <>
                {(topPaneComponents.length > 0 || bottomPaneComponents.length > 0) && (
                    <div className={`${classes.pane} ${alignment === "left" ? classes.paneLeft : classes.paneRight}`}>
                        <Collapse orientation="horizontal" visible={!collapsed}>
                            <div className={classes.paneContainer} style={{ width: `${width}px` }}>
                                {/* If toolbar mode is "compact" then the top toolbar is embedded at the top of the pane. */}
                                {toolbarMode === "compact" && (topPaneComponents.length > 1 || topBarComponents.length > 0) && (
                                    <>
                                        <div className={classes.barDiv}>
                                            {/* The tablist gets merged in with the toolbar. */}
                                            {topPaneTabList}
                                            <Toolbar location="top" components={topBarComponents} />
                                        </div>
                                    </>
                                )}

                                {/* Render the top pane content. */}
                                <div className={classes.paneContent}>
                                    {topSelectedTab?.title ? (
                                        <>
                                            <Title3 className={classes.paneHeader}>{topSelectedTab.title}</Title3>
                                            <Divider inset className={classes.headerDivider} appearance="brand" />
                                        </>
                                    ) : null}
                                    {topSelectedTab?.content && <topSelectedTab.content />}
                                </div>

                                {/* If we have both top and bottom panes, show a divider. This divider is also the resizer for the bottom pane. */}
                                {topPaneComponents.length > 0 && bottomPaneComponents.length > 0 && (
                                    <Divider
                                        ref={paneVerticalResizeHandleRef}
                                        className={classes.headerDivider}
                                        style={{ margin: "0", minHeight: tokens.spacingVerticalM, cursor: "ns-resize" }}
                                    />
                                )}

                                {/* Render the bottom pane tablist. */}
                                {bottomPaneComponents.length > 1 && (
                                    <>
                                        <div className={classes.barDiv}>{bottomPaneTabList}</div>
                                    </>
                                )}

                                {/* Render the bottom pane content. This is the element that can be resized vertically. */}
                                <div
                                    ref={paneVerticalResizeElementRef}
                                    className={classes.paneContent}
                                    style={{ height: `clamp(200px,calc(45% + var(${paneHeightAdjustCSSVar}, 0px)), 100% - 300px)`, flex: "0 0 auto" }}
                                >
                                    {bottomSelectedTab?.title ? (
                                        <>
                                            <Title3 className={classes.paneHeader}>{bottomSelectedTab.title}</Title3>
                                            <Divider inset className={classes.headerDivider} appearance="brand" />
                                        </>
                                    ) : null}
                                    {bottomSelectedTab?.content && <bottomSelectedTab.content />}
                                </div>

                                {/* If toolbar mode is "compact" then the bottom toolbar is embedded at the bottom of the pane. */}
                                {toolbarMode === "compact" && bottomBarComponents.length > 0 && (
                                    <>
                                        <div className={classes.barDiv}>
                                            <Toolbar location="bottom" components={bottomBarComponents} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Collapse>
                        {/* This is the resizer (width) for the pane container. */}
                        <div
                            className={`${classes.resizer} ${alignment === "left" ? classes.resizerLeft : classes.resizerRight}`}
                            style={{ pointerEvents: `${collapsed ? "none" : "auto"}` }}
                            onPointerDown={onResizerPointerDown}
                        />
                    </div>
                )}
            </>
        );
    }, [topPaneComponents, topSelectedTab, bottomPaneComponents, bottomSelectedTab, collapsed, width, resizing]);

    return [topPaneTabList, pane];
}

export function MakeShellServiceDefinition({
    leftPaneDefaultWidth = 350,
    leftPaneMinWidth = 350,
    rightPaneDefaultWidth = 350,
    rightPaneMinWidth = 350,
    toolbarMode = "full",
    sidePaneMode = "both",
}: ShellServiceOptions = {}): ServiceDefinition<[IShellService, IRootComponentService], []> {
    return {
        friendlyName: "MainView",
        produces: [ShellServiceIdentity, RootComponentServiceIdentity],
        factory: () => {
            const topBarComponentCollection = new ObservableCollection<ToolbarItem>();
            const bottomBarComponentCollection = new ObservableCollection<ToolbarItem>();
            const topLeftPaneComponentCollection = new ObservableCollection<SidePane>();
            const topRightPaneComponentCollection = new ObservableCollection<SidePane>();
            const bottomLeftPaneComponentCollection = new ObservableCollection<SidePane>();
            const bottomRightPaneComponentCollection = new ObservableCollection<SidePane>();
            const contentComponentCollection = new ObservableCollection<CentralContent>();

            const rootComponent: FunctionComponent = () => {
                const classes = useStyles();

                const topBarItems = useOrderedObservableCollection(topBarComponentCollection);
                const bottomBarItems = useOrderedObservableCollection(bottomBarComponentCollection);

                const topLeftPaneItems = useOrderedObservableCollection(topLeftPaneComponentCollection);
                const topRightPaneItems = useOrderedObservableCollection(topRightPaneComponentCollection);
                const bottomLeftPaneItems = useOrderedObservableCollection(bottomLeftPaneComponentCollection);
                const bottomRightPaneItems = useOrderedObservableCollection(bottomRightPaneComponentCollection);

                const hasLeftPaneItems = topLeftPaneItems.length > 0 || bottomLeftPaneItems.length > 0;
                const hasRightPaneItems = topRightPaneItems.length > 0 || bottomRightPaneItems.length > 0;

                // If we are in compact toolbar mode, we may need to move toolbar items from the left to the right or vice versa,
                // depending on whether there are any side panes on that side.
                const coerceToolBarItemHorizontalLocation = (item: ToolbarItem) => {
                    let location = item.horizontalLocation;
                    // Coercion is only needed in compact toolbar mode since there might not be a left or right pane.
                    if (toolbarMode === "compact") {
                        if (location === "left" && !hasLeftPaneItems) {
                            location = "right";
                        }
                        if (location === "right" && !hasRightPaneItems) {
                            location = "left";
                        }
                    }
                    return location;
                };

                const topBarLeftComponents = useMemo(() => topBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "left"), [topBarItems]);
                const topBarRightComponents = useMemo(() => topBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "right"), [topBarItems]);
                const bottomBarLeftComponents = useMemo(() => bottomBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "left"), [bottomBarItems]);
                const bottomBarRightComponents = useMemo(() => bottomBarItems.filter((entry) => coerceToolBarItemHorizontalLocation(entry) === "right"), [bottomBarItems]);

                const contentComponents = useOrderedObservableCollection(contentComponentCollection);

                const [leftPaneTabList, leftPane] = usePane(
                    "left",
                    leftPaneDefaultWidth,
                    leftPaneMinWidth,
                    topLeftPaneItems,
                    bottomLeftPaneItems,
                    toolbarMode,
                    topBarLeftComponents,
                    bottomBarLeftComponents
                );

                const [rightPaneTabList, rightPane] = usePane(
                    "right",
                    rightPaneDefaultWidth,
                    rightPaneMinWidth,
                    topRightPaneItems,
                    bottomRightPaneItems,
                    toolbarMode,
                    topBarRightComponents,
                    bottomBarRightComponents
                );

                return (
                    <div className={classes.mainView}>
                        {/* Only render the top toolbar if the toolbar mode is "full". Otherwise it will be embedded at the top of the side panes. */}
                        {toolbarMode === "full" && (
                            <>
                                <div className={classes.barDiv}>
                                    {leftPaneTabList}
                                    <Toolbar location="top" components={topBarItems} />
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
                                {contentComponents.map((entry) => (
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
                                    <Toolbar location="bottom" components={bottomBarItems} />
                                </div>
                            </>
                        )}
                    </div>
                );
            };
            rootComponent.displayName = "Shell Service Root";

            return {
                addToolbarItem: (entry) => {
                    if (!entry.component.displayName) {
                        entry.component.displayName = `${entry.key} | ${entry.verticalLocation} ${entry.horizontalLocation} bar item`;
                    }

                    if (entry.verticalLocation === "top") {
                        return topBarComponentCollection.add(entry);
                    } else {
                        return bottomBarComponentCollection.add(entry);
                    }
                },
                addSidePane: (entry) => {
                    if (!entry.content.displayName) {
                        entry.content.displayName = `${entry.key} | ${entry.horizontalLocation} pane`;
                    }

                    // When we are in "right" side pane mode, we need to coerce all left panes to be right panes.
                    const coerceSidePaneLocation = (sidePane: SidePane) => {
                        let { horizontalLocation, verticalLocation } = sidePane;
                        if (sidePaneMode === "right") {
                            // All right panes go to right bottom.
                            if (horizontalLocation === "right") {
                                verticalLocation = "bottom";
                            }

                            // All left panes go to right top.
                            if (horizontalLocation === "left") {
                                horizontalLocation = "right";
                                verticalLocation = "top";
                            }
                        }
                        return { horizontalLocation, verticalLocation };
                    };

                    const { horizontalLocation, verticalLocation } = coerceSidePaneLocation(entry);

                    if (horizontalLocation === "left") {
                        if (verticalLocation === "top") {
                            return topLeftPaneComponentCollection.add(entry);
                        } else {
                            return bottomLeftPaneComponentCollection.add(entry);
                        }
                    } else {
                        if (verticalLocation === "top") {
                            return topRightPaneComponentCollection.add(entry);
                        } else {
                            return bottomRightPaneComponentCollection.add(entry);
                        }
                    }
                },
                addCentralContent: (entry) => contentComponentCollection.add(entry),
                rootComponent,
            };
        },
    };
}
