
import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from 'babylonjs/Animations/animation';
import { IconButtonLineComponent } from '../../../lines/iconButtonLineComponent';
import { NumericInputComponent } from '../../../lines/numericInputComponent';
import { AddAnimation } from './addAnimation';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Nullable } from 'babylonjs/types';

interface IEditorControlsProps {
   isTargetedAnimation: boolean;
   entity: IAnimatable | TargetedAnimation;
   selected: Animation | null
   onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
   setNotificationMessage: (message: string) => void;
   selectAnimation: (selected: Animation) => void;
}

export class EditorControls extends React.Component<IEditorControlsProps, {isAnimationTabOpen: boolean, isEditTabOpen: boolean, isLoadTabOpen: boolean, isSaveTabOpen: boolean, isLoopActive: boolean, animationsCount: number; framesPerSecond: number}>{ 
    
    constructor(props: IEditorControlsProps) {
        super(props);
        let count = this.props.isTargetedAnimation ? 1 : (this.props.entity as IAnimatable).animations?.length ?? 0;
        this.state = { isAnimationTabOpen: false, isEditTabOpen: false, isSaveTabOpen: false, isLoadTabOpen: false, isLoopActive: false, animationsCount: count, framesPerSecond: 60 }
    }

    animationsChanged(){
        let recount = (this.props.entity as IAnimatable).animations?.length ?? 0;
        this.setState( { animationsCount: recount } );
    }

    deleteAnimation() {
        let currentSelected = this.props.selected;
        if (this.props.entity instanceof TargetedAnimation) {
            console.log("no animation remove allowed");
        } else {
            let animations = (this.props.entity as IAnimatable).animations;
            if (animations) {
                let updatedAnimations = animations.filter(anim => anim !== currentSelected);
                (this.props.entity as IAnimatable).animations = updatedAnimations as Nullable<Animation[]>;
            }
        }
    }

    setListItem(animation: Animation, i: number) {
        let element;

        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                element = <li className={this.props.selected && this.props.selected.name === animation.name ? 'active' : ''} key={i} onClick={() => this.props.selectAnimation(animation)}>
                    <p>{animation.name}&nbsp;
                    <span>{animation.targetProperty}</span></p>
                    {!(this.props.entity instanceof TargetedAnimation) ? this.props.selected && this.props.selected.name === animation.name ? <IconButtonLineComponent tooltip="Remove" icon="delete" onClick={() => this.deleteAnimation()} /> : null : null}
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR3:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                        <li key={`${i}_z`}>Property <strong>Z</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                        <li key={`${i}_z`}>Property <strong>Z</strong></li>
                        <li key={`${i}_w`}>Property <strong>W</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR3:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR4:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                        <li key={`${i}_a`}>Property <strong>A</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_SIZE:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_width`}>Property <strong>Width</strong></li>
                        <li key={`${i}_height`}>Property <strong>Height</strong></li>
                    </ul>
                </li>
                break;
            default: console.log("not recognized");
                element = null;
                break;
        }

        return element;
    }

    handleTabs(tab: number){

        let state = {isAnimationTabOpen: true, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: false };

        switch(tab){
            case 0:
                state = {isAnimationTabOpen: true, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: false };
                break;
            case 1:
                state = {isAnimationTabOpen: false, isLoadTabOpen: true, isSaveTabOpen: false, isEditTabOpen: false };
                break;
            case 2:
                state = {isAnimationTabOpen: false, isLoadTabOpen: false, isSaveTabOpen: true, isEditTabOpen: false };
                break;
            case 3:
                state = {isAnimationTabOpen: false, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: true };
                break;
        }

        this.setState(state);
    }

    handleChangeFps(fps: number){
        this.setState({framesPerSecond: fps});
    }

    render() { 
        return (
            <div className="animation-list">
            <div className="controls-header">
            {this.props.isTargetedAnimation ? null : <IconButtonLineComponent active={this.state.isAnimationTabOpen} tooltip="Add Animation" icon="medium add-animation" onClick={() => this.handleTabs(0)}></IconButtonLineComponent>}
            <IconButtonLineComponent active={this.state.isLoadTabOpen} tooltip="Load Animation" icon="medium load" onClick={() => this.handleTabs(1)}></IconButtonLineComponent>
            <IconButtonLineComponent active={this.state.isSaveTabOpen} tooltip="Save Animation" icon="medium save" onClick={() => this.handleTabs(2)}></IconButtonLineComponent>
            {this.state.animationsCount === 0 ? null : 
            <IconButtonLineComponent active={this.state.isEditTabOpen} tooltip="Edit Animations" icon="medium animation-edit" onClick={() => this.handleTabs(3)}></IconButtonLineComponent> 
            }
            { this.state.isEditTabOpen ?
            <div className="input-fps">
                <NumericInputComponent label={""} precision={0} value={this.state.framesPerSecond} onChange={(framesPerSecond: number) => this.handleChangeFps(framesPerSecond)}/>
                <p>fps</p>
            </div> : null
            }
            { this.state.isEditTabOpen ?
            <IconButtonLineComponent tooltip="Loop/Unloop" icon={`medium ${this.state.isLoopActive ? 'loop-active last' : 'loop-inactive last'}`} onClick={() => { this.setState({ isLoopActive: !this.state.isLoopActive })}}></IconButtonLineComponent> : null
            }
            </div>
            { this.props.isTargetedAnimation ? null : 
                <AddAnimation 
                    isOpen={this.state.isAnimationTabOpen} 
                    close={() => { this.setState({isAnimationTabOpen: false})}} 
                    entity={(this.props.entity as IAnimatable)} 
                    setNotificationMessage={(message: string) => { this.props.setNotificationMessage(message) }}
                    changed={() => this.animationsChanged() }
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
            }

            { this.state.isLoadTabOpen ? <div>Load</div> : null }

            { this.state.isSaveTabOpen ? <div>Save</div> : null }

            { this.state.isEditTabOpen ?
                <div className="object-tree">
                    <ul>
                        {
                            this.props.isTargetedAnimation ? this.setListItem((this.props.entity as TargetedAnimation).animation, 0) :
                                (this.props.entity as IAnimatable).animations && (this.props.entity as IAnimatable).animations?.map((animation, i) => {
                                    return this.setListItem(animation, i);
                                })}

                    </ul>
                </div>
            : null }
        </div>
        );
    }
}