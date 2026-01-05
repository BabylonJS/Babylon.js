import * as React from "react";
import type { GlobalState } from "../../globalState";
import { Color3, Color4 } from "core/Maths/math.color";
import { PreviewType } from "./previewType";
import { DataStorage } from "core/Misc/dataStorage";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";

import popUpIcon from "./svgs/popOut.svg";
import colorPicker from "./svgs/colorPicker.svg";
import envPicker from "./svgs/envPicker.svg";
import pauseIcon from "./svgs/pauseIcon.svg";
import playIcon from "./svgs/playIcon.svg";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";

interface IPreviewMeshControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
    onMounted?: () => void;
}

export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
    private _colorInputRef: React.RefObject<HTMLInputElement>;
    private _filePickerRef: React.RefObject<HTMLInputElement>;
    private _envPickerRef: React.RefObject<HTMLInputElement>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onDropEventObserver: Nullable<Observer<DragEvent>>;
    private _onRefreshPreviewMeshControlComponentRequiredObserver: Nullable<Observer<void>>;

    constructor(props: IPreviewMeshControlComponent) {
        super(props);
        this._colorInputRef = React.createRef();
        this._filePickerRef = React.createRef();
        this._envPickerRef = React.createRef();

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });

        this._onDropEventObserver = this.props.globalState.onDropEventReceivedObservable.add((event) => {
            this.useCustomMesh(event);
        });

        this._onRefreshPreviewMeshControlComponentRequiredObserver = this.props.globalState.onRefreshPreviewMeshControlComponentRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.onDropEventReceivedObservable.remove(this._onDropEventObserver);
        this.props.globalState.onRefreshPreviewMeshControlComponentRequiredObservable.remove(this._onRefreshPreviewMeshControlComponentRequiredObserver);
    }

    override componentDidMount(): void {
        this.props.onMounted?.();
    }

    changeMeshType(newOne: PreviewType) {
        if (this.props.globalState.previewType === newOne) {
            return;
        }

        this.props.globalState.previewType = newOne;
        this.props.globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);

        DataStorage.WriteNumber("PreviewType", newOne);

        this.forceUpdate();
    }

    useCustomMesh(evt: any) {
        const files: File[] = evt.target?.files || evt.dataTransfer?.files;
        if (files && files.length) {
            const file = files[0];

            this.props.globalState.previewFile = file;
            this.props.globalState.previewType = PreviewType.Custom;
            this.props.globalState.listOfCustomPreviewFiles = [...files];
            this.props.globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);
            this.forceUpdate();
        }
        if (this._filePickerRef.current) {
            this._filePickerRef.current.value = "";
        }
    }
    useCustomEnv(evt: any) {
        const files: File[] = evt.target?.files || evt.dataTransfer?.files;
        if (files && files.length) {
            const file = files[0];
            this.props.globalState.envFile = file;
            this.props.globalState.envType = PreviewType.Custom;
            this.props.globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);
            this.forceUpdate();
        }
        if (this._envPickerRef.current) {
            this._envPickerRef.current.value = "";
        }
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

    override render() {
        const meshTypeOptions = [
            { label: "Cube", value: PreviewType.Box },
            { label: "Cylinder", value: PreviewType.Cylinder },
            { label: "Plane", value: PreviewType.Plane },
            { label: "Shader ball", value: PreviewType.ShaderBall },
            { label: "Sphere", value: PreviewType.Sphere },
            { label: "Load...", value: PreviewType.Custom + 1 },
        ];

        const particleTypeOptions = [
            { label: "Default", value: PreviewType.DefaultParticleSystem },
            { label: "Bubbles", value: PreviewType.Bubbles },
            { label: "Explosion", value: PreviewType.Explosion },
            { label: "Fire", value: PreviewType.Fire },
            { label: "Rain", value: PreviewType.Rain },
            { label: "Smoke", value: PreviewType.Smoke },
            { label: "Load...", value: PreviewType.Custom + 1 },
        ];

        const gaussianSplattingTypeOptions = [
            { label: "Default", value: PreviewType.Parrot },
            { label: "Bricks Skull", value: PreviewType.BricksSkull },
            { label: "Plants", value: PreviewType.Plants },
            { label: "Load...", value: PreviewType.Custom + 1 },
        ];

        if (this.props.globalState.listOfCustomPreviewFiles.length > 0) {
            meshTypeOptions.splice(0, 0, {
                label: "Custom",
                value: PreviewType.Custom,
            });

            particleTypeOptions.splice(0, 0, {
                label: "Custom",
                value: PreviewType.Custom,
            });

            gaussianSplattingTypeOptions.splice(0, 0, {
                label: "Custom",
                value: PreviewType.Custom,
            });
        }

        const options =
            this.props.globalState.mode === NodeMaterialModes.Particle
                ? particleTypeOptions
                : this.props.globalState.mode === NodeMaterialModes.GaussianSplatting
                  ? gaussianSplattingTypeOptions
                  : meshTypeOptions;
        const accept = this.props.globalState.mode === NodeMaterialModes.Particle ? ".json" : ".*";

        return (
            <div id="preview-mesh-bar">
                {(this.props.globalState.mode === NodeMaterialModes.Material ||
                    this.props.globalState.mode === NodeMaterialModes.Particle ||
                    this.props.globalState.mode === NodeMaterialModes.GaussianSplatting) && (
                    <>
                        <OptionsLine
                            label=""
                            options={options}
                            target={this.props.globalState}
                            propertyName="previewType"
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                if (value !== PreviewType.Custom + 1) {
                                    this.changeMeshType(value);
                                } else {
                                    this._filePickerRef.current?.click();
                                }
                            }}
                        />
                        <div
                            style={{
                                display: "none",
                            }}
                            title="Preview with a custom mesh"
                        >
                            <input ref={this._filePickerRef} multiple id="file-picker" type="file" onChange={(evt) => this.useCustomMesh(evt)} accept={accept} />
                            <input ref={this._envPickerRef} id="env-picker" accept=".env" type="file" onChange={(evt) => this.useCustomEnv(evt)}></input>
                        </div>
                    </>
                )}
                {this.props.globalState.mode === NodeMaterialModes.Material && (
                    <>
                        <div id="env-button" title="Environment image" className="button" onClick={(_) => this._envPickerRef.current?.click()}>
                            <img src={envPicker} alt="" id="env-picker-image" />
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
                )}
                <div title="Open preview in new window" id="preview-new-window" onClick={() => this.onPopUp()} className="button">
                    <img src={popUpIcon} alt="" />
                </div>
            </div>
        );
    }
}
