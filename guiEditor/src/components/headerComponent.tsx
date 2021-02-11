import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowRestore, faTimes, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";

export interface IHeaderComponentProps {
    title: string,
    handleBack?: boolean,
    noExpand?: boolean,
    noClose?: boolean,
    noCommands?: boolean,
    onPopup: () => void,
    onClose: () => void,
    onSelectionChangedObservable?: Observable<any>
}

export class HeaderComponent extends React.Component<IHeaderComponentProps, { isBackVisible: boolean }> {
    private _backStack = new Array<any>();
    private _onSelectionChangeObserver: Nullable<Observer<any>>;

    constructor(props: IHeaderComponentProps) {
        super(props);
        this.state = { isBackVisible: false };
    }

    componentDidMount() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        this._onSelectionChangeObserver = this.props.onSelectionChangedObservable.add((entity) => {
            if (this._backStack.length === 0 || entity !== this._backStack[this._backStack.length - 1]) {
                this._backStack.push(entity);
                this.setState({ isBackVisible: this._backStack.length > 1 });
            }
        });
    }

    componentWillUnmount() {
        if (this._onSelectionChangeObserver) {
            this.props.onSelectionChangedObservable!.remove(this._onSelectionChangeObserver);
        }
    }

    goBack() {
        this._backStack.pop(); // remove current
        var entity = this._backStack[this._backStack.length - 1];

        if (this.props.onSelectionChangedObservable) {
            this.props.onSelectionChangedObservable.notifyObservers(entity);
        }

        this.setState({ isBackVisible: this._backStack.length > 1 });
    }

    renderLogo() {
        if (this.props.noCommands) {
            return null;
        }

        if (this.props.handleBack) {
            if (!this.state.isBackVisible) {
                return null;
            }

            return (
                <div id="back" onClick={() => this.goBack()} >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </div>
            )
        }

        return (
            <img id="logo" style={{top: "0%"}} src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
        )
    }

    render() {
        return (
            <div id="header">
                {this.renderLogo()}
                <div id="title">
                    {this.props.title}
                </div>
                <div id="commands">
                    {
                        !this.props.noCommands && !this.props.noExpand &&
                        <div className="expand" onClick={() => this.props.onPopup()}>
                            <FontAwesomeIcon icon={faWindowRestore} />
                        </div>
                    }
                    {
                        !this.props.noCommands && !this.props.noClose &&
                        <div className="close" onClick={() => this.props.onClose()}>
                            <FontAwesomeIcon icon={faTimes} />
                        </div>
                    }
                </div>
            </div>
        )
    }
}