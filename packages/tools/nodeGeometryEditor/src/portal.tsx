import * as React from "react";
import type { GlobalState } from "./globalState";
import * as ReactDOM from "react-dom";

interface IPortalProps {
    globalState: GlobalState;
}

export class Portal extends React.Component<IPortalProps> {
    render() {
        return ReactDOM.createPortal(this.props.children, this.props.globalState.hostElement);
    }
}
