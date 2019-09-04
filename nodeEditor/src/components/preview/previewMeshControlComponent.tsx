
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faRing, faCube, faHockeyPuck, faSquareFull } from '@fortawesome/free-solid-svg-icons';
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
            </div>
        );

    }
}