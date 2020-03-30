
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { PreviewMeshType } from './previewMeshType';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';

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

    constructor(props: IPreviewMeshControlComponent) {
        super(props);
        this.colorInputRef = React.createRef();
        this.filePickerRef = React.createRef();
    }

    changeMeshType(newOne: PreviewMeshType) {
        if (this.props.globalState.previewMeshType === newOne) {
            return;
        }

        this.props.globalState.previewMeshType = newOne;
        this.props.globalState.onPreviewCommandActivated.notifyObservers();

        DataStorage.WriteNumber("PreviewMeshType", newOne);

        this.forceUpdate();
    }

    useCustomMesh(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            let file = files[0];

            this.props.globalState.previewMeshFile = file;
            this.props.globalState.previewMeshType = PreviewMeshType.Custom;
            this.props.globalState.onPreviewCommandActivated.notifyObservers();
            this.props.globalState.listOfCustomPreviewMeshFiles = [file];       
            this.forceUpdate();
        }
        if(this.filePickerRef.current){
            this.filePickerRef.current.value = ""
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
            { label: "Cube", value: PreviewMeshType.Box },
            { label: "Cylinder", value: PreviewMeshType.Cylinder },
            { label: "Plane", value: PreviewMeshType.Plane },
            { label: "Shader ball", value: PreviewMeshType.ShaderBall },
            { label: "Sphere", value: PreviewMeshType.Sphere },
            { label: "Load...", value: PreviewMeshType.Custom + 1 }
        ];

        if (this.props.globalState.listOfCustomPreviewMeshFiles.length > 0) {
            meshTypeOptions.splice(0, 0, {
                label: "Custom", value: PreviewMeshType.Custom
            });
        }

        return (
            <div id="preview-mesh-bar">
                <OptionsLineComponent label="" options={meshTypeOptions} target={this.props.globalState} 
                            propertyName="previewMeshType"
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                if (value !== PreviewMeshType.Custom + 1) {
                                    this.changeMeshType(value);
                                } else {
                                    this.filePickerRef.current?.click();
                                }
                            }} />
                <div style={{
                    display: "none"
                }} title="Preview with a custom mesh" >
                    <input ref={this.filePickerRef} id="file-picker" type="file" onChange={evt => this.useCustomMesh(evt)} accept=".gltf, .glb, .babylon, .obj"/>
                </div>
                <div
                    title="Turn-table animation"
                    onClick={() => this.changeAnimation()} className="button" id="play-button">
                    {this.props.globalState.rotatePreview ? <img src={pauseIcon} alt=""/> : <img src={playIcon} alt=""/>}
                </div>
                <div 
                id="color-picker-button"
                    title="Background color"
                    className={"button align"}
                    onClick={_ => this.changeBackgroundClick()}
                    >
                    <img src={colorPicker} alt=""/>
                    <label htmlFor="color-picker" id="color-picker-label">
                    </label>
                    <input ref={this.colorInputRef} id="color-picker" type="color" onChange={evt => this.changeBackground(evt.target.value)} />
                </div>
                <div
                    title="Open preview in new window" id="preview-new-window"
                    onClick={() => this.onPopUp()} className="button">
                    <img src={popUpIcon} alt=""/>
                </div>
            </div>
        );
    }
}