import * as React from "react";
import { Observable, Scene, BaseTexture, Nullable } from "babylonjs";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { RadioButtonLineComponent } from "../../lines/radioLineComponent";
import { Color3LineComponent } from "../../lines/color3LineComponent";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";
import { FogPropertyGridComponent } from "./fogPropertyGridComponent";
import { FileButtonLineComponent } from "../../lines/fileButtonLineComponent";

interface IScenePropertyGridComponentProps {
    scene: Scene,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ScenePropertyGridComponent extends React.Component<IScenePropertyGridComponentProps> {
    private _storedEnvironmentTexture: Nullable<BaseTexture>;

    constructor(props: IScenePropertyGridComponentProps) {
        super(props);
    }

    setRenderingModes(point: boolean, wireframe: boolean) {
        const scene = this.props.scene;
        scene.forcePointsCloud = point;
        scene.forceWireframe = wireframe;
    }

    switchIBL() {
        const scene = this.props.scene;

        if (scene.environmentTexture) {
            this._storedEnvironmentTexture = scene.environmentTexture;
            scene.environmentTexture = null;
        } else {
            scene.environmentTexture = this._storedEnvironmentTexture;
            this._storedEnvironmentTexture = null;
        }
    }

    updateEnvironmentTexture(file: File) {
        let isFileDDS = file.name.toLowerCase().indexOf(".dds") > 0;
        let isFileEnv = file.name.toLowerCase().indexOf(".env") > 0;
        if (!isFileDDS && !isFileEnv) {
            console.error("Unable to update environment texture. Please select a dds or env file.");
            return;
        }

        const scene = this.props.scene;
        BABYLON.Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });
            var url = URL.createObjectURL(blob);
            if (isFileDDS) {
                scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(url, scene, ".dds");
            }
            else {
                scene.environmentTexture = new BABYLON.CubeTexture(url, scene,
                    undefined, undefined, undefined,
                    () => {
                    },
                    (message) => {
                        if (message) {
                            console.error(message);
                        }
                    },
                    undefined, undefined,
                    ".env");
            }
        }, undefined, true);
    }

    render() {
        const scene = this.props.scene;

        const renderingModeGroupObservable = new BABYLON.Observable<RadioButtonLineComponent>();

        return (
            <div className="pane">
                <LineContainerComponent title="RENDERING MODE">
                    <RadioButtonLineComponent onSelectionChangedObservable={renderingModeGroupObservable} label="Point" isSelected={() => scene.forcePointsCloud} onSelect={() => this.setRenderingModes(true, false)} />
                    <RadioButtonLineComponent onSelectionChangedObservable={renderingModeGroupObservable} label="Wireframe" isSelected={() => scene.forceWireframe} onSelect={() => this.setRenderingModes(false, true)} />
                    <RadioButtonLineComponent onSelectionChangedObservable={renderingModeGroupObservable} label="Solid" isSelected={() => !scene.forcePointsCloud && !scene.forceWireframe} onSelect={() => this.setRenderingModes(false, false)} />
                </LineContainerComponent>
                <LineContainerComponent title="ENVIRONMENT">
                    <Color3LineComponent label="Ambient color" target={scene} propertyName="ambientColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Environment texture (IBL)" isSelected={() => scene.environmentTexture != null} onSelect={() => this.switchIBL()} />
                    <FileButtonLineComponent label="Update environment texture" onClick={(file) => this.updateEnvironmentTexture(file)} />
                    <FogPropertyGridComponent scene={scene} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}