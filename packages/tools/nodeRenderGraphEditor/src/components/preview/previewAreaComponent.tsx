import * as React from "react";
import type { GlobalState } from "../../globalState";
import { DataStorage } from "core/Misc/dataStorage";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

import omni from "./svgs/omni.svg";
import directionalRight from "./svgs/directionalRight.svg";
import directionalLeft from "./svgs/directionalLeft.svg";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    onMounted?: () => void;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onIsLoadingChangedObserver: Nullable<Observer<boolean>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);
        this.state = { isLoading: true };

        this._onIsLoadingChangedObserver = this.props.globalState.onIsLoadingChanged.add((state) => {
            this.setState({ isLoading: state });
        });

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onIsLoadingChanged.remove(this._onIsLoadingChangedObserver);
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    override componentDidMount() {
        this.props.onMounted?.();
    }

    _onPointerOverCanvas = () => {
        this.props.globalState.pointerOverCanvas = true;
    };

    _onPointerOutCanvas = () => {
        this.props.globalState.pointerOverCanvas = false;
    };

    override render() {
        return (
            <>
                <div id="preview">
                    <canvas onPointerOver={this._onPointerOverCanvas} onPointerOut={this._onPointerOutCanvas} id="preview-canvas" />
                    {<div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div>}
                </div>
                <>
                    <div id="preview-config-bar">
                        <>
                            <div id="preview-config-bar">
                                <div
                                    title="Turn on/off hemispheric light"
                                    onClick={() => {
                                        this.props.globalState.hemisphericLight = !this.props.globalState.hemisphericLight;
                                        DataStorage.WriteBoolean("HemisphericLight", this.props.globalState.hemisphericLight);
                                        this.props.globalState.onLightUpdated.notifyObservers();
                                        this.forceUpdate();
                                    }}
                                    className={"button hemispheric-light" + (this.props.globalState.hemisphericLight ? " selected" : "")}
                                >
                                    <img src={omni} alt="" />
                                </div>
                                <div
                                    title="Turn on/off direction light #1"
                                    onClick={() => {
                                        this.props.globalState.directionalLight1 = !this.props.globalState.directionalLight1;
                                        DataStorage.WriteBoolean("DirectionalLight1", this.props.globalState.directionalLight1);
                                        this.props.globalState.onLightUpdated.notifyObservers();
                                        this.forceUpdate();
                                    }}
                                    className={"button direction-light-1" + (this.props.globalState.directionalLight1 ? " selected" : "")}
                                >
                                    <img src={directionalRight} alt="" />
                                </div>
                                <div
                                    title="Turn on/off direction light #0"
                                    onClick={() => {
                                        this.props.globalState.directionalLight0 = !this.props.globalState.directionalLight0;
                                        DataStorage.WriteBoolean("DirectionalLight0", this.props.globalState.directionalLight0);
                                        this.props.globalState.onLightUpdated.notifyObservers();
                                        this.forceUpdate();
                                    }}
                                    className={"button direction-light-0" + (this.props.globalState.directionalLight0 ? " selected" : "")}
                                >
                                    <img src={directionalLeft} alt="" />
                                </div>
                            </div>
                        </>
                    </div>
                </>
            </>
        );
    }
}
