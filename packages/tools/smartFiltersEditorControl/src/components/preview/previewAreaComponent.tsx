import * as react from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { FillMode, FixedMode, type PreviewSizeMode } from "../../previewSizeManager.js";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    allowPreviewFillMode: boolean;
}

export class PreviewAreaComponent extends react.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onPreviewResetRequiredObserver: Nullable<Observer<void>>;
    private _onModeChangedObserver: Nullable<Observer<PreviewSizeMode>>;
    private _fixedWidthObserver: Nullable<Observer<number>>;
    private _fixedHeightObserver: Nullable<Observer<number>>;
    private _aspectRatioObserver: Nullable<Observer<string>>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
        this._onPreviewResetRequiredObserver = this.props.globalState.onPreviewResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
        this._onModeChangedObserver = this.props.globalState.previewSizeManager.mode.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._fixedWidthObserver = this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._fixedHeightObserver = this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._aspectRatioObserver = this.props.globalState.previewSizeManager.aspectRatio.onChangedObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.onPreviewResetRequiredObservable.remove(this._onPreviewResetRequiredObserver);
        this.props.globalState.previewSizeManager.mode.onChangedObservable.remove(this._onModeChangedObserver);
        this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.remove(this._fixedWidthObserver);
        this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.remove(this._fixedHeightObserver);
        this.props.globalState.previewSizeManager.aspectRatio.onChangedObservable.remove(this._aspectRatioObserver);
    }

    override render() {
        let divStyle: any;
        let canvasStyle: any;

        switch (this.props.globalState.previewSizeManager.mode.value) {
            case FillMode:
                canvasStyle = { width: "100%", height: "100%" };
                break;
            case FixedMode:
                // divStyle = {
                //     aspectRatio: this.props.globalState.previewSizeManager.fixedWidth.value / (this.props.globalState.previewSizeManager.fixedHeight.value || 0.1),
                // };
                canvasStyle = {
                    width: this.props.globalState.previewSizeManager.fixedWidth.value + "px",
                    height: this.props.globalState.previewSizeManager.fixedHeight.value + "px",
                };
                break;
            case "aspectRatio":
                canvasStyle = divStyle = { aspectRatio: this.props.globalState.previewSizeManager.aspectRatio.value };
                break;
        }

        return (
            <>
                <div id="preview" style={divStyle}>
                    <canvas id="sfe-preview-canvas" style={canvasStyle} className={"preview-background-" + this.props.globalState.previewBackground} />
                    {!this.props.globalState.smartFilter ? <div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div> : <></>}
                </div>
            </>
        );
    }
}
