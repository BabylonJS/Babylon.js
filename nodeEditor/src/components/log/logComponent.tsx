
import * as React from "react";
import { GlobalState } from '../../globalState';
import * as ReactDOM from 'react-dom';

require("./log.scss");

interface ILogComponentProps {
    globalState: GlobalState;
}

export class LogComponent extends React.Component<ILogComponentProps, { logs: string[] }> {

    constructor(props: ILogComponentProps) {
        super(props);

        this.state = { logs: [] };
    }

    componentWillMount() {
        this.props.globalState.onLogRequiredObservable.add(log => {
            let currentLogs = this.state.logs;
            currentLogs.push(...log.split("\r\n"));

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
        return (
            <div id="log-console" ref={"log-console"} >
                {
                    this.state.logs.map((l, i) => {
                        return (
                            <div key={i} className="log">
                                {l}
                            </div>
                        )
                    })
                }
            </div>
        );
    }
}