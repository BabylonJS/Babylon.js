import * as React from "react";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import type { GlobalState } from "../../globalState";
import { LogEntry } from "../log/logComponent";

import "./graphControls.scss";

interface IGraphControlsProps {
    globalState: GlobalState;
}

interface IGraphControlsState {
    graphState: FlowGraphState;
    debugMode: boolean;
}

/**
 * Toolbar component that provides Start / Pause / Stop / Reset controls for the flow graph.
 */
export class GraphControlsComponent extends React.Component<IGraphControlsProps, IGraphControlsState> {
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _builtObserver: Nullable<Observer<void>> = null;
    private _debugModeObserver: Nullable<Observer<boolean>> = null;

    constructor(props: IGraphControlsProps) {
        super(props);
        this.state = {
            graphState: props.globalState.flowGraph.state,
            debugMode: props.globalState.isDebugMode,
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
    }

    override componentWillUnmount() {
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._builtObserver?.remove();
        this._builtObserver = null;
        this._debugModeObserver?.remove();
        this._debugModeObserver = null;
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
            this.setState({ graphState: newState });
        });

        // Sync immediately – the new graph is likely in Stopped state
        this.setState({ graphState: flowGraph.state });
    }

    private _log(message: string) {
        this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(message, false));
    }

    private _onStart() {
        try {
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
            this._log("Flow graph stopped.");
        } catch (err) {
            this.props.globalState.onLogRequiredObservable.notifyObservers(new LogEntry(`Error stopping graph: ${err}`, true));
        }
    }

    private async _onResetAsync() {
        try {
            this.props.globalState.flowGraph.stop();

            // If a scene was loaded from a snippet, reload it
            if (this.props.globalState.snippetId && this.props.globalState.sceneContext) {
                this._log("Reloading scene snippet...");

                // Wait for the scene context to be rebuilt after the snippet reloads
                const sceneContextReady = new Promise<void>((resolve) => {
                    const observer = this.props.globalState.onSceneContextChanged.add((ctx) => {
                        if (ctx) {
                            this.props.globalState.onSceneContextChanged.remove(observer);
                            resolve();
                        }
                    });
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

    override render() {
        const { graphState } = this.state;
        const isStopped = graphState === FlowGraphState.Stopped;
        const isStarted = graphState === FlowGraphState.Started;
        const isPaused = graphState === FlowGraphState.Paused;

        const canStart = isStopped || isPaused;
        const canPause = isStarted;
        const canStop = isStarted || isPaused;
        const canReset = true; // Always available — reloads the scene and stops the graph

        const stateLabel = isStopped ? "Stopped" : isStarted ? "Running" : "Paused";
        const stateCls = isStopped ? "state-stopped" : isStarted ? "state-running" : "state-paused";

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
            </div>
        );
    }
}
