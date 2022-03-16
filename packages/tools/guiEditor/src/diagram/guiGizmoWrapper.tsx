import { Nullable } from "core/types";
import { Observer } from "core/Misc/observable";
import * as React from "react";
import { GlobalState } from "../globalState";
import { GuiGizmoComponent } from "./guiGizmo";

export interface IGizmoWrapperProps {
    globalState: GlobalState;
}

export class GizmoWrapper extends React.Component<IGizmoWrapperProps> {
    observer: Nullable<Observer<void>>;
    componentWillMount() {
        this.observer = this.props.globalState.onSelectionChangedObservable.add(() => this.forceUpdate());
    }

    componentWillUnmount() {
        this.props.globalState.onSelectionChangedObservable.remove(this.observer);
    }

    render() {
        const controls = this.props.globalState.selectedControls;
        return (
            <>
                {controls.map((control) => (
                    <GuiGizmoComponent globalState={this.props.globalState} control={control} key={control.uniqueId} />
                ))}
            </>
        );
    }
}
