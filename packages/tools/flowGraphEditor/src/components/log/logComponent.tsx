import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";

import "./log.scss";

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    public time = new Date();

    constructor(
        public message: string,
        public isError: boolean,
        /** Optional block reference — when set, clicking the log entry navigates to this block. */
        public block?: FlowGraphBlock
    ) {}
}

export class LogComponent extends React.Component<ILogComponentProps, { logs: LogEntry[] }> {
    private _logConsoleRef: React.RefObject<HTMLDivElement>;
    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
        this._logConsoleRef = React.createRef();
    }

    override componentDidMount() {
        this.props.globalState.onLogRequiredObservable.add((log) => {
            const currentLogs = this.state.logs;
            currentLogs.push(log);

            this.setState({ logs: currentLogs });
        });
    }

    override componentDidUpdate() {
        if (!this._logConsoleRef.current) {
            return;
        }

        this._logConsoleRef.current.scrollTop = this._logConsoleRef.current.scrollHeight;
    }

    private _onLogEntryClick(entry: LogEntry) {
        if (!entry.block || !this.props.globalState.onGetNodeFromBlock) {
            return;
        }
        const node = this.props.globalState.onGetNodeFromBlock(entry.block);
        if (!node) {
            return;
        }
        // Select the node and zoom to it
        this.props.globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: node });
        node.setIsSelected(true, false);

        // Center the canvas on the node
        const ownerCanvas = (node as any)._ownerCanvas;
        if (ownerCanvas && typeof ownerCanvas.zoomToNode === "function") {
            ownerCanvas.zoomToNode(node);
        }
    }

    override render() {
        return (
            <div id="fge-log-console" ref={this._logConsoleRef}>
                {this.state.logs.map((l, i) => {
                    const hasBlock = !!l.block;
                    return (
                        <div
                            key={i}
                            className={"log" + (l.isError ? " error" : "") + (hasBlock ? " clickable" : "")}
                            onClick={hasBlock ? () => this._onLogEntryClick(l) : undefined}
                        >
                            {l.time.getHours() + ":" + l.time.getMinutes() + ":" + l.time.getSeconds() + ": " + l.message}
                        </div>
                    );
                })}
            </div>
        );
    }
}
