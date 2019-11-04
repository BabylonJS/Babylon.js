
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faRing, faCube, faHockeyPuck, faSquareFull, faPlus, faDotCircle } from '@fortawesome/free-solid-svg-icons';
import { PreviewMeshType } from './previewMeshType';
import { DataStorage } from '../../dataStorage';

interface IPreviewMeshControlComponent {
    globalState: GlobalState;
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
        (document.getElementById("file-picker")! as HTMLInputElement).value = "";
    }

    render() {
        return (
            <div id="preview-mesh-bar">
                <div
                    title="Preview with a cube" 
                    onClick={() => this.changeMeshType(PreviewMeshType.Box)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Box ? " selected" : "")}>
                    <FontAwesomeIcon icon={faCube} />
                </div>
                <div
                    title="Preview with a sphere"  
                    onClick={() => this.changeMeshType(PreviewMeshType.Sphere)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Sphere ? " selected" : "")}>
                    <FontAwesomeIcon icon={faCircle} />
                </div>
                <div
                    title="Preview with a torus"  
                    onClick={() => this.changeMeshType(PreviewMeshType.Torus)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Torus ? " selected" : "")}>
                    <FontAwesomeIcon icon={faRing} />
                </div>
                <div
                    title="Preview with a cylinder"  
                    onClick={() => this.changeMeshType(PreviewMeshType.Cylinder)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Cylinder ? " selected" : "")}>
                    <FontAwesomeIcon icon={faHockeyPuck} />
                </div>
                <div
                    title="Preview with a plane"  
                    onClick={() => this.changeMeshType(PreviewMeshType.Plane)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Plane ? " selected" : "")}>
                    <FontAwesomeIcon icon={faSquareFull} />
                </div>      
                <div
                    title="Preview with a shader ball"  
                    onClick={() => this.changeMeshType(PreviewMeshType.ShaderBall)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.ShaderBall ? " selected" : "")}>
                    <FontAwesomeIcon icon={faDotCircle} />
                </div>                           
                <div className={"button align"} title="Preview with a custom mesh" >
                    <label htmlFor="file-picker" id="file-picker-label">
                        <FontAwesomeIcon icon={faPlus} />
                    </label>
                    <input ref="file-picker" id="file-picker" type="file" onChange={evt => this.useCustomMesh(evt)} accept=".gltf, .glb, .babylon, .obj"/>
                </div>
            </div>
        );

    }
}