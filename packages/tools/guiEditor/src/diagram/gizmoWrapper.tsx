import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import * as React from "react";
import type { GlobalState } from "../globalState";
import { GizmoGeneric } from "./gizmoGeneric";
import { GizmoLine } from "./gizmoLine";
import type { Line } from "gui/2D/controls/line";

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
                {controls.map((control) =>
                    control.getClassName() === "Line" ? (
                        <GizmoLine globalState={this.props.globalState} control={control as Line} key={control.uniqueId} />
                    ) : (
                        <GizmoGeneric globalState={this.props.globalState} control={control} key={control.uniqueId} />
                    )
                )}
            </>
        );
    }
}
