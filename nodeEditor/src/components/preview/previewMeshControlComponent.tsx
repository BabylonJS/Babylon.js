
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faRing, faCube, faHockeyPuck, faSquareFull, faPlus } from '@fortawesome/free-solid-svg-icons';
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
        this.props.globalState.previewMeshType = PreviewMeshType.Custom;
    }

    render() {
        return (
            <div id="preview-mesh-bar">
                <div onClick={() => this.changeMeshType(PreviewMeshType.Box)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Box ? " selected" : "")}>
                    <FontAwesomeIcon icon={faCube} />
                </div>
                <div onClick={() => this.changeMeshType(PreviewMeshType.Sphere)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Sphere ? " selected" : "")}>
                    <FontAwesomeIcon icon={faCircle} />
                </div>
                <div onClick={() => this.changeMeshType(PreviewMeshType.Torus)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Torus ? " selected" : "")}>
                    <FontAwesomeIcon icon={faRing} />
                </div>
                <div onClick={() => this.changeMeshType(PreviewMeshType.Cylinder)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Cylinder ? " selected" : "")}>
                    <FontAwesomeIcon icon={faHockeyPuck} />
                </div>
                <div onClick={() => this.changeMeshType(PreviewMeshType.Plane)} className={"button" + (this.props.globalState.previewMeshType === PreviewMeshType.Plane ? " selected" : "")}>
                    <FontAwesomeIcon icon={faSquareFull} />
                </div>                
                <div className={"button align"}>
                    <label htmlFor="file-picker" id="file-picker-label">
                        <FontAwesomeIcon icon={faPlus} />
                    </label>
                    <input ref="file-picker" id="file-picker" type="file" onChange={evt => this.useCustomMesh(evt)} accept=".gltf, .glb, .babylon, .obj"/>
                </div>
            </div>
        );

    }
}