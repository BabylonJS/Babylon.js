import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import wireframe from "./svgs/wireframe.svg";
import matCap from "./svgs/matCap.svg";
import texture from "./svgs/textureIcon.svg";
import vertexColor from "./svgs/vertexColor.svg";
import { PreviewMode } from "./previewMode";

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

    changeWireframe() {
        if (this.props.globalState.previewMode === PreviewMode.Wireframe) {
            this.props.globalState.previewMode = PreviewMode.Normal;
        } else {
            this.props.globalState.previewMode = PreviewMode.Wireframe;
        }
        this.forceUpdate();
    }

    changeVertexColor() {
        if (this.props.globalState.previewMode === PreviewMode.VertexColor) {
            this.props.globalState.previewMode = PreviewMode.Normal;
        } else {
            this.props.globalState.previewMode = PreviewMode.VertexColor;
        }
        this.forceUpdate();
    }

    changeMatCap() {
        if (this.props.globalState.previewMode === PreviewMode.MatCap) {
            this.props.globalState.previewMode = PreviewMode.Normal;
        } else {
            this.props.globalState.previewMode = PreviewMode.MatCap;
        }
        this.forceUpdate();
    }

    changeTexture() {
        if (this.props.globalState.previewMode === PreviewMode.Textured) {
            this.props.globalState.previewMode = PreviewMode.Normal;
        } else {
            this.props.globalState.previewMode = PreviewMode.Textured;
        }
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
                            title="Render with texture"
                            onClick={() => this.changeTexture()}
                            className={"button mat-texture" + (this.props.globalState.previewMode === PreviewMode.Textured ? " selected" : "")}
                        >
                            <img src={texture} alt="" />
                        </div>
                        <div
                            title="Render with mat cap"
                            onClick={() => this.changeMatCap()}
                            className={"button mat-cap" + (this.props.globalState.previewMode === PreviewMode.MatCap ? " selected" : "")}
                        >
                            <img src={matCap} alt="" />
                        </div>
                        <div
                            title="Render with vertex color"
                            onClick={() => this.changeVertexColor()}
                            className={"button vertex-color" + (this.props.globalState.previewMode === PreviewMode.VertexColor ? " selected" : "")}
                        >
                            <img src={vertexColor} alt="" />
                        </div>
                        <div
                            title="Render with wireframe"
                            onClick={() => this.changeWireframe()}
                            className={"button wireframe" + (this.props.globalState.previewMode === PreviewMode.Wireframe ? " selected" : "")}
                        >
                            <img src={wireframe} alt="" />
                        </div>
                    </div>
                </>
            </>
        );
    }
}
