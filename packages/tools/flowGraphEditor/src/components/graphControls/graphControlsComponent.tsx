import * as React from "react";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import type { IFlowGraphPendingActivation } from "core/FlowGraph/flowGraphContext";
import type { GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";
import type { IFlowGraphValidationResult } from "core/FlowGraph/flowGraphValidator";
import { FlowGraphValidationSeverity } from "core/FlowGraph/flowGraphValidator";

import "./graphControls.scss";

interface IGraphControlsProps {
    globalState: GlobalState;
}

interface IGraphControlsState {
    graphState: FlowGraphState;
    debugMode: boolean;
    liveValidation: boolean;
    validationResult: Nullable<IFlowGraphValidationResult>;
    breakpointPaused: boolean;
    timeScale: number;
}

/**
 * Toolbar component that provides Start / Pause / Stop / Reset controls for the flow graph.
 */
export class GraphControlsComponent extends React.Component<IGraphControlsProps, IGraphControlsState> {
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _builtObserver: Nullable<Observer<void>> = null;
    private _debugModeObserver: Nullable<Observer<boolean>> = null;
    private _liveValidationObserver: Nullable<Observer<boolean>> = null;
    private _validationResultObserver: Nullable<Observer<Nullable<IFlowGraphValidationResult>>> = null;
    private _breakpointHitObserver: Nullable<Observer<IFlowGraphPendingActivation>> = null;
    private _timeScaleObserver: Nullable<Observer<number>> = null;

    constructor(props: IGraphControlsProps) {
        super(props);
        this.state = {
            graphState: props.globalState.flowGraph.state,
            debugMode: props.globalState.isDebugMode,
            liveValidation: props.globalState.liveValidation,
            validationResult: props.globalState.validationResult,
            breakpointPaused: false,
            timeScale: props.globalState.timeScale,
        };
    }

    override componentDidMount() {
        this._subscribeToFlowGraph();

        // When a new graph is loaded (deserialized), the flowGraph reference on
        // globalState is replaced.  Re-subscribe so we track the *new* graph's state.
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._subscribeToFlowGraph();
        });

        this._debugModeObserver = this.props.globalState.onDebugModeChanged.add((debugMode) => {
            this.setState({ debugMode });
        });

        this._liveValidationObserver = this.props.globalState.onLiveValidationChanged.add((liveValidation) => {
            this.setState({ liveValidation });
        });

        this._validationResultObserver = this.props.globalState.onValidationResultChanged.add((validationResult) => {
            this.setState({ validationResult });
        });

        this._breakpointHitObserver = this.props.globalState.onBreakpointHit.add((activation) => {
            this.setState({ breakpointPaused: true });
            this.props.globalState.onLogRequiredObservable.notifyObservers(
                new LogEntry(`Breakpoint hit: ${activation.block.getClassName()} (${activation.block.name ?? activation.block.uniqueId})`, false)
            );
        });

        this._timeScaleObserver = this.props.globalState.onTimeScaleChanged.add((timeScale) => {
            this.setState({ timeScale });
        });
    }

    override componentWillUnmount() {
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._builtObserver?.remove();
        this._builtObserver = null;
        this._debugModeObserver?.remove();
        this._debugModeObserver = null;
        this._liveValidationObserver?.remove();
        this._liveValidationObserver = null;
        this._validationResultObserver?.remove();
        this._validationResultObserver = null;
        this._breakpointHitObserver?.remove();
        this._breakpointHitObserver = null;
        this._timeScaleObserver?.remove();
        this._timeScaleObserver = null;
    }

    /**
     * (Re-)subscribe to the current flowGraph's onStateChangedObservable and
     * sync the component state with the graph's current state.
     */
    private _subscribeToFlowGraph() {
        // Remove previous subscription (may point to an old FlowGraph instance)
        this._stateObserver?.remove();
        this._stateObserver = null;

        const flowGraph = this.props.globalState.flowGraph;
        if (!flowGraph) {
            return;
        }

        this._stateObserver = flowGraph.onStateChangedObservable.add((newState) => {
            // When the graph stops or is paused externally, clear the breakpoint-paused state
            if (newState === FlowGraphState.Stopped || newState === FlowGraphState.Paused) {
                this.setState({ graphState: newState, breakpointPaused: false });
            } else {
                this.setState({ graphState: newState });
            }
        });

        // Sync immediately – the new graph is likely in Stopped state
        this.setState({ graphState: flowGraph.state });
    }

    private _log(message: string) {
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(message, false));
    }

    private _onStart() {
        try {
            // Stop all auto-playing animation groups on the scene so the flow
            // graph has exclusive control over which animations run.  Without
            // this, the glTF auto-started animation keeps running and masks
            // whatever the PlayAnimation block tries to start.
            const scene = this.props.globalState.sceneContext?.scene;
            if (scene) {
                for (const ag of scene.animationGroups) {
                    if (ag.isPlaying) {
                        ag.stop();
                    }
                }
            }
            this.props.globalState.flowGraph.start();
            this._log("Flow graph started.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error starting graph: ${err}`, true));
        }
    }

    private _onPause() {
        try {
            this.props.globalState.flowGraph.pause();
            this._log("Flow graph paused.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error pausing graph: ${err}`, true));
        }
    }

    private _onStop() {
        try {
            this.props.globalState.flowGraph.stop();
            this.setState({ breakpointPaused: false });
            this._log("Flow graph stopped.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error stopping graph: ${err}`, true));
        }
    }

    private _onContinue() {
        try {
            this.props.globalState.continueExecution();
            this.setState({ breakpointPaused: false });
            this._log("Resuming from breakpoint.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error continuing: ${err}`, true));
        }
    }

    private _onStep() {
        try {
            this.setState({ breakpointPaused: false });
            this.props.globalState.stepExecution();
            // stepExecution is synchronous — if another breakpoint was hit, the
            // observer will have already fired and set breakpointPaused back to true.
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error stepping: ${err}`, true));
        }
    }

    private async _onResetAsync() {
        try {
            this.props.globalState.flowGraph.stop();

            // If a scene was loaded from a snippet, reload it
            if (this.props.globalState.snippetId && this.props.globalState.sceneContext) {
                this._log("Reloading scene snippet...");

                // Wait for the scene context to be rebuilt after the snippet reloads
                const sceneContextReady = new Promise<void>((resolve, reject) => {
                    const observer = this.props.globalState.onSceneContextChanged.add((ctx) => {
                        this.props.globalState.onSceneContextChanged.remove(observer);
                        if (ctx) {
                            resolve();
                        } else {
                            reject(new Error("Snippet reload failed"));
                        }
                    });

                    // Safety timeout so the reset never hangs indefinitely
                    setTimeout(() => {
                        this.props.globalState.onSceneContextChanged.remove(observer);
                        reject(new Error("Snippet reload timed out"));
                    }, 30_000);
                });

                // Request the snippet reload
                this.props.globalState.onReloadSnippetRequested.notifyObservers();

                // Wait for the new scene context to arrive
                await sceneContextReady;

                // Wait for all assets in the new scene to finish loading
                const scene = this.props.globalState.sceneContext!.scene;
                if (!scene.isReady(true)) {
                    this._log("Waiting for scene assets to load...");
                    await scene.whenReadyAsync(true);
                }
            }

            this._log("Flow graph reset. Press Start to run.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error resetting graph: ${err}`, true));
        }
    }

    private _renderValidationSummary(): React.ReactNode {
        const result = this.state.validationResult;
        if (!result || result.issues.length === 0) {
            return null;
        }
        const hasErrors = result.errorCount > 0;
        const cls = hasErrors ? "fge-validation-summary error" : "fge-validation-summary warning";
        const label = hasErrors ? `${result.errorCount}E ${result.warningCount}W` : `${result.warningCount}W`;
        return (
            <span className={cls} title={`${result.errorCount} error(s), ${result.warningCount} warning(s)`}>
                {label}
            </span>
        );
    }

    override render() {
        const { graphState, breakpointPaused } = this.state;
        const isStopped = graphState === FlowGraphState.Stopped;
        const isStarted = graphState === FlowGraphState.Started;
        const isPaused = graphState === FlowGraphState.Paused;

        const canStart = isStopped || isPaused;
        const canPause = isStarted;
        const canStop = isStarted || isPaused;
        const canReset = true; // Always available — reloads the scene and stops the graph
        const canContinue = breakpointPaused;
        const canStep = breakpointPaused;

        const stateLabel = breakpointPaused ? "Breakpoint" : isStopped ? "Stopped" : isStarted ? "Running" : "Paused";
        const stateCls = breakpointPaused ? "state-breakpoint" : isStopped ? "state-stopped" : isStarted ? "state-running" : "state-paused";

        return (
            <div className="fge-graph-controls">
                <button className="fge-ctrl-btn fge-ctrl-start" title="Start" onClick={() => this._onStart()} disabled={!canStart}>
                    ▶
                </button>
                <button className="fge-ctrl-btn fge-ctrl-pause" title="Pause" onClick={() => this._onPause()} disabled={!canPause}>
                    ⏸
                </button>
                <button className="fge-ctrl-btn fge-ctrl-stop" title="Stop" onClick={() => this._onStop()} disabled={!canStop}>
                    ⏹
                </button>
                <button className="fge-ctrl-btn fge-ctrl-reset" title="Reset" onClick={() => void this._onResetAsync()} disabled={!canReset}>
                    ↺
                </button>
                <button className="fge-ctrl-btn fge-ctrl-continue" title="Continue (resume from breakpoint)" onClick={() => this._onContinue()} disabled={!canContinue}>
                    ▶▶
                </button>
                <button className="fge-ctrl-btn fge-ctrl-step" title="Step (execute one block)" onClick={() => this._onStep()} disabled={!canStep}>
                    ▶|
                </button>
                <span className={`fge-ctrl-state ${stateCls}`}>{stateLabel}</span>
                <span className="fge-ctrl-separator" />
                <button
                    className={`fge-ctrl-btn fge-ctrl-debug ${this.state.debugMode ? "active" : ""}`}
                    title={this.state.debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
                    onClick={() => {
                        this.props.globalState.isDebugMode = !this.props.globalState.isDebugMode;
                    }}
                >
                    🔍
                </button>
                <span className="fge-ctrl-separator" />
                <button
                    className="fge-ctrl-btn fge-ctrl-validate"
                    title="Validate graph"
                    onClick={() => {
                        this.props.globalState.runValidation();
                        const result = this.props.globalState.validationResult;
                        if (result && result.issues.length > 0) {
                            const errorStr = result.errorCount > 0 ? `${result.errorCount} error(s)` : "";
                            const warnStr = result.warningCount > 0 ? `${result.warningCount} warning(s)` : "";
                            const parts = [errorStr, warnStr].filter(Boolean).join(", ");
                            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Validation: ${parts}`, result.errorCount > 0));
                            // Emit individual issues as clickable log entries (max 20 to avoid flooding)
                            const maxIssues = 20;
                            for (let i = 0; i < Math.min(result.issues.length, maxIssues); i++) {
                                const issue = result.issues[i];
                                const prefix = issue.severity === FlowGraphValidationSeverity.Error ? "[Error]" : "[Warn]";
                                const blockName = issue.block?.name ?? "Graph";
                                this.props.globalState.onLogRequiredObservable.notifyObservers(
                                    new LogEntry(`  ${prefix} ${blockName}: ${issue.message}`, issue.severity === FlowGraphValidationSeverity.Error, issue.block)
                                );
                            }
                            if (result.issues.length > maxIssues) {
                                this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`  ... and ${result.issues.length - maxIssues} more issue(s).`, false));
                            }
                        } else {
                            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Validation passed — no issues found.", false));
                        }
                    }}
                >
                    ✓
                </button>
                <button
                    className={`fge-ctrl-btn fge-ctrl-live-validate ${this.state.liveValidation ? "active" : ""}`}
                    title={this.state.liveValidation ? "Disable Live Validation" : "Enable Live Validation"}
                    onClick={() => {
                        this.props.globalState.liveValidation = !this.props.globalState.liveValidation;
                    }}
                >
                    ⚡
                </button>
                {this._renderValidationSummary()}
                <span className="fge-ctrl-separator" />
                <div className="fge-time-scale">
                    <span className="fge-time-scale-label">Speed</span>
                    {[0.1, 0.25, 0.5, 1].map((s) => (
                        <button
                            key={s}
                            className={`fge-ctrl-btn fge-time-scale-btn ${this.state.timeScale === s ? "active" : ""}`}
                            title={`${s}× speed`}
                            onClick={() => {
                                this.props.globalState.timeScale = s;
                            }}
                        >
                            {s}×
                        </button>
                    ))}
                </div>
                <span className="fge-ctrl-separator" />
                <button
                    className="fge-ctrl-btn fge-ctrl-help"
                    title="Help"
                    onClick={() => {
                        this.props.globalState.onHelpRequested.notifyObservers(undefined);
                    }}
                >
                    ?
                </button>
            </div>
        );
    }
}
