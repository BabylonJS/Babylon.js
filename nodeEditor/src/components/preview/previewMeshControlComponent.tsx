
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { PreviewType } from './previewType';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { Observer } from 'babylonjs/Misc/observable';
import { Nullable } from 'babylonjs/types';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';

const popUpIcon: string = require("./svgs/popOut.svg");
const colorPicker: string = require("./svgs/colorPicker.svg");
const pauseIcon: string = require("./svgs/pauseIcon.svg");
const playIcon: string = require("./svgs/playIcon.svg");

interface IPreviewMeshControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
}

export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {
    private colorInputRef: React.RefObject<HTMLInputElement>;
    private filePickerRef: React.RefObject<HTMLInputElement>;
    private _onResetRequiredObserver: Nullable<Observer<void>>;

    constructor(props: IPreviewMeshControlComponent) {
        super(props);
        this.colorInputRef = React.createRef();
        this.filePickerRef = React.createRef();

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    changeMeshType(newOne: PreviewType) {
        if (this.props.globalState.previewType === newOne) {
            return;
        }

        this.props.globalState.previewType = newOne;
        this.props.globalState.onPreviewCommandActivated.notifyObservers(false);

        DataStorage.WriteNumber("PreviewType", newOne);

        this.forceUpdate();
    }

    useCustomMesh(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            let file = files[0];

            this.props.globalState.previewFile = file;
            this.props.globalState.previewType = PreviewType.Custom;
            this.props.globalState.onPreviewCommandActivated.notifyObservers(false);
            this.props.globalState.listOfCustomPreviewFiles = [file];
            this.forceUpdate();
        }
        if (this.filePickerRef.current) {
            this.filePickerRef.current.value = "";
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
        this.colorInputRef.current?.click();
    }

    render() {

        var meshTypeOptions = [
            { label: "Cube", value: PreviewType.Box },
            { label: "Cylinder", value: PreviewType.Cylinder },
            { label: "Plane", value: PreviewType.Plane },
            { label: "Shader ball", value: PreviewType.ShaderBall },
            { label: "Sphere", value: PreviewType.Sphere },
            { label: "Load...", value: PreviewType.Custom + 1 }
        ];

        var particleTypeOptions = [
            { label: "Default", value: PreviewType.DefaultParticleSystem },
            { label: "Bubbles", value: PreviewType.Bubbles },
            { label: "Explosion", value: PreviewType.Explosion },
            { label: "Fire", value: PreviewType.Fire },
            { label: "Rain", value: PreviewType.Rain },
            { label: "Smoke", value: PreviewType.Smoke },
            { label: "Load...", value: PreviewType.Custom + 1 }
        ];

        if (this.props.globalState.listOfCustomPreviewFiles.length > 0) {
            meshTypeOptions.splice(0, 0, {
                label: "Custom", value: PreviewType.Custom
            });

            particleTypeOptions.splice(0, 0, {
                label: "Custom", value: PreviewType.Custom
            });
        }

        var options = this.props.globalState.mode === NodeMaterialModes.Particle ? particleTypeOptions : meshTypeOptions;
        var accept = this.props.globalState.mode === NodeMaterialModes.Particle ? ".json" : ".gltf, .glb, .babylon, .obj";

        return (
            <div id="preview-mesh-bar">
                { (this.props.globalState.mode === NodeMaterialModes.Material || this.props.globalState.mode === NodeMaterialModes.Particle) && <>
                    <OptionsLineComponent label="" options={options} target={this.props.globalState}
                                propertyName="previewType"
                                noDirectUpdate={true}
                                onSelect={(value: any) => {
                                    if (value !== PreviewType.Custom + 1) {
                                        this.changeMeshType(value);
                                    } else {
                                        this.filePickerRef.current?.click();
                                    }
                                }} />
                    <div style={{
                        display: "none"
                    }} title="Preview with a custom mesh" >
                        <input ref={this.filePickerRef} id="file-picker" type="file" onChange={(evt) => this.useCustomMesh(evt)} accept={accept}/>
                    </div>
                </> }
                { this.props.globalState.mode === NodeMaterialModes.Material && <>
                    <div
                        title="Turn-table animation"
                        onClick={() => this.changeAnimation()} className="button" id="play-button">
                        {this.props.globalState.rotatePreview ? <img src={pauseIcon} alt=""/> : <img src={playIcon} alt=""/>}
                    </div>
                    <div
                    id="color-picker-button"
                        title="Background color"
                        className={"button align"}
                        onClick={(_) => this.changeBackgroundClick()}
                        >
                        <img src={colorPicker} alt=""/>
                        <label htmlFor="color-picker" id="color-picker-label">
                        </label>
                        <input ref={this.colorInputRef} id="color-picker" type="color" onChange={(evt) => this.changeBackground(evt.target.value)} />
                    </div>
                </> }
                <div
                    title="Open preview in new window" id="preview-new-window"
                    onClick={() => this.onPopUp()} className="button">
                    <img src={popUpIcon} alt=""/>
                </div>
            </div>
        );
    }
}