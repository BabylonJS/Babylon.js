import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { Skeleton } from 'babylonjs/Bones/skeleton';
import { AnimationGridComponent } from '../animations/animationPropertyGridComponent';
import { SkeletonViewer } from 'babylonjs/Debug/skeletonViewer';
import { CustomPropertyGridComponent } from '../customPropertyGridComponent';

interface ISkeletonPropertyGridComponentProps {
    globalState: GlobalState;
    skeleton: Skeleton,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SkeletonPropertyGridComponent extends React.Component<ISkeletonPropertyGridComponentProps> {
    private _skeletonViewersEnabled = false;
    private _skeletonViewers = new Array<SkeletonViewer>();

    constructor(props: ISkeletonPropertyGridComponentProps) {
        super(props);
        
        this.checkSkeletonViewerState(this.props);
    }

    switchSkeletonViewers() {
        this._skeletonViewersEnabled = !this._skeletonViewersEnabled;
        const scene = this.props.skeleton.getScene();

        if (this._skeletonViewersEnabled) {
            for (var mesh of scene.meshes) {
                if (mesh.skeleton === this.props.skeleton) {
                    var found = false;
                    for (var sIndex = 0; sIndex < this._skeletonViewers.length; sIndex++) {
                        if (this._skeletonViewers[sIndex].skeleton === mesh.skeleton) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        continue;
                    }
                    var viewer = new SkeletonViewer(mesh.skeleton, mesh, scene, true, 0);
                    viewer.isEnabled = true;
                    this._skeletonViewers.push(viewer);
                    if (!mesh.reservedDataStore) {
                        mesh.reservedDataStore = {};
                    }
                    mesh.reservedDataStore.skeletonViewer = viewer;
                }
            }
        } else {
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].mesh.reservedDataStore.skeletonViewer = null;
                this._skeletonViewers[index].dispose();
            }
            this._skeletonViewers = [];

        }
    }

    checkSkeletonViewerState(props: ISkeletonPropertyGridComponentProps) {
        const scene = props.skeleton.getScene();
        this._skeletonViewers = [];

        if (!scene) {
            return;
        }

        for (var mesh of scene.meshes) {
            if (mesh.skeleton === props.skeleton && mesh.reservedDataStore && mesh.reservedDataStore.skeletonViewer) {
                this._skeletonViewers.push(mesh.reservedDataStore.skeletonViewer);
            }
        }

        this._skeletonViewersEnabled = (this._skeletonViewers.length > 0);
    }

    shouldComponentUpdate(nextProps: ISkeletonPropertyGridComponentProps) {
        if (nextProps.skeleton !== this.props.skeleton) {
            this.checkSkeletonViewerState(nextProps);
        }

        return true;
    }

    onOverrideMeshLink() {
        if (!this.props.globalState.onSelectionChangedObservable) {
            return;
        }

        const skeleton = this.props.skeleton;
        this.props.globalState.onSelectionChangedObservable.notifyObservers(skeleton.overrideMesh);
    }        

    render() {
        const skeleton = this.props.skeleton;

        return (
            <div className="pane">
                <CustomPropertyGridComponent globalState={this.props.globalState} target={skeleton}
                    lockObject={this.props.lockObject}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable} />                    
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="ID" value={skeleton.id} />
                    <TextLineComponent label="Bone count" value={skeleton.bones.length.toString()} />
                    {
                        skeleton.overrideMesh &&
                        <TextLineComponent label="Override mesh" value={skeleton.overrideMesh.name} onLink={() => this.onOverrideMeshLink()}/>
                    }                        
                    <CheckBoxLineComponent label="Use texture to store matrices" target={skeleton} propertyName="useTextureToStoreBoneMatrices" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Debug mode" isSelected={() => this._skeletonViewersEnabled} onSelect={() => this.switchSkeletonViewers()} />
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={skeleton} scene={skeleton.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}