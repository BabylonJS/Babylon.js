import { type FunctionComponent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Button, Dropdown, Input, Option, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
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
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        background: tokens.colorNeutralBackground3,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        flexShrink: 0,
        // Use minHeight (not height) so the bar can grow vertically when controls wrap onto
        // additional rows. Without this, wrapped controls would be clipped by the fixed height.
        minHeight: "36px",
        boxSizing: "border-box",
        flexWrap: "wrap",
    },
    separator: {
        width: "1px",
        height: "20px",
        background: tokens.colorNeutralStroke2,
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
        // Fluent's Button has a baseline min-width that makes short labels like "0.1×" much
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
 * @returns The rendered controls toolbar.
 */
export const GraphControlsComponent: FunctionComponent<IGraphControlsProps> = ({ globalState }) => {
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
            // Stop all auto-playing animation groups on the scene so the flow
            // graph has exclusive control over which animations run.
            const scene = globalState.sceneContext?.scene;
            if (scene) {
                for (const ag of scene.animationGroups) {
                    if (ag.isPlaying) {
                        ag.stop();
                    }
                }
            }
            // Wire the flow graph to the preview scene so events fire on the visible scene.
            const previewScene = globalState.sceneContext?.scene;
            if (previewScene) {
                globalState.flowGraph.setScene(previewScene);
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
            globalState.flowGraph.stop();
            if (globalState.snippetId && globalState.sceneContext) {
                log("Reloading scene snippet...");
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
                        reject(new Error("Snippet reload timed out"));
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
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Validation passed — no issues found.", false));
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

    const stateLabel = breakpointPaused ? "Breakpoint" : isStopped ? "Stopped" : isStarted ? "Running" : "Paused";
    const stateClass = breakpointPaused ? classes.stateBreakpoint : isStopped ? classes.stateStopped : isStarted ? classes.stateRunning : classes.statePaused;

    const validationSummary: ReactNode = (() => {
        if (!validationResult || validationResult.issues.length === 0) {
            return null;
        }
        const hasErrors = validationResult.errorCount > 0;
        const cls = hasErrors ? classes.validationSummaryError : classes.validationSummaryWarning;
        const label = hasErrors ? `${validationResult.errorCount}E ${validationResult.warningCount}W` : `${validationResult.warningCount}W`;
        return (
            <span className={mergeClasses(classes.validationSummary, cls)} title={`${validationResult.errorCount} error(s), ${validationResult.warningCount} warning(s)`}>
                {label}
            </span>
        );
    })();

    const selectedContext = contextList.find((c) => c.index === selectedContextIndex);

    return (
        <div className={classes.bar}>
            <Button
                size="small"
                appearance="subtle"
                icon={<ArrowUndoRegular />}
                title="Undo (Ctrl+Z)"
                disabled={!globalState.stateManager.historyStack?.canUndo}
                onClick={() => {
                    globalState.stateManager.historyStack?.undo();
                    forceUpdate({});
                }}
            />
            <Button
                size="small"
                appearance="subtle"
                icon={<ArrowRedoRegular />}
                title="Redo (Ctrl+Shift+Z)"
                disabled={!globalState.stateManager.historyStack?.canRedo}
                onClick={() => {
                    globalState.stateManager.historyStack?.redo();
                    forceUpdate({});
                }}
            />
            <span className={classes.separator} />
            <Button size="small" appearance="subtle" icon={<PlayRegular />} title="Start" onClick={onStart} disabled={!canStart} />
            <Button size="small" appearance="subtle" icon={<PauseRegular />} title="Pause" onClick={onPause} disabled={!canPause} />
            <Button size="small" appearance="subtle" icon={<StopRegular />} title="Stop" onClick={onStop} disabled={!canStop} />
            <Button size="small" appearance="subtle" icon={<ArrowResetRegular />} title="Reset" onClick={() => void onResetAsync()} />
            <Button size="small" appearance="subtle" icon={<FastForwardRegular />} title="Continue (resume from breakpoint)" onClick={onContinue} disabled={!canContinue} />
            <Button size="small" appearance="subtle" icon={<NextRegular />} title="Step (execute one block)" onClick={onStep} disabled={!canStep} />
            <span className={mergeClasses(classes.state, stateClass)}>{stateLabel}</span>
            <span className={classes.separator} />
            <div className={classes.contextGroup}>
                <span className={classes.label}>Ctx</span>
                <Dropdown
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
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<AddRegular />}
                    title="Add execution context"
                    onClick={() => {
                        const idx = globalState.createNewContext();
                        if (idx >= 0) {
                            globalState.selectedContextIndex = idx;
                            log(`Created context ${idx}.`);
                        }
                    }}
                />
                <Button
                    size="small"
                    appearance="subtle"
                    icon={<SubtractRegular />}
                    title="Remove selected context"
                    disabled={contextList.length <= 1}
                    onClick={() => {
                        if (globalState.removeContextAt(selectedContextIndex)) {
                            log(`Removed context ${selectedContextIndex}.`);
                        }
                    }}
                />
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
                    <Button
                        size="small"
                        appearance="subtle"
                        icon={<EditRegular />}
                        title="Rename selected context"
                        onClick={() => {
                            const ctx = contextList.find((c) => c.index === selectedContextIndex);
                            if (ctx) {
                                setEditingContextIndex(selectedContextIndex);
                                setEditingContextName(ctx.name);
                            }
                        }}
                    />
                )}
            </div>
            <span className={classes.separator} />
            <Button
                size="small"
                appearance={debugMode ? "primary" : "subtle"}
                icon={<BugRegular />}
                title={debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
                onClick={() => {
                    globalState.isDebugMode = !globalState.isDebugMode;
                }}
            />
            <span className={classes.separator} />
            <Button size="small" appearance="subtle" icon={<CheckmarkRegular />} title="Validate graph" onClick={onValidate} />
            <Button
                size="small"
                appearance={liveValidation ? "primary" : "subtle"}
                icon={<FlashRegular />}
                title={liveValidation ? "Disable Live Validation" : "Enable Live Validation"}
                onClick={() => {
                    globalState.liveValidation = !globalState.liveValidation;
                }}
            />
            {validationSummary}
            <span className={classes.separator} />
            <div className={classes.timeScale}>
                <span className={classes.label}>Speed</span>
                {SpeedPresets.map((s) => (
                    <Button
                        key={s}
                        className={classes.speedButton}
                        size="small"
                        appearance={timeScale === s ? "primary" : "subtle"}
                        title={`${s}× speed`}
                        onClick={() => {
                            globalState.timeScale = s;
                        }}
                    >
                        {s}×
                    </Button>
                ))}
            </div>
        </div>
    );
};
