import * as React from "react";
import type { GlobalState } from "../../globalState";

import "./log.scss";

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    constructor(
        public message: string,
        public isError: boolean
    ) {}
}

export class LogComponent extends React.Component<ILogComponentProps, { logs: LogEntry[] }> {
    private _consoleRef: React.RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();
    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
    }

    override componentDidMount() {
        this.props.globalState.onLogRequiredObservable.add((log) => {
            const newLogArray = this.state.logs.map((number) => number);
            newLogArray.push(log);
            this.setState({ logs: newLogArray });
        });
    }

    override componentDidUpdate() {
        const logConsole = this._consoleRef.current;
        if (!logConsole) {
            return;
        }

        logConsole.scrollTop = logConsole.scrollHeight;
    }

    override render() {
        const today = new Date();
        const h = today.getHours();
        const m = today.getMinutes();
        const s = today.getSeconds();

        return (
            <div id="log-console" ref={this._consoleRef}>
                {this.state.logs.map((l, i) => {
                    return (
                        <div key={i} className={"log" + (l.isError ? " error" : "")}>
                            {h + ":" + m + ":" + s + ": " + l.message}
                        </div>
                    );
                })}
            </div>
        );
    }
}
