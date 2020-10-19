
import * as React from "react";
import { GlobalState } from '../../globalState';
import * as ReactDOM from 'react-dom';

require("./log.scss");

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    constructor(public message: string, public isError: boolean) {

    }
}

export class LogComponent extends React.Component<ILogComponentProps, { logs: LogEntry[] }> {

    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
    }

    componentDidMount() {
        this.props.globalState.onLogRequiredObservable.add(log => {
            let currentLogs = this.state.logs;
            currentLogs.push(log);

            this.setState({ logs: currentLogs });
        });
    }

    componentDidUpdate() {
        const logConsole = ReactDOM.findDOMNode(this.refs["log-console"]) as HTMLElement;
        if (!logConsole) {
            return;
        }

        logConsole.scrollTop = logConsole.scrollHeight;
    }

    render() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();

        return (
            <div id="log-console" ref={"log-console"} >
                {
                    this.state.logs.map((l, i) => {
                        return (
                            <div key={i} className={"log" + (l.isError ? " error" : "")}>
                                {h + ":" + m + ":" + s+ ": " + l.message}
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}