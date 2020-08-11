import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Camera } from "babylonjs/Cameras/camera";
import { Scene } from "babylonjs/scene";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faCamera, faEye } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import { GlobalState } from "../../globalState";

interface ICameraTreeItemComponentProps {
    camera: Camera,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void,
    globalState: GlobalState
}

export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, { isActive: boolean, isGizmoEnabled:boolean }> {
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;

    constructor(props: ICameraTreeItemComponentProps) {
        super(props);

        const camera = this.props.camera;
        const scene = camera.getScene();

        this.state = { isActive: scene.activeCamera === camera, isGizmoEnabled: (camera.reservedDataStore && camera.reservedDataStore.cameraGizmo) };
    }

    setActive(): void {
        const camera = this.props.camera;
        const scene = camera.getScene();

        scene.activeCamera = camera;
        camera.attachControl(scene.getEngine().getRenderingCanvas()!, true);

        this.setState({ isActive: true });
    }

    componentDidMount() {        
        const scene = this.props.camera.getScene();

        this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            const camera = this.props.camera;
            // This will deactivate the previous camera when the camera is changed. Multiple camera's cycle frequently so only do this for single cameras
            if (this.state.isActive && scene.activeCameras.length <= 1 && scene.activeCamera !== camera) {
                camera.detachControl(scene.getEngine().getRenderingCanvas()!);
            }
            let newState =  scene.activeCamera === camera;

            if (newState !== this.state.isActive) {
                this.setState({ isActive: newState});
            }
            
        })
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            const camera = this.props.camera;
            const scene = camera.getScene();

            scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
    }

    toggleGizmo(): void {
        const camera = this.props.camera;
        if(camera.reservedDataStore && camera.reservedDataStore.cameraGizmo){
            if (camera.getScene().reservedDataStore && camera.getScene().reservedDataStore.gizmoManager) {
                camera.getScene().reservedDataStore.gizmoManager.attachToMesh(null);
            }
            this.props.globalState.enableCameraGizmo(camera, false);
            this.setState({ isGizmoEnabled: false });
        }else{
            this.props.globalState.enableCameraGizmo(camera, true);
            this.setState({ isGizmoEnabled: true });
        }
    }

    render() {
        const isActiveElement = this.state.isActive ? <FontAwesomeIcon icon={faVideo} /> : <FontAwesomeIcon icon={faVideo} className="isNotActive" />;
        const scene = this.props.camera.getScene()!;
        const isGizmoEnabled = (this.state.isGizmoEnabled || (this.props.camera && this.props.camera.reservedDataStore && this.props.camera.reservedDataStore.cameraGizmo)) ? <FontAwesomeIcon icon={faEye} /> : <FontAwesomeIcon icon={faEye} className="isNotActive" />;
        return (
            <div className="cameraTools">
                <TreeItemLabelComponent label={this.props.camera.name} onClick={() => this.props.onClick()} icon={faCamera} color="green" />
                {
                    (!scene.activeCameras || scene.activeCameras.length === 0) &&
                    <div className="activeCamera icon" onClick={() => this.setActive()} title="Set as main camera and attach to controls">
                        {isActiveElement}
                    </div>
                }
                <div className="enableGizmo icon" onClick={() => this.toggleGizmo()} title="Turn on/off the camera's gizmo">
                    {isGizmoEnabled}
                </div>
                <ExtensionsComponent target={this.props.camera} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        )
    }
}