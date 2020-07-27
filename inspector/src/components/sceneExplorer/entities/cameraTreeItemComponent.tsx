import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { Camera } from "babylonjs/Cameras/camera";
import { Scene } from "babylonjs/scene";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faCamera } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ICameraTreeItemComponentProps {
    camera: Camera,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class CameraTreeItemComponent extends React.Component<ICameraTreeItemComponentProps, { isActive: boolean }> {
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;

    constructor(props: ICameraTreeItemComponentProps) {
        super(props);

        const camera = this.props.camera;
        const scene = camera.getScene();

        this.state = { isActive: scene.activeCamera === camera };
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

    render() {
        const isActiveElement = this.state.isActive ? <FontAwesomeIcon icon={faVideo} /> : <FontAwesomeIcon icon={faVideo} className="isNotActive" />;
        const scene = this.props.camera.getScene()!;

        return (
            <div className="cameraTools">
                <TreeItemLabelComponent label={this.props.camera.name} onClick={() => this.props.onClick()} icon={faCamera} color="green" />
                {
                    (!scene.activeCameras || scene.activeCameras.length === 0) &&
                    <div className="activeCamera icon" onClick={() => this.setActive()} title="Set as main camera and attach to controls">
                        {isActiveElement}
                    </div>
                }
                <ExtensionsComponent target={this.props.camera} extensibilityGroups={this.props.extensibilityGroups} />
            </div>
        )
    }
}