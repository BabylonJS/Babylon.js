import * as React from "react";
import { PopupComponent, IPopupComponentProps } from "./popupComponent";
import { Nullable } from "babylonjs/types";
import { GlobalState } from "./globalState";
import { Observer } from "babylonjs/Misc/observable";

interface IPersistentPopupHostComponentProps {
    globalState: GlobalState;
}

interface IPersistentPopupHostComponentState {
    popupProps: IPopupComponentProps,
    popupContentRenderFunction: Nullable<() => React.ReactNode>;
}

/**
 * This component is a persistent popup host that subscribes to any popup changes 
 * @param props 
 */
export class PersistentPopupHostComponent extends React.Component<IPersistentPopupHostComponentProps, IPersistentPopupHostComponentState> {
    private _renderFunctionChangeObserver: Nullable<Observer<Nullable<() => React.ReactNode>>>;
    private _popupPropsChangeObserver: Nullable<Observer<IPopupComponentProps>>;

    constructor(props : IPersistentPopupHostComponentProps) {
        super(props);

        this.state = {
            popupProps: {
                id: "inspector",
                title: "Inspector",
                size: {width: 1024, height: 512},
                onClose: () => {
                    this.setState({popupContentRenderFunction: null});
                }
            },
            popupContentRenderFunction: null
        };

        this._renderFunctionChangeObserver = this.props.globalState.onPopupContentRenderChangedObservable.add((popupContentRenderFunction) => {
            this.setState({popupContentRenderFunction});
        });

        this._popupPropsChangeObserver = this.props.globalState.onPopupPropsChangedObservable.add((popupProps) => {
            popupProps.onClose = (window) => {
                this.setState({popupContentRenderFunction: null});
                popupProps.onClose(window);
            }
            this.setState({popupProps});
        });
    }

    componentWillUnmount() {
        if (this._renderFunctionChangeObserver) {
            this.props.globalState.onPopupContentRenderChangedObservable.remove(this._renderFunctionChangeObserver);
        }
        if (this._popupPropsChangeObserver) {
            this.props.globalState.onPopupPropsChangedObservable.remove(this._popupPropsChangeObserver);
        }
    }

    render() {
        return (
            this.state.popupContentRenderFunction ? <PopupComponent {...this.state.popupProps}>
                {this.state.popupContentRenderFunction()}
            </PopupComponent> : null
        )
    }
}