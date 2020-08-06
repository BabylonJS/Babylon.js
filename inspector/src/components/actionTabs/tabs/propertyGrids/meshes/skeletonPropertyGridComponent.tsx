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
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";


interface ISkeletonPropertyGridComponentProps {
    globalState: GlobalState;
    skeleton: Skeleton,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SkeletonPropertyGridComponent extends React.Component<ISkeletonPropertyGridComponentProps> {
    private _skeletonViewersEnabled = false;

    private _skeletonViewerDisplayOptions = { 
        displayMode : SkeletonViewer.DISPLAY_LINES,
        sphereBaseSize : 0.15,
        sphereScaleUnit : 2,
        sphereFactor : 0.865,
        midStep : 0.235,
        midStepFactor : 0.155

    }

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

                    var viewer = new SkeletonViewer(mesh.skeleton, mesh, scene, false, 3, { 
                        displayMode: this._skeletonViewerDisplayOptions.displayMode,
                        displayOptions : {
                            sphereBaseSize : this._skeletonViewerDisplayOptions.sphereBaseSize,
                            sphereScaleUnit : this._skeletonViewerDisplayOptions.sphereScaleUnit,
                            sphereFactor : this._skeletonViewerDisplayOptions.sphereFactor,
                            midStep : this._skeletonViewerDisplayOptions.midStep,
                            midStepFactor : this._skeletonViewerDisplayOptions.midStepFactor
                        }
                    });

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

    changeDisplayMode(){
        if (this._skeletonViewersEnabled){              
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].changeDisplayMode( this._skeletonViewerDisplayOptions.displayMode || 0 );
            }                   
        }
    }

    changeDisplayOptions(option: string, value: number){
        if (this._skeletonViewersEnabled){              
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].changeDisplayOptions( option, value );
            } 
            if((this._skeletonViewerDisplayOptions as any)[option] !== undefined ){
                (this._skeletonViewerDisplayOptions as any)[option] = value;
            }            
        }
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

        const debugModeOptions = [
            { label: "Lines", value: SkeletonViewer.DISPLAY_LINES },
            { label: "Spheres", value: SkeletonViewer.DISPLAY_SPHERES },
            { label: "Sphere and Spurs", value: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS }
        ];

        let displayOptions;
        if(this._skeletonViewerDisplayOptions.displayMode > SkeletonViewer.DISPLAY_LINES){
            displayOptions = 
            (<LineContainerComponent globalState={this.props.globalState} title="DISPLAY OPTIONS">
                <FloatLineComponent label="sphereBaseSize" target={this._skeletonViewerDisplayOptions} propertyName='sphereBaseSize' onPropertyChangedObservable={this.props.onPropertyChangedObservable} onChange={(value)=>{this.changeDisplayOptions('sphereBaseSize', value)}}/>
                <FloatLineComponent label="sphereScaleUnit" target={this._skeletonViewerDisplayOptions} propertyName='sphereScaleUnit' onPropertyChangedObservable={this.props.onPropertyChangedObservable} onChange={(value)=>{this.changeDisplayOptions('sphereScaleUnit', value)}}/>
                <FloatLineComponent label="sphereFactor" target={this._skeletonViewerDisplayOptions} propertyName='sphereFactor' onPropertyChangedObservable={this.props.onPropertyChangedObservable} onChange={(value)=>{this.changeDisplayOptions('sphereFactor', value)}}/>
                <FloatLineComponent label="midStep" target={this._skeletonViewerDisplayOptions} propertyName='midStep' onPropertyChangedObservable={this.props.onPropertyChangedObservable} onChange={(value)=>{this.changeDisplayOptions('midStep', value)}}/>
                <FloatLineComponent label="midStepFactor" target={this._skeletonViewerDisplayOptions} propertyName='midStepFactor' onPropertyChangedObservable={this.props.onPropertyChangedObservable} onChange={(value)=>{this.changeDisplayOptions('midStepFactor', value)}}/>
            </LineContainerComponent>)
        }else{
             displayOptions = (null)
        }

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
                    
                    <LineContainerComponent globalState={this.props.globalState} title="DEBUG">                        
                        <CheckBoxLineComponent label="Enabled" isSelected={() => this._skeletonViewersEnabled} onSelect={() => this.switchSkeletonViewers()} />
                        <OptionsLineComponent label="displayMode" options={debugModeOptions} target={this._skeletonViewerDisplayOptions} propertyName="displayMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} onSelect={() => this.changeDisplayMode()} />
                        {displayOptions}                   
                    </LineContainerComponent>                    
                </LineContainerComponent>
                <AnimationGridComponent globalState={this.props.globalState} animatable={skeleton} scene={skeleton.getScene()} lockObject={this.props.lockObject} />
            </div>
        );
    }
}