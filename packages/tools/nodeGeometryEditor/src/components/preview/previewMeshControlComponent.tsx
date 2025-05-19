import * as React from "react";
import type { GlobalState } from "../../globalState";
import { Color3, Color4 } from "core/Maths/math.color";
import { DataStorage } from "core/Misc/dataStorage";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

import popUpIcon from "./svgs/popOut.svg";
import colorPicker from "./svgs/colorPicker.svg";
import pauseIcon from "./svgs/pauseIcon.svg";
import playIcon from "./svgs/playIcon.svg";
import frameIcon from "./svgs/frameIcon.svg";
import centerIcon from "./svgs/center.svg";
import offsetIcon from "./svgs/offset.svg";

interface IPreviewMeshControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
    onMounted?: () => void;
}

interface IPreviewMeshControlComponentState {
    center: boolean;
}

export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent, IPreviewMeshControlComponentState> {
    private _colorInputRef: React.RefObject<HTMLInputElement>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onRefreshPreviewMeshControlComponentRequiredObserver: Nullable<Observer<void>>;

    constructor(props: IPreviewMeshControlComponent) {
        super(props);
        this._colorInputRef = React.createRef();

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this._onRefreshPreviewMeshControlComponentRequiredObserver = this.props.globalState.onRefreshPreviewMeshControlComponentRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this.state = { center: true };
    }

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.onRefreshPreviewMeshControlComponentRequiredObservable.remove(this._onRefreshPreviewMeshControlComponentRequiredObserver);
    }

    override componentDidMount(): void {
        this.props.onMounted?.();
    }

    onPopUp() {
        this.props.togglePreviewAreaComponent();
    }

    changeAnimation() {
        this.props.globalState.rotatePreview = !this.props.globalState.rotatePreview;
        this.props.globalState.onAnimationCommandActivated.notifyObservers();
        this.forceUpdate();
    }

    changeBackground(value: string) {
        const newColor = Color3.FromHexString(value);

        DataStorage.WriteNumber("BackgroundColorR", newColor.r);
        DataStorage.WriteNumber("BackgroundColorG", newColor.g);
        DataStorage.WriteNumber("BackgroundColorB", newColor.b);

        const newBackgroundColor = Color4.FromColor3(newColor, 1.0);
        this.props.globalState.backgroundColor = newBackgroundColor;
        this.props.globalState.onPreviewBackgroundChanged.notifyObservers();
    }

    changeBackgroundClick() {
        this._colorInputRef.current?.click();
    }

    frame() {
        this.props.globalState.onFrame.notifyObservers();
    }

    axis() {
        this.props.globalState.onAxis.notifyObservers();
        this.setState({ center: !this.state.center });
    }

    override render() {
        return (
            <div id="preview-mesh-bar">
                <>
                    <div title="Frame camera" onClick={() => this.frame()} className="button" id="frame-button">
                        <img src={frameIcon} alt="" />
                    </div>
                    <div title="Axis location" onClick={() => this.axis()} className="button" id="axis-button">
                        <img src={this.state.center ? centerIcon : offsetIcon} alt="" />
                    </div>
                    <div title="Turn-table animation" onClick={() => this.changeAnimation()} className="button" id="play-button">
                        {this.props.globalState.rotatePreview ? <img src={pauseIcon} alt="" /> : <img src={playIcon} alt="" />}
                    </div>
                    <div id="color-picker-button" title="Background color" className={"button align"} onClick={(_) => this.changeBackgroundClick()}>
                        <img src={colorPicker} alt="" id="color-picker-image" />
                        <input
                            ref={this._colorInputRef}
                            id="color-picker"
                            type="color"
                            value={this.props.globalState.backgroundColor.toHexString().slice(0, 7)}
                            onChange={(evt) => this.changeBackground(evt.target.value)}
                        />
                    </div>
                </>
                <div title="Open preview in new window" id="preview-new-window" onClick={() => this.onPopUp()} className="button">
                    <img src={popUpIcon} alt="" />
                </div>
            </div>
        );
    }
}
