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
}

/**
 * Toolbar component that provides Start / Pause / Stop / Reset controls for the flow graph.
 */
export class GraphControlsComponent extends React.Component<IGraphControlsProps, IGraphControlsState> {
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _builtObserver: Nullable<Observer<void>> = null;

    constructor(props: IGraphControlsProps) {
        super(props);
        this.state = {
            graphState: props.globalState.flowGraph.state,
        };
    }

    override componentDidMount() {
        this._subscribeToFlowGraph();

        // When a new graph is loaded (deserialized), the flowGraph reference on
        // globalState is replaced.  Re-subscribe so we track the *new* graph's state.
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._subscribeToFlowGraph();
        });
    }

    override componentWillUnmount() {
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._builtObserver?.remove();
        this._builtObserver = null;
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

    private _onReset() {
        try {
            this.props.globalState.flowGraph.stop();
            this.props.globalState.flowGraph.start();
            this._log("Flow graph reset and started.");
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
        const canReset = isStarted || isPaused;

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
                <button className="fge-ctrl-btn fge-ctrl-reset" title="Reset" onClick={() => this._onReset()} disabled={!canReset}>
                    ↺
                </button>
                <span className={`fge-ctrl-state ${stateCls}`}>{stateLabel}</span>
            </div>
        );
    }
}
