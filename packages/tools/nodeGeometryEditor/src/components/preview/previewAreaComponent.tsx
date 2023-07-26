import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import wireframe from "./svgs/wireframe.svg";
import { DataStorage } from "core/Misc/dataStorage";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    width: number;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onIsLoadingChangedObserver: Nullable<Observer<boolean>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);
        this.state = { isLoading: true };

        this._onIsLoadingChangedObserver = this.props.globalState.onIsLoadingChanged.add((state) => this.setState({ isLoading: state }));

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onIsLoadingChanged.remove(this._onIsLoadingChangedObserver);
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    _onPointerOverCanvas = () => {
        this.props.globalState.pointerOverCanvas = true;
    };

    _onPointerOutCanvas = () => {
        this.props.globalState.pointerOverCanvas = false;
    };

    changeWireframe(value: boolean) {
        this.props.globalState.wireframe = value;
        DataStorage.WriteBoolean("Wireframe", value);
        this.props.globalState.onWireframeChanged.notifyObservers();
        this.forceUpdate();
    }    

    render() {
        return (
            <>
                <div id="preview" style={{ height: this.props.width + "px" }}>
                    <canvas onPointerOver={this._onPointerOverCanvas} onPointerOut={this._onPointerOutCanvas} id="preview-canvas" />
                    {<div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div>}
                </div>
                <>
                    <div id="preview-config-bar">
                        <div
                            title="Render with wireframe"
                            onClick={() => this.changeWireframe(!this.props.globalState.wireframe)}
                            className={"button back-face" + (this.props.globalState.wireframe ? " selected" : "")}
                        >
                            <img src={wireframe} alt="" />
                        </div>                       
                    </div>
                </>
            </>
        );
    }
}
