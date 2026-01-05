import * as react from "react";
import { type GlobalState } from "../../globalState.js";

import popUpIcon from "../../assets/imgs/popOut.svg";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent.js";
import { FillMode, FixedMode, type PreviewSizeMode } from "../../previewSizeManager.js";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent.js";

interface IPreviewAreaControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
    allowPreviewFillMode: boolean;
}

const BackgroundOptions = [
    { label: "Grid", value: "grid" },
    { label: "Black", value: "black" },
    { label: "White", value: "white" },
];

const AspectRatioOptions = [
    { label: "16:9", value: "1.77778" },
    { label: "4:3", value: "1.33333" },
    { label: "1:1", value: "1.0" },
    { label: "19:6", value: "0.5625" },
    { label: "3:4", value: "0.75" },
    { label: "Fixed", value: FixedMode },
];

const MaxWidth = 4096;
const MaxHeight = 4096;

/**
 * The control bar above the preview canvas.
 */
export class PreviewAreaControlComponent extends react.Component<IPreviewAreaControlComponent, { background: string }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onModeChangedObservable: Nullable<Observer<PreviewSizeMode>>;
    private _onFixedWidthObserver: Nullable<Observer<number>>;
    private _onFixedHeightObserver: Nullable<Observer<number>>;

    // eslint-disable-next-line babylonjs/available
    constructor(props: IPreviewAreaControlComponent) {
        super(props);

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
        this._onModeChangedObservable = this.props.globalState.previewSizeManager.mode.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._onFixedWidthObserver = this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._onFixedHeightObserver = this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.add(() => {
            this.forceUpdate();
        });
    }

    // eslint-disable-next-line babylonjs/available
    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.previewSizeManager.mode.onChangedObservable.remove(this._onModeChangedObservable);
        this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.remove(this._onFixedWidthObserver);
        this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.remove(this._onFixedHeightObserver);
    }

    private _onPopUp() {
        this.props.togglePreviewAreaComponent();
    }

    // eslint-disable-next-line babylonjs/available
    override render() {
        const aspectRatioOptions = [...AspectRatioOptions];
        if (this.props.allowPreviewFillMode) {
            aspectRatioOptions.push({ label: "Fill", value: FillMode });
        } else if (this.props.globalState.previewSizeManager.mode.value === FillMode) {
            // If fill mode is not allowed, but was previously selected, revert to aspect ratio mode
            this.props.globalState.previewSizeManager.selectedModeOption = this.props.globalState.previewSizeManager.aspectRatio.value;
        }

        return (
            <div id="preview-area-bar">
                <OptionsLine
                    label=""
                    options={BackgroundOptions}
                    target={this.props.globalState}
                    propertyName="previewBackground"
                    valuesAreStrings={true}
                    onSelect={() => {
                        this.props.globalState.onPreviewResetRequiredObservable.notifyObservers();
                    }}
                />
                <OptionsLine label="" options={aspectRatioOptions} target={this.props.globalState.previewSizeManager} propertyName="selectedModeOption" valuesAreStrings={true} />
                {this.props.globalState.previewSizeManager.mode.value === FixedMode && (
                    <>
                        <TextInputLineComponent
                            value={this.props.globalState.previewSizeManager.fixedWidth.value.toString()}
                            numbersOnly={true}
                            onChange={(newValue: string) => {
                                this.props.globalState.previewSizeManager.fixedWidth.value = Math.min(MaxWidth, Number.parseInt(newValue));
                            }}
                        />
                        <TextInputLineComponent
                            value={this.props.globalState.previewSizeManager.fixedHeight.value.toString()}
                            numbersOnly={true}
                            onChange={(newValue: string) => {
                                this.props.globalState.previewSizeManager.fixedHeight.value = Math.min(MaxHeight, Number.parseInt(newValue));
                            }}
                        />
                    </>
                )}
                <div title="Open preview in new window" id="preview-new-window" onClick={() => this._onPopUp()} className="button">
                    <img src={popUpIcon} alt="" />
                </div>
            </div>
        );
    }
}
