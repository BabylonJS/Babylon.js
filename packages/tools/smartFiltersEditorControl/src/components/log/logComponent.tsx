import * as react from "react";
import type { GlobalState } from "../../globalState";

import "../../assets/styles/components/log.scss";

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogEntry {
    public time = new Date();

    constructor(
        public message: string,
        public isError: boolean
    ) {}
}

export class LogComponent extends react.Component<ILogComponentProps, { logs: LogEntry[] }> {
    private _logConsoleRef: React.RefObject<HTMLDivElement>;

    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
        this._logConsoleRef = react.createRef();
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

    override render() {
        return (
            <div id="sfe-log-console" ref={this._logConsoleRef}>
                {this.state.logs.map((l, i) => {
                    return (
                        <div key={i} className={"log" + (l.isError ? " error" : "")}>
                            {l.time.getHours() +
                                ":" +
                                l.time.getMinutes().toLocaleString(undefined, { minimumIntegerDigits: 2 }) +
                                ":" +
                                l.time.getSeconds().toLocaleString(undefined, { minimumIntegerDigits: 2 }) +
                                ": " +
                                l.message}
                        </div>
                    );
                })}
            </div>
        );
    }
}
