
import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from 'babylonjs/Animations/animation';
import { IconButtonLineComponent } from '../../../lines/iconButtonLineComponent';
import { NumericInputComponent } from '../../../lines/numericInputComponent';
import { AddAnimation } from './addAnimation';
import { AnimationListTree, SelectedCoordinate } from './animationListTree';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { LoadSnippet } from "./loadsnippet";
import { SaveSnippet } from "./saveSnippet";
import { LockObject } from '../lockObject';


interface IEditorControlsProps {
    isTargetedAnimation: boolean;
    entity: IAnimatable | TargetedAnimation;
    selected: Animation | null;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    setNotificationMessage: (message: string) => void;
    selectAnimation: (selected: Animation, axis?: SelectedCoordinate) => void;
}

export class EditorControls extends React.Component<IEditorControlsProps, { isAnimationTabOpen: boolean, isEditTabOpen: boolean, isLoadTabOpen: boolean, isSaveTabOpen: boolean, isLoopActive: boolean, animationsCount: number; framesPerSecond: number }>{

    constructor(props: IEditorControlsProps) {
        super(props);
        let count = this.props.isTargetedAnimation ? 1 : (this.props.entity as IAnimatable).animations?.length ?? 0;
        this.state = { isAnimationTabOpen: count === 0 ? true : false, isEditTabOpen: count === 0 ? false : true, isSaveTabOpen: false, isLoadTabOpen: false, isLoopActive: false, animationsCount: count, framesPerSecond: 60 }
    }

    animationAdded() {
        this.setState({ animationsCount: this.recountAnimations(), isEditTabOpen: true, isAnimationTabOpen: false });
    }

    recountAnimations() {
        return (this.props.entity as IAnimatable).animations?.length ?? 0;
    }

    handleTabs(tab: number) {

        let state = { isAnimationTabOpen: true, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: false };

        switch (tab) {
            case 0:
                state = { isAnimationTabOpen: true, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: false };
                break;
            case 1:
                state = { isAnimationTabOpen: false, isLoadTabOpen: true, isSaveTabOpen: false, isEditTabOpen: false };
                break;
            case 2:
                state = { isAnimationTabOpen: false, isLoadTabOpen: false, isSaveTabOpen: true, isEditTabOpen: false };
                break;
            case 3:
                state = { isAnimationTabOpen: false, isLoadTabOpen: false, isSaveTabOpen: false, isEditTabOpen: true };
                break;
        }

        this.setState(state);
    }

    handleChangeFps(fps: number) {
        this.setState({ framesPerSecond: fps });
    }

    emptiedList() {
        this.setState({ animationsCount: this.recountAnimations(), isEditTabOpen: false, isAnimationTabOpen: true });
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
                    {this.state.isEditTabOpen ?
                        <div className="input-fps">
                            <NumericInputComponent label={""} precision={0} value={this.state.framesPerSecond} onChange={(framesPerSecond: number) => this.handleChangeFps(framesPerSecond)} />
                            <p>fps</p>
                        </div> : null
                    }
                    {this.state.isEditTabOpen ?
                        <IconButtonLineComponent tooltip="Loop/Unloop" icon={`medium ${this.state.isLoopActive ? 'loop-active last' : 'loop-inactive last'}`} onClick={() => { this.setState({ isLoopActive: !this.state.isLoopActive }) }}></IconButtonLineComponent> : null
                    }
                </div>
                {this.props.isTargetedAnimation ? null :
                    <AddAnimation
                        isOpen={this.state.isAnimationTabOpen}
                        close={() => { this.setState({ isAnimationTabOpen: false }) }}
                        entity={(this.props.entity as IAnimatable)}
                        setNotificationMessage={(message: string) => { this.props.setNotificationMessage(message) }}
                        changed={() => this.animationAdded()}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }

                {this.state.isLoadTabOpen ? <LoadSnippet lockObject={this.props.lockObject} animations={[]} /> : null}

                {this.state.isSaveTabOpen ? <SaveSnippet lockObject={this.props.lockObject} animations={[]} /> : null}

                {this.state.isEditTabOpen ? <AnimationListTree
                    isTargetedAnimation={this.props.isTargetedAnimation}
                    entity={this.props.entity}
                    selected={this.props.selected}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    empty={() => this.emptiedList()}
                    selectAnimation={this.props.selectAnimation} />
                    : null}
            </div>
        );
    }
}