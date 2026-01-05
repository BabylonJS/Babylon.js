import * as React from "react";
import type { GlobalState } from "./globalState";
import * as ReactDOM from "react-dom";
import type { PropsWithChildren } from "react";

interface IPortalProps {
    globalState: GlobalState;
}

export class Portal extends React.Component<PropsWithChildren<IPortalProps>> {
    override render() {
        return ReactDOM.createPortal(this.props.children, this.props.globalState.hostElement);
    }
}
