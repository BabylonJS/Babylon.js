import * as react from "react";
import { DefaultPreviewAspectRatio, type GlobalState } from "../../globalState.js";

import popUpIcon from "../../assets/imgs/popOut.svg";
import type { Nullable } from "@babylonjs/core/types";
import type { Observer } from "@babylonjs/core/Misc/observable";
import { OptionsLine } from "@babylonjs/shared-ui-components/lines/optionsLineComponent.js";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent.js";

interface IPreviewAreaControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
    allowPreviewFillMode: boolean;
}

const backgroundOptions = [
    { label: "Grid", value: "grid" },
    { label: "Black", value: "black" },
    { label: "White", value: "white" },
];

const aspectRatioOptions = [
    { label: "16:9", value: "1.77778" },
    { label: "4:3", value: DefaultPreviewAspectRatio },
    { label: "1:1", value: "1.0" },
    { label: "19:6", value: "0.5625" },
    { label: "3:4", value: "0.75" },
];

export class PreviewAreaControlComponent extends react.Component<IPreviewAreaControlComponent, { background: string }> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onPreviewAspectRatioChangedObserver: Nullable<Observer<string>>;
    private _onPreviewFillContainerChangedObserver: Nullable<Observer<boolean>>;

    constructor(props: IPreviewAreaControlComponent) {
        super(props);

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this._onPreviewAspectRatioChangedObserver = this.props.globalState.previewAspectRatio.onChangedObservable.add(
            () => {
                this.forceUpdate();
            }
        );
        this._onPreviewFillContainerChangedObserver =
            this.props.globalState.previewFillContainer.onChangedObservable.add(() => {
                this.forceUpdate();
            });
    }

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.previewAspectRatio.onChangedObservable.remove(this._onPreviewAspectRatioChangedObserver);
        this.props.globalState.previewFillContainer.onChangedObservable.remove(
            this._onPreviewFillContainerChangedObserver
        );
    }

    onPopUp() {
        this.props.togglePreviewAreaComponent();
    }

    override render() {
        return (
            <div id="preview-area-bar">
                <OptionsLine
                    label=""
                    options={backgroundOptions}
                    target={this.props.globalState}
                    propertyName="previewBackground"
                    valuesAreStrings={true}
                    onSelect={() => {
                        this.props.globalState.onPreviewResetRequiredObservable.notifyObservers();
                    }}
                />
                {(!this.props.allowPreviewFillMode || !this.props.globalState.previewFillContainer.value) && (
                    <OptionsLine
                        label=""
                        options={aspectRatioOptions}
                        target={this.props.globalState.previewAspectRatio}
                        propertyName="value"
                        valuesAreStrings={true}
                    />
                )}
                {this.props.allowPreviewFillMode && (
                    <CheckBoxLineComponent
                        label="Fill"
                        isSelected={() => this.props.globalState.previewFillContainer.value}
                        onSelect={(value: boolean) => {
                            this.props.globalState.previewFillContainer.value = value;
                        }}
                    />
                )}
                <div
                    title="Open preview in new window"
                    id="preview-new-window"
                    onClick={() => this.onPopUp()}
                    className="button"
                >
                    <img src={popUpIcon} alt="" />
                </div>
            </div>
        );
    }
}
