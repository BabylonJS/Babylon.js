import { type FunctionComponent, type MouseEvent, useCallback, useEffect, useState } from "react";

import { Body1, Button, Input, Tab, TabList, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { AddRegular, DismissRegular } from "@fluentui/react-icons";

import { type GlobalState } from "../../globalState";

interface IGraphTabBarProps {
    globalState: GlobalState;
}

const useStyles = makeStyles({
    bar: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        background: tokens.colorNeutralBackground3,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        flexShrink: 0,
        boxSizing: "border-box",
        overflow: "hidden",
    },
    tabList: {
        flex: 1,
        overflowX: "auto",
        // Hide horizontal scrollbar — the user navigates with arrows / clicks.
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
    },
    tabContent: {
        display: "inline-flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    closeButton: {
        // Slim down the close button so it does not push the tab content too wide.
        minWidth: "auto",
        padding: 0,
        opacity: 0,
        transitionProperty: "opacity",
        transitionDuration: tokens.durationFast,
    },
    closeButtonVisible: {
        opacity: 1,
    },
    // When the tab is hovered, reveal the close button.
    tabHover: {
        ":hover .fge-tab-close": {
            opacity: 1,
        },
    },
    tabRenameInput: {
        width: "120px",
    },
    addButton: {
        flexShrink: 0,
        margin: `0 ${tokens.spacingHorizontalXS}`,
    },
});

/**
 * Tab bar component for switching between multiple flow graphs in the coordinator.
 *
 * Built on Fluent's `TabList` for native keyboard navigation and roving-tabindex behaviour.
 * Each `Tab` shows the graph name (or an inline rename `Input` when the user double-clicks)
 * plus a close button. A trailing `+` button creates a new graph.
 * @returns The rendered tab bar.
 */
export const GraphTabBarComponent: FunctionComponent<IGraphTabBarProps> = ({ globalState }) => {
    const classes = useStyles();

    const [graphs, setGraphs] = useState(() => globalState.coordinator?.flowGraphs.map((g) => ({ name: g.name, uniqueId: g.uniqueId })) ?? []);
    const [activeIndex, setActiveIndex] = useState(globalState.activeGraphIndex);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    const refreshGraphs = useCallback(() => {
        const list = globalState.coordinator?.flowGraphs.map((g) => ({ name: g.name, uniqueId: g.uniqueId })) ?? [];
        setGraphs(list);
        setActiveIndex(globalState.activeGraphIndex);
    }, [globalState]);

    useEffect(() => {
        const listObs = globalState.onGraphListChanged.add(refreshGraphs);
        const activeObs = globalState.onActiveGraphChanged.add(refreshGraphs);
        return () => {
            listObs?.remove();
            activeObs?.remove();
        };
    }, [globalState, refreshGraphs]);

    const startEditing = useCallback(
        (index: number) => {
            const graph = graphs[index];
            if (!graph) {
                return;
            }
            setEditingIndex(index);
            setEditingName(graph.name);
        },
        [graphs]
    );

    const commitRename = useCallback(() => {
        if (editingIndex === null) {
            return;
        }
        const trimmed = editingName.trim();
        if (trimmed) {
            globalState.renameGraph(editingIndex, trimmed);
        }
        setEditingIndex(null);
        setEditingName("");
    }, [editingIndex, editingName, globalState]);

    const cancelRename = useCallback(() => {
        setEditingIndex(null);
        setEditingName("");
    }, []);

    const onAddGraph = useCallback(() => {
        globalState.addGraph();
        globalState.onResetRequiredObservable.notifyObservers(true);
        globalState.onClearUndoStack.notifyObservers();
    }, [globalState]);

    const onCloseTab = useCallback(
        (index: number, evt: MouseEvent) => {
            // Prevent the click from selecting the tab being closed.
            evt.stopPropagation();
            if (graphs.length <= 1) {
                return;
            }
            globalState.removeGraph(index);
            globalState.onResetRequiredObservable.notifyObservers(true);
            globalState.onClearUndoStack.notifyObservers();
        },
        [graphs.length, globalState]
    );

    if (graphs.length === 0) {
        return null;
    }

    // TabList tracks selection by `value` strings — use the graph index as a stable string key.
    return (
        <div className={classes.bar}>
            <TabList
                className={classes.tabList}
                size="small"
                appearance="subtle"
                selectedValue={String(activeIndex)}
                onTabSelect={(_, data) => {
                    if (typeof data.value !== "string") {
                        return;
                    }
                    const index = parseInt(data.value, 10);
                    if (!Number.isNaN(index) && index !== globalState.activeGraphIndex) {
                        globalState.activeGraphIndex = index;
                    }
                }}
            >
                {graphs.map((graph, index) => {
                    const isActive = index === activeIndex;
                    const isEditing = editingIndex === index;
                    return (
                        <Tab key={graph.uniqueId} value={String(index)} className={classes.tabHover} onDoubleClick={() => startEditing(index)}>
                            <div className={classes.tabContent}>
                                {isEditing ? (
                                    <Input
                                        className={classes.tabRenameInput}
                                        size="small"
                                        value={editingName}
                                        onChange={(_, data) => setEditingName(data.value)}
                                        onBlur={commitRename}
                                        onKeyDown={(e) => {
                                            // Stop propagation so the keys don't reach TabList's keyboard handler.
                                            e.stopPropagation();
                                            if (e.key === "Enter") {
                                                commitRename();
                                            } else if (e.key === "Escape") {
                                                cancelRename();
                                            }
                                        }}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <Body1>{graph.name}</Body1>
                                )}
                                {graphs.length > 1 && !isEditing && (
                                    <Tooltip content="Close graph" relationship="label">
                                        <Button
                                            className={mergeClasses("fge-tab-close", classes.closeButton, isActive && classes.closeButtonVisible)}
                                            size="small"
                                            appearance="subtle"
                                            icon={<DismissRegular />}
                                            aria-label={`Close ${graph.name}`}
                                            onClick={(evt) => onCloseTab(index, evt)}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </Tab>
                    );
                })}
            </TabList>
            <Tooltip content="Add new graph" relationship="label">
                <Button className={classes.addButton} size="small" appearance="subtle" icon={<AddRegular />} aria-label="Add new graph" onClick={onAddGraph} />
            </Tooltip>
        </div>
    );
};
