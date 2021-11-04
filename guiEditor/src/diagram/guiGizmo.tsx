import * as React from "react";
import { GlobalState } from "../globalState";

require("./workbenchCanvas.scss");

export interface IGuiGizmoProps {
    globalState: GlobalState;
}


export class GuiGizmoComponent extends React.Component<IGuiGizmoProps> {

    constructor(props: IGuiGizmoProps) {
        super(props);
    }

    componentDidMount() {
    }

    onMove(evt: React.PointerEvent) { 
    }

    onDown(evt: React.PointerEvent<HTMLElement>) {
    }

    updateGizmo() {

    }

    
    
    render() {
        return (
            <div className="around"></div>
        );
    }
}
