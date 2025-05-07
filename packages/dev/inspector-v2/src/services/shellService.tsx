// eslint-disable-next-line import/no-internal-modules
import type { IDisposable } from "core/index";

import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import type { ComponentType, FunctionComponent } from "react";
import type { ComponentInfo } from "../modularity/componentInfo";
import type { IService, ServiceDefinition } from "../modularity/serviceDefinition";
import type { IViewHost } from "../services/viewHost";

import { Button, Divider, makeStyles, shorthands, Tab, TabList, Text, tokens, Tooltip } from "@fluentui/react-components";
import { PanelLeftContractRegular, PanelLeftExpandRegular, PanelRightContractRegular, PanelRightExpandRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";

import { TeachingMoment } from "../components/teachingMoment";
import { useOrderedObservableCollection } from "../hooks/observableHooks";
import { MakePopoverTeachingMoment } from "../hooks/teachingMomentHooks";
import { ObservableCollection } from "../misc/observableCollection";
import { ViewHostIdentity } from "../services/viewHost";

type BarComponentInfo = ComponentInfo & Readonly<{ alignment: "left" | "right"; displayName?: string; suppressTeachingMoment?: boolean }>;
type PaneComponentInfo = Readonly<{ key: string; icon: ComponentType; content: ComponentType; order?: number; title?: string; suppressTeachingMoment?: boolean }>;

export const ShellServiceIdentity = Symbol("ShellService");
export interface IShellService extends IService<typeof ShellServiceIdentity> {
    addToTopBar(entry: BarComponentInfo): IDisposable;
    addToBottomBar(entry: BarComponentInfo): IDisposable;
    addToLeftPane(entry: PaneComponentInfo): IDisposable;
    addToRightPane(entry: PaneComponentInfo): IDisposable;
    addToContent(entry: ComponentInfo): IDisposable;
}

export type ShellServiceOptions = {
    leftPaneDefaultWidth?: number;
    leftPaneMinWidth?: number;
    rightPaneDefaultWidth?: number;
    rightPaneMinWidth?: number;
    toolBarMode?: "full" | "compact";
};

export function MakeShellServiceDefinition({
    leftPaneDefaultWidth = 350,
    leftPaneMinWidth = 350,
    rightPaneDefaultWidth = 350,
    rightPaneMinWidth = 350,
    toolBarMode = "full",
}: ShellServiceOptions = {}): ServiceDefinition<[IShellService], [IViewHost]> {
    return {
        friendlyName: "MainView",
        produces: [ShellServiceIdentity],
        consumes: [ViewHostIdentity],
        factory: (viewHost) => {
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
                    backgroundColor: tokens.colorNeutralBackground1,
                },
                bar: {
                    display: "flex",
                    flex: "1",
                    height: "32px",
                    overflow: "hidden",
                    padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalSNudge}`,
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
                barDivider: {
                    flex: "0 0 auto",
                },
                barItem: {
                    display: "flex",
                },
                paneTabListDiv: {
                    flex: "0 0 auto",
                    display: "flex",
                    columnGap: tokens.spacingHorizontalSNudge,
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
                paneContainerTransitions: {
                    ...shorthands.transition("width", "0.3s", "0s", "ease-in-out"),
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

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const BarItem: FunctionComponent<{
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

            // TODO: Use https://react.fluentui.dev/?path=/docs/components-overflow--docs with priority
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const Bar: FunctionComponent<{ location: "top" | "bottom"; components: BarComponentInfo[] }> = ({ location, components }) => {
                const classes = useStyles();

                const leftComponents = useMemo(() => components.filter((entry) => entry.alignment === "left"), [components]);
                const rightComponents = useMemo(() => components.filter((entry) => entry.alignment === "right"), [components]);

                return (
                    <>
                        {components.length > 0 && (
                            <div className={classes.bar}>
                                <div className={classes.barLeft}>
                                    {leftComponents.map((entry) => (
                                        <BarItem
                                            key={entry.key}
                                            location={location}
                                            alignment={entry.alignment}
                                            id={entry.key}
                                            component={entry.component}
                                            displayName={entry.displayName}
                                            suppressTeachingMoment={entry.suppressTeachingMoment}
                                        />
                                    ))}
                                </div>
                                <div className={classes.barRight}>
                                    {rightComponents.map((entry) => (
                                        <BarItem
                                            key={entry.key}
                                            location={location}
                                            alignment={entry.alignment}
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

            // eslint-disable-next-line @typescript-eslint/naming-convention
            const PaneTab: FunctionComponent<{ alignment: "left" | "right"; id: string } & Pick<PaneComponentInfo, "title" | "icon" | "suppressTeachingMoment">> = ({
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

            function usePane(alignment: "left" | "right", defaultWidth: number, minWidth: number, paneComponents: PaneComponentInfo[], topBarComponents: BarComponentInfo[]) {
                const classes = useStyles();

                const [selectedTab, setSelectedTab] = useState<PaneComponentInfo | undefined>();
                const [collapsed, setCollapsed] = useState(false);

                const onExpandCollapseClick = useCallback(() => {
                    setCollapsed((collapsed) => !collapsed);
                }, [collapsed]);

                const widthStorageKey = `Babylon/Settings/${alignment}Pane/Width`;

                const [width, setWidth] = useState(Number.parseInt(localStorage.getItem(widthStorageKey) ?? "") || Math.max(defaultWidth, minWidth));
                const [resizing, setResizing] = useState(false);

                useEffect(() => {
                    if (!selectedTab && paneComponents.length > 0) {
                        setSelectedTab(paneComponents[0]);
                    } else if (selectedTab && paneComponents.length === 0) {
                        setSelectedTab(undefined);
                    }
                }, [paneComponents]);

                const expandCollapseIcon = useMemo(() => {
                    if (alignment === "left") {
                        return collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />;
                    } else {
                        return collapsed ? <PanelRightExpandRegular /> : <PanelRightContractRegular />;
                    }
                }, [collapsed, alignment]);

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

                const paneTabList = useMemo(() => {
                    return (
                        <>
                            {paneComponents.length > 0 && (
                                <div
                                    className={`${classes.paneTabListDiv} ${alignment === "left" || toolBarMode === "compact" ? classes.paneTabListDivLeft : classes.paneTabListDivRight}`}
                                >
                                    <Divider vertical inset />
                                    {paneComponents.length > 1 && (
                                        <TabList
                                            selectedValue={selectedTab?.key ?? ""}
                                            onTabSelect={(event: SelectTabEvent, data: SelectTabData) => {
                                                const tab = paneComponents.find((entry) => entry.key === data.value);
                                                setSelectedTab(tab);
                                                setCollapsed(false);
                                            }}
                                        >
                                            {paneComponents.map((entry) => (
                                                <PaneTab
                                                    key={entry.key}
                                                    alignment={alignment}
                                                    id={entry.key}
                                                    title={entry.title}
                                                    icon={entry.icon}
                                                    suppressTeachingMoment={entry.suppressTeachingMoment}
                                                />
                                            ))}
                                        </TabList>
                                    )}
                                    {toolBarMode === "full" && (
                                        <Tooltip content={collapsed ? "Show Side Pane" : "Hide Side Pane"} relationship="label">
                                            <Button className={classes.paneCollapseButton} appearance="subtle" icon={expandCollapseIcon} onClick={onExpandCollapseClick} />
                                        </Tooltip>
                                    )}
                                </div>
                            )}
                        </>
                    );
                }, [paneComponents, selectedTab, collapsed]);

                const pane = useMemo(() => {
                    return (
                        <>
                            {paneComponents.length > 0 && (
                                <div className={`${classes.pane} ${alignment === "left" ? classes.paneLeft : classes.paneRight}`}>
                                    <div
                                        className={`${classes.paneContainer} ${resizing ? "" : classes.paneContainerTransitions}}`}
                                        style={{ width: `${collapsed ? 0 : width}px` }}
                                    >
                                        {toolBarMode === "compact" && (paneComponents.length > 1 || topBarComponents.length > 0) && (
                                            <>
                                                <div className={classes.barDiv}>
                                                    {paneTabList}
                                                    <Bar location="top" components={topBarComponents} />
                                                </div>
                                                <Divider className={classes.barDivider} />
                                            </>
                                        )}
                                        <div className={classes.paneContent} style={{ width: `${width}px` }}>
                                            {selectedTab?.title ? (
                                                <>
                                                    <Text className={classes.paneHeader} size={600} weight="medium">
                                                        {selectedTab.title}
                                                    </Text>
                                                    <Divider inset className={classes.headerDivider} appearance="brand" />
                                                </>
                                            ) : null}
                                            {selectedTab?.content && <selectedTab.content />}
                                        </div>
                                    </div>
                                    <div
                                        className={`${classes.resizer} ${alignment === "left" ? classes.resizerLeft : classes.resizerRight}`}
                                        style={{ pointerEvents: `${collapsed ? "none" : "auto"}` }}
                                        onPointerDown={onResizerPointerDown}
                                    />
                                </div>
                            )}
                        </>
                    );
                }, [paneComponents, selectedTab, collapsed, width, resizing]);

                return [paneTabList, pane];
            }

            const topBarComponentCollection = new ObservableCollection<BarComponentInfo>();
            const bottomBarComponentCollection = new ObservableCollection<BarComponentInfo>();
            const leftPaneComponentCollection = new ObservableCollection<PaneComponentInfo>();
            const rightPaneComponentCollection = new ObservableCollection<PaneComponentInfo>();
            const contentComponentCollection = new ObservableCollection<ComponentInfo>();

            viewHost.mainView = () => {
                const classes = useStyles();

                const topBarComponents = useOrderedObservableCollection(topBarComponentCollection);
                const bottomBarComponents = useOrderedObservableCollection(bottomBarComponentCollection);

                const topBarLeftComponents = useMemo(() => topBarComponents.filter((entry) => entry.alignment === "left"), [topBarComponents]);
                const topBarRightComponents = useMemo(() => topBarComponents.filter((entry) => entry.alignment === "right"), [topBarComponents]);

                const leftPaneComponents = useOrderedObservableCollection(leftPaneComponentCollection);
                const rightPaneComponents = useOrderedObservableCollection(rightPaneComponentCollection);
                const contentComponents = useOrderedObservableCollection(contentComponentCollection);

                const [leftPaneTabList, leftPane] = usePane("left", leftPaneDefaultWidth, leftPaneMinWidth, leftPaneComponents, topBarLeftComponents);
                const [rightPaneTabList, rightPane] = usePane("right", rightPaneDefaultWidth, rightPaneMinWidth, rightPaneComponents, topBarRightComponents);

                return (
                    <div className={classes.mainView}>
                        {toolBarMode === "full" && (
                            <>
                                <div className={classes.barDiv}>
                                    {leftPaneTabList}
                                    <Bar location="top" components={topBarComponents} />
                                    {rightPaneTabList}
                                </div>
                                <Divider className={classes.barDivider} />
                            </>
                        )}
                        <div className={classes.verticallyCentralContent}>
                            {leftPane}
                            <div className={classes.centralContent}>
                                {contentComponents.map((entry) => (
                                    <entry.component key={entry.key} />
                                ))}
                            </div>
                            {rightPane}
                        </div>
                        <Divider className={classes.barDivider} />
                        <div className={classes.barDiv}>
                            <Bar location="bottom" components={bottomBarComponents} />
                        </div>
                    </div>
                );
            };

            return {
                addToTopBar: topBarComponentCollection.add.bind(topBarComponentCollection),
                addToBottomBar: bottomBarComponentCollection.add.bind(bottomBarComponentCollection),
                addToLeftPane: leftPaneComponentCollection.add.bind(leftPaneComponentCollection),
                addToRightPane: rightPaneComponentCollection.add.bind(rightPaneComponentCollection),
                addToContent: contentComponentCollection.add.bind(contentComponentCollection),
                dispose: () => {
                    viewHost.mainView = undefined;
                },
            };
        },
    };
}
