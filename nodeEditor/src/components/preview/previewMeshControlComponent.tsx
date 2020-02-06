
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowRestore } from '@fortawesome/free-solid-svg-icons';
import { PreviewMeshType } from './previewMeshType';
import { DataStorage } from '../../dataStorage';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import * as ReactDOM from 'react-dom';

interface IPreviewMeshControlComponent {
    globalState: GlobalState;
    togglePreviewAreaComponent: () => void;
}

export class PreviewMeshControlComponent extends React.Component<IPreviewMeshControlComponent> {

    changeMeshType(newOne: PreviewMeshType) {
        if (this.props.globalState.previewMeshType === newOne) {
            return;
        }

        this.props.globalState.previewMeshType = newOne;
        this.props.globalState.onPreviewCommandActivated.notifyObservers();

        DataStorage.StoreNumber("PreviewMeshType", newOne);

        this.forceUpdate();
    }

    useCustomMesh(evt: any) {
        var files: File[] = evt.target.files;
        if (files && files.length) {
            let file = files[0];

            this.props.globalState.previewMeshFile = file;
            this.props.globalState.previewMeshType = PreviewMeshType.Custom;
            this.props.globalState.onPreviewCommandActivated.notifyObservers();        
            this.forceUpdate();
        }
        (ReactDOM.findDOMNode(this.refs["file-picker"]) as HTMLInputElement).value = "";
    }

    onPopUp() {
        this.props.togglePreviewAreaComponent();
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

        if (this.props.globalState.previewMeshType === PreviewMeshType.Custom) {
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
                                    (ReactDOM.findDOMNode(this.refs["file-picker"]) as HTMLElement).click();
                                }
                            }} />    
                <div style={{
                    display: "none"
                }} title="Preview with a custom mesh" >
                    <input ref="file-picker" id="file-picker" type="file" onChange={evt => this.useCustomMesh(evt)} accept=".gltf, .glb, .babylon, .obj"/>
                </div>
                <div
                    title="Open preview in new window" id="preview-new-window"
                    onClick={() => this.onPopUp()} className="button expand">
                    <FontAwesomeIcon icon={faWindowRestore} />
                </div>                          
            </div>
        );

    }
}