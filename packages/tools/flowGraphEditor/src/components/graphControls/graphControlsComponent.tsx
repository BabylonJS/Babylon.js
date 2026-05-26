import { type FunctionComponent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Body1, Caption1, Button, Divider, Dropdown, Input, Option, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import {
    AddRegular,
    ArrowRedoRegular,
    ArrowResetRegular,
    ArrowUndoRegular,
    BugRegular,
    CheckmarkRegular,
    EditRegular,
    FastForwardRegular,
    FlashRegular,
    NextRegular,
    PauseRegular,
    PlayRegular,
    StopRegular,
    SubtractRegular,
} from "@fluentui/react-icons";

import { type Nullable } from "core/types";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { type IFlowGraphValidationResult, FlowGraphValidationSeverity } from "core/FlowGraph/flowGraphValidator";

import { type GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";

interface IGraphControlsProps {
    globalState: GlobalState;
}

const useStyles = makeStyles({
    bar: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        // Use rowGap so that when items wrap onto a second row the rows are spaced sensibly.
        columnGap: tokens.spacingHorizontalXS,
        rowGap: tokens.spacingVerticalXXS,
        flexShrink: 0,
        boxSizing: "border-box",
        flexWrap: "wrap",
    },
    separator: {
        // Fluent's `Divider` defaults to `flex-grow: 1`, which is fine in fixed-width toolbars
        // (see inspector-v2's curve editor topBar). Our toolbar has `flex-wrap: wrap` so that
        // slack does exist on the row - without `flexGrow: 0` each divider would expand to
        // consume it. Width and height pin the visible line.
        flexGrow: 0,
        width: "1px",
        height: "20px",
        margin: `0 ${tokens.spacingHorizontalXS}`,
    },
    label: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        marginRight: tokens.spacingHorizontalXXS,
    },
    state: {
        marginLeft: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
    },
    stateStack: {
        // CSS grid stack: all four labels share grid cell 1/1 so the container's intrinsic
        // width equals the widest label. Only the currently-active label is visible - the
        // others reserve the same space with `visibility: hidden`. This eliminates horizontal
        // shift of subsequent toolbar items as the graph state changes.
        display: "inline-grid",
        marginLeft: tokens.spacingHorizontalS,
    },
    stateStackChild: {
        gridArea: "1 / 1",
        marginLeft: 0,
    },
    stateHidden: {
        visibility: "hidden",
    },
    stateStopped: { color: tokens.colorNeutralForeground3 },
    stateRunning: { color: tokens.colorPaletteGreenForeground1 },
    statePaused: { color: tokens.colorPaletteYellowForeground1 },
    stateBreakpoint: {
        color: tokens.colorPaletteRedForeground1,
        animationName: { from: { opacity: 1 }, to: { opacity: 0.5 } },
        animationDuration: "1s",
        animationIterationCount: "infinite",
        animationDirection: "alternate",
    },
    validationSummary: {
        marginLeft: tokens.spacingHorizontalXS,
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        letterSpacing: "0.03em",
        padding: `2px ${tokens.spacingHorizontalXS}`,
        borderRadius: tokens.borderRadiusSmall,
    },
    validationSummaryError: {
        color: tokens.colorPaletteRedForeground1,
        background: tokens.colorPaletteRedBackground2,
    },
    validationSummaryWarning: {
        color: tokens.colorPaletteYellowForeground1,
        background: tokens.colorPaletteYellowBackground2,
    },
    contextGroup: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS,
    },
    contextDropdown: {
        minWidth: "120px",
        maxWidth: "160px",
    },
    contextRenameInput: { width: "120px" },
    timeScale: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXXS,
    },
    speedButton: {
        // Fluent's Button has a baseline min-width that makes short labels like "0.1x" much
        // wider than they need to be. Collapse to the content's intrinsic width with a small
        // pad so all four presets fit comfortably and don't overflow the toolbar.
        minWidth: "auto",
        paddingLeft: tokens.spacingHorizontalXS,
        paddingRight: tokens.spacingHorizontalXS,
    },
});

const SpeedPresets = [0.1, 0.25, 0.5, 1] as const;

/**
 * Toolbar component that provides Start / Pause / Stop / Reset controls for the flow graph.
 *
 * Help and How-to-use buttons have moved to the shell's bottom-right toolbar (registered
 * by `toolbarService.tsx`).  Everything else stays in this in-canvas controls bar.
 * @param props - The component props.
 * @returns The rendered controls toolbar.
 */
export const GraphControlsComponent: FunctionComponent<IGraphControlsProps> = (props) => {
    const { globalState } = props;
    const classes = useStyles();

    const [graphState, setGraphState] = useState<FlowGraphState>(globalState.flowGraph.state);
    const [debugMode, setDebugMode] = useState(globalState.isDebugMode);
    const [liveValidation, setLiveValidation] = useState(globalState.liveValidation);
    const [validationResult, setValidationResult] = useState<Nullable<IFlowGraphValidationResult>>(globalState.validationResult);
    const [breakpointPaused, setBreakpointPaused] = useState(false);
    const [timeScale, setTimeScale] = useState(globalState.timeScale);
    const [contextList, setContextList] = useState(globalState.getContextList());
    const [selectedContextIndex, setSelectedContextIndex] = useState(globalState.selectedContextIndex);
    const [editingContextIndex, setEditingContextIndex] = useState<number | null>(null);
    const [editingContextName, setEditingContextName] = useState("");
    const [, forceUpdate] = useState({});

    // Re-subscribe to the active flow graph's state observable whenever the graph reference
    // is replaced (e.g. after deserialization).
    const stateObserverRef = useRef<{ remove: () => void } | null>(null);
    useEffect(() => {
        const subscribeToFlowGraph = () => {
            stateObserverRef.current?.remove();
            const flowGraph = globalState.flowGraph;
            if (!flowGraph) {
                return;
            }
            const obs = flowGraph.onStateChangedObservable.add((newState) => {
                if (newState === FlowGraphState.Stopped || newState === FlowGraphState.Paused) {
                    setGraphState(newState);
                    setBreakpointPaused(false);
                } else {
                    setGraphState(newState);
                }
                setContextList(globalState.getContextList());
            });
            stateObserverRef.current = { remove: () => obs?.remove() };
            setGraphState(flowGraph.state);
        };

        subscribeToFlowGraph();
        const builtObs = globalState.onBuiltObservable.add(() => {
            subscribeToFlowGraph();
            setContextList(globalState.getContextList());
            setSelectedContextIndex(globalState.selectedContextIndex);
        });
        const debugObs = globalState.onDebugModeChanged.add((m) => setDebugMode(m));
        const liveObs = globalState.onLiveValidationChanged.add((l) => setLiveValidation(l));
        const validationObs = globalState.onValidationResultChanged.add((r) => setValidationResult(r));
        const breakpointObs = globalState.onBreakpointHit.add((activation) => {
            setBreakpointPaused(true);
            globalState.onLogRequiredObservable.notifyObservers(
                new LogEntry(`Breakpoint hit: ${activation.block.getClassName()} (${activation.block.name ?? activation.block.uniqueId})`, false)
            );
        });
        const timeScaleObs = globalState.onTimeScaleChanged.add((t) => setTimeScale(t));
        const contextListObs = globalState.onContextListChanged.add(() => setContextList(globalState.getContextList()));
        const selectedContextObs = globalState.onSelectedContextChanged.add((index) => setSelectedContextIndex(index));

        return () => {
            stateObserverRef.current?.remove();
            stateObserverRef.current = null;
            builtObs?.remove();
            debugObs?.remove();
            liveObs?.remove();
            validationObs?.remove();
            breakpointObs?.remove();
            timeScaleObs?.remove();
            contextListObs?.remove();
            selectedContextObs?.remove();
        };
    }, [globalState]);

    const log = useCallback(
        (message: string) => {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(message, false));
        },
        [globalState]
    );

    const onStart = useCallback(() => {
        try {
            // Wire the flow graph to the preview scene so events fire on the visible scene.
            const previewScene = globalState.sceneContext?.scene;
            if (previewScene) {
                globalState.snapshotUserVariables();
                globalState.flowGraph.setScene(previewScene);
                globalState.restoreSavedContexts();
                const inputElement = previewScene.getEngine().getInputElement();
                inputElement?.focus();
            }
            globalState.flowGraph.start();
            log("Flow graph started.");
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error starting graph: ${err}`, true));
        }
    }, [globalState, log]);

    const onPause = useCallback(() => {
        try {
            globalState.flowGraph.pause();
            log("Flow graph paused.");
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error pausing graph: ${err}`, true));
        }
    }, [globalState, log]);

    const onStop = useCallback(() => {
        try {
            globalState.snapshotUserVariables();
            globalState.flowGraph.stop();
            globalState.restoreSavedContexts();
            setBreakpointPaused(false);
            log("Flow graph stopped.");
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error stopping graph: ${err}`, true));
        }
    }, [globalState, log]);

    const onContinue = useCallback(() => {
        try {
            globalState.continueExecution();
            setBreakpointPaused(false);
            log("Resuming from breakpoint.");
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error continuing: ${err}`, true));
        }
    }, [globalState, log]);

    const onStep = useCallback(() => {
        try {
            setBreakpointPaused(false);
            globalState.stepExecution();
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error stepping: ${err}`, true));
        }
    }, [globalState]);

    const onResetAsync = useCallback(async () => {
        try {
            globalState.snapshotUserVariables();
            globalState.flowGraph.stop();
            globalState.restoreSavedContexts();
            const canReloadScene = globalState.sceneSource === "snippet" || globalState.sceneSource === "default" || (!globalState.sceneSource && !globalState.snippetId);
            if (canReloadScene && globalState.sceneContext) {
                log(globalState.sceneSource === "snippet" ? "Reloading scene snippet..." : "Recreating default scene...");
                const sceneContextReady = new Promise<void>((resolve, reject) => {
                    const observer = globalState.onSceneContextChanged.add((ctx) => {
                        globalState.onSceneContextChanged.remove(observer);
                        if (ctx) {
                            resolve();
                        } else {
                            reject(new Error("Snippet reload failed"));
                        }
                    });
                    setTimeout(() => {
                        globalState.onSceneContextChanged.remove(observer);
                        reject(new Error("Scene reload timed out"));
                    }, 30_000);
                });
                globalState.onReloadSnippetRequested.notifyObservers();
                await sceneContextReady;
                const scene = globalState.sceneContext!.scene;
                if (!scene.isReady(true)) {
                    log("Waiting for scene assets to load...");
                    await scene.whenReadyAsync(true);
                }
            }
            log("Flow graph reset. Press Start to run.");
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error resetting graph: ${err}`, true));
        }
    }, [globalState, log]);

    const commitContextRename = useCallback(() => {
        if (editingContextIndex === null) {
            return;
        }
        const trimmed = editingContextName.trim();
        if (trimmed) {
            globalState.renameContext(editingContextIndex, trimmed);
        }
        setEditingContextIndex(null);
        setEditingContextName("");
    }, [editingContextIndex, editingContextName, globalState]);

    const onValidate = useCallback(() => {
        globalState.runValidation();
        const result = globalState.validationResult;
        if (result && result.issues.length > 0) {
            const errorStr = result.errorCount > 0 ? `${result.errorCount} error(s)` : "";
            const warnStr = result.warningCount > 0 ? `${result.warningCount} warning(s)` : "";
            const parts = [errorStr, warnStr].filter(Boolean).join(", ");
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Validation: ${parts}`, result.errorCount > 0));
            const maxIssues = 20;
            for (let i = 0; i < Math.min(result.issues.length, maxIssues); i++) {
                const issue = result.issues[i];
                const prefix = issue.severity === FlowGraphValidationSeverity.Error ? "[Error]" : "[Warn]";
                const blockName = issue.block?.name ?? "Graph";
                globalState.onLogRequiredObservable.notifyObservers(
                    new LogEntry(`  ${prefix} ${blockName}: ${issue.message}`, issue.severity === FlowGraphValidationSeverity.Error, issue.block)
                );
            }
            if (result.issues.length > maxIssues) {
                globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`  ... and ${result.issues.length - maxIssues} more issue(s).`, false));
            }
        } else {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Validation passed - no issues found.", false));
        }
    }, [globalState]);

    const isStopped = graphState === FlowGraphState.Stopped;
    const isStarted = graphState === FlowGraphState.Started;
    const isPaused = graphState === FlowGraphState.Paused;

    const canStart = isStopped || isPaused;
    const canPause = isStarted;
    const canStop = isStarted || isPaused;
    const canContinue = breakpointPaused;
    const canStep = breakpointPaused;

    // Render all four state labels stacked in the same grid cell so the container reserves
    // space for the widest one ("Breakpoint"). Only the active label is visible; the others are
    // visibility: hidden so they still contribute to the cell's intrinsic width and prevent the
    // surrounding toolbar items from shifting horizontally as state transitions happen.
    const activeStateKey = breakpointPaused ? "Breakpoint" : isStopped ? "Stopped" : isStarted ? "Running" : "Paused";
    const stateEntries: { key: string; label: string; className: string }[] = [
        { key: "Stopped", label: "Stopped", className: classes.stateStopped },
        { key: "Running", label: "Running", className: classes.stateRunning },
        { key: "Paused", label: "Paused", className: classes.statePaused },
        { key: "Breakpoint", label: "Breakpoint", className: classes.stateBreakpoint },
    ];

    const validationSummary: ReactNode = (() => {
        if (!validationResult || validationResult.issues.length === 0) {
            return null;
        }
        const hasErrors = validationResult.errorCount > 0;
        const cls = hasErrors ? classes.validationSummaryError : classes.validationSummaryWarning;
        const label = hasErrors ? `${validationResult.errorCount}E ${validationResult.warningCount}W` : `${validationResult.warningCount}W`;
        return (
            <Tooltip content={`${validationResult.errorCount} error(s), ${validationResult.warningCount} warning(s)`} relationship="description">
                <Body1 className={mergeClasses(classes.validationSummary, cls)}>{label}</Body1>
            </Tooltip>
        );
    })();

    const selectedContext = contextList.find((c) => c.index === selectedContextIndex);

    return (
        <div className={classes.bar}>
            <Tooltip content="Undo (Ctrl+Z)" relationship="label">
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowUndoRegular />}
                    disabled={!globalState.stateManager.historyStack?.canUndo}
                    onClick={() => {
                        globalState.stateManager.historyStack?.undo();
                        forceUpdate({});
                    }}
                />
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)" relationship="label">
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<ArrowRedoRegular />}
                    disabled={!globalState.stateManager.historyStack?.canRedo}
                    onClick={() => {
                        globalState.stateManager.historyStack?.redo();
                        forceUpdate({});
                    }}
                />
            </Tooltip>
            <Divider vertical className={classes.separator} />
            <Tooltip content="Start" relationship="label">
                <Button size="small" appearance="subtle" icon={<PlayRegular />} onClick={onStart} disabled={!canStart} />
            </Tooltip>
            <Tooltip content="Pause" relationship="label">
                <Button size="small" appearance="subtle" icon={<PauseRegular />} onClick={onPause} disabled={!canPause} />
            </Tooltip>
            <Tooltip content="Stop" relationship="label">
                <Button size="small" appearance="subtle" icon={<StopRegular />} onClick={onStop} disabled={!canStop} />
            </Tooltip>
            <Tooltip content="Reset" relationship="label">
                <Button size="small" appearance="subtle" icon={<ArrowResetRegular />} onClick={() => void onResetAsync()} />
            </Tooltip>
            <Tooltip content="Continue (resume from breakpoint)" relationship="label">
                <Button size="small" appearance="subtle" icon={<FastForwardRegular />} onClick={onContinue} disabled={!canContinue} />
            </Tooltip>
            <Tooltip content="Step (execute one block)" relationship="label">
                <Button size="small" appearance="subtle" icon={<NextRegular />} onClick={onStep} disabled={!canStep} />
            </Tooltip>
            <div className={classes.stateStack}>
                {stateEntries.map((entry) => (
                    <Body1
                        key={entry.key}
                        className={mergeClasses(classes.state, classes.stateStackChild, entry.className, entry.key !== activeStateKey ? classes.stateHidden : undefined)}
                    >
                        {entry.label}
                    </Body1>
                ))}
            </div>
            <Divider vertical className={classes.separator} />
            <div className={classes.contextGroup}>
                <Caption1 className={classes.label}>Ctx</Caption1>
                <Dropdown
                    aria-label="Execution context"
                    className={classes.contextDropdown}
                    size="small"
                    value={selectedContext?.name ?? ""}
                    selectedOptions={[String(selectedContextIndex)]}
                    onOptionSelect={(_, data) => {
                        if (data.optionValue !== undefined) {
                            globalState.selectedContextIndex = parseInt(data.optionValue, 10);
                        }
                    }}
                >
                    {contextList.map((ctx) => (
                        <Option key={ctx.uniqueId} value={String(ctx.index)} text={ctx.name}>
                            {ctx.name}
                        </Option>
                    ))}
                </Dropdown>
                <Tooltip content="Add execution context" relationship="label">
                    <Button
                        size="small"
                        appearance="subtle"
                        icon={<AddRegular />}
                        onClick={() => {
                            const idx = globalState.createNewContext();
                            if (idx >= 0) {
                                globalState.selectedContextIndex = idx;
                                log(`Created context ${idx}.`);
                            }
                        }}
                    />
                </Tooltip>
                <Tooltip content="Remove selected context" relationship="label">
                    <Button
                        size="small"
                        appearance="subtle"
                        icon={<SubtractRegular />}
                        disabled={contextList.length <= 1}
                        onClick={() => {
                            if (globalState.removeContextAt(selectedContextIndex)) {
                                log(`Removed context ${selectedContextIndex}.`);
                            }
                        }}
                    />
                </Tooltip>
                {editingContextIndex !== null ? (
                    <Input
                        className={classes.contextRenameInput}
                        size="small"
                        autoFocus
                        value={editingContextName}
                        onChange={(_, data) => setEditingContextName(data.value)}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                                commitContextRename();
                            } else if (e.key === "Escape") {
                                setEditingContextIndex(null);
                                setEditingContextName("");
                            }
                        }}
                        onBlur={commitContextRename}
                    />
                ) : (
                    <Tooltip content="Rename selected context" relationship="label">
                        <Button
                            size="small"
                            appearance="subtle"
                            icon={<EditRegular />}
                            onClick={() => {
                                const ctx = contextList.find((c) => c.index === selectedContextIndex);
                                if (ctx) {
                                    setEditingContextIndex(selectedContextIndex);
                                    setEditingContextName(ctx.name);
                                }
                            }}
                        />
                    </Tooltip>
                )}
            </div>
            <Divider vertical className={classes.separator} />
            <Tooltip content={debugMode ? "Disable Debug Mode" : "Enable Debug Mode"} relationship="label">
                <Button
                    size="small"
                    appearance={debugMode ? "primary" : "subtle"}
                    icon={<BugRegular />}
                    onClick={() => {
                        globalState.isDebugMode = !globalState.isDebugMode;
                    }}
                />
            </Tooltip>
            <Divider vertical className={classes.separator} />
            <Tooltip content="Validate graph" relationship="label">
                <Button size="small" appearance="subtle" icon={<CheckmarkRegular />} onClick={onValidate} />
            </Tooltip>
            <Tooltip content={liveValidation ? "Disable Live Validation" : "Enable Live Validation"} relationship="label">
                <Button
                    size="small"
                    appearance={liveValidation ? "primary" : "subtle"}
                    icon={<FlashRegular />}
                    onClick={() => {
                        globalState.liveValidation = !globalState.liveValidation;
                    }}
                />
            </Tooltip>
            {validationSummary}
            <Divider vertical className={classes.separator} />
            <div className={classes.timeScale}>
                <Caption1 className={classes.label}>Speed</Caption1>
                {SpeedPresets.map((s) => (
                    <Tooltip key={s} content={`${s}x speed`} relationship="label">
                        <Button
                            className={classes.speedButton}
                            size="small"
                            appearance={timeScale === s ? "primary" : "subtle"}
                            onClick={() => {
                                globalState.timeScale = s;
                            }}
                        >
                            {s}x
                        </Button>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};
