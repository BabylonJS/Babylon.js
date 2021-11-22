import * as React from "react";
import { PopupComponent } from "./popupComponent";
import { Nullable } from "babylonjs/types";
import { GlobalState } from "./globalState";
import { Observer } from "babylonjs/Misc/observable";

interface IPersistentPopupHostComponentProps {
    globalState?: GlobalState;
}

interface IPersistentPopupHostComponentState {
    renderFunction?: Nullable<() => React.ReactNode>;
}

/**
 * This component is a persistent popup host that subscribes to any popup changes 
 * @param props 
 */
export class PersistentPopupHostComponent extends React.Component<IPersistentPopupHostComponentProps, IPersistentPopupHostComponentState> {
    private _renderFunctionChangeObserver?: Nullable<Observer<Nullable<() => React.ReactNode>>>;

    constructor(props : IPersistentPopupHostComponentProps) {
        super(props);

        this.state = {};

        this._renderFunctionChangeObserver = this.props.globalState?.onPopupRenderObservable.add((renderFunction) => {
            this.setState({renderFunction});
        });
    }

    componentWillUnmount() {
        if (this._renderFunctionChangeObserver) {
            this.props.globalState?.onPopupRenderObservable.remove(this._renderFunctionChangeObserver!);
        }
    }

    render() {
        return (
            this.state.renderFunction ? <PopupComponent id="test" title="test" size={{width: 100, height: 100}} onClose={() => {}}>
                {this.state.renderFunction()}
            </PopupComponent> : null
        )
    }
}