import * as react from "react";
import type { GlobalState } from "./globalState";
import * as reactDOM from "react-dom";

interface IPortalProps {
    globalState: GlobalState;
}

export class Portal extends react.Component<IPortalProps> {
    override render() {
        return reactDOM.createPortal(this.props.children, this.props.globalState.hostElement);
    }
}
