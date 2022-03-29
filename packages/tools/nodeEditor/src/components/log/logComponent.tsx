import * as React from "react";
import type { GlobalState } from "../../globalState";
import * as ReactDOM from "react-dom";

import "./log.scss";

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    public time = new Date();

    constructor(public message: string, public isError: boolean) {}
}

export class LogComponent extends React.Component<ILogComponentProps, { logs: LogEntry[] }> {
    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
    }

    componentDidMount() {
        this.props.globalState.onLogRequiredObservable.add((log) => {
            const currentLogs = this.state.logs;
            currentLogs.push(log);

            this.setState({ logs: currentLogs });
        });
    }

    componentDidUpdate() {
        const logConsole = ReactDOM.findDOMNode(this.refs["nme-log-console"]) as HTMLElement;
        if (!logConsole) {
            return;
        }

        logConsole.scrollTop = logConsole.scrollHeight;
    }

    render() {
        return (
            <div id="nme-log-console" ref={"log-console"}>
                {this.state.logs.map((l, i) => {
                    return (
                        <div key={i} className={"log" + (l.isError ? " error" : "")}>
                            {l.time.getHours() + ":" + l.time.getMinutes() + ":" + l.time.getSeconds() + ": " + l.message}
                        </div>
                    );
                })}
            </div>
        );
    }
}
