import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { Animation } from "babylonjs/Animations/animation";
import { AnimationCurveEditorActionButtonComponent } from "../controls/animationCurveEditorActionButtonComponent";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { AnimationCurveEditorAnimationSubEntryComponent } from "./animationCurveEditorAnimationSubEntryComponent";

const gearIcon = require("../assets/animationOptionsIcon.svg");
const deleteIcon = require("../assets/closeWindowIcon.svg");
const bulletIcon = require("../assets/animationBulletIcon.svg");
const selectedIcon = require("../assets/keySelectedIcon.svg");
const chevronIcon = require("../assets/animationTriangleIcon.svg");


interface IAnimationCurveEditorAnimationEntryComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    animation: Animation;
}

interface IAnimationCurveEditorAnimationEntryComponentState {
    isExpanded: boolean
}

export class AnimationCurveEditorAnimationEntryComponent extends React.Component<
IAnimationCurveEditorAnimationEntryComponentProps,
IAnimationCurveEditorAnimationEntryComponentState
> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

    constructor(props: IAnimationCurveEditorAnimationEntryComponentProps) {
        super(props);

        this.state = { isExpanded: false };

        this._onActiveAnimationChangedObserver = props.context.onActiveAnimationChanged.add(animation => {
            this.forceUpdate();
        });
    }

    private _onGear() {

    }

    private _onDelete() {

    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    private _activate() {
        if (this.props.animation.dataType !== Animation.ANIMATIONTYPE_FLOAT) {
            this._expandOrCollapse();
            return;
        }
        
        this.props.context.onActiveKeyPointChanged.notifyObservers(null);
        this.props.context.activeAnimation = this.props.animation;
        this.props.context.activeSubAnimation = "";
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    private _expandOrCollapse() {
        this.setState({isExpanded: !this.state.isExpanded});
    }

    public render() {
        let isActive = this.props.animation === this.props.context.activeAnimation;        
        let isSelected = isActive &&  !this.props.context.activeSubAnimation;

        return (
            <>
                <div className={"animation-entry" + (isActive ? " isActive" : "")}>
                    {
                        isSelected &&
                        <div className="animation-active-indicator">
                            <img src={selectedIcon}/>
                        </div>
                    }
                    {
                        this.props.animation.dataType === Animation.ANIMATIONTYPE_FLOAT &&
                        <div className="animation-chevron">
                            <img src={bulletIcon}/>
                        </div>
                    }                    
                    {
                        this.props.animation.dataType !== Animation.ANIMATIONTYPE_FLOAT &&
                        <div className="animation-chevron" onClick={() => this._expandOrCollapse()}>
                            <img className={"animation-chevron-image" + (this.state.isExpanded ? "" : " collapsed")} src={chevronIcon}/>              
                        </div>      
                    }
                    <div className="animation-name" onClick={() => this._activate()}>{this.props.animation.name}</div>
                    <AnimationCurveEditorActionButtonComponent className="animation-options" context={this.props.context} globalState={this.props.globalState} icon={gearIcon} onClick={() => this._onGear()} />
                    <AnimationCurveEditorActionButtonComponent className="animation-delete" context={this.props.context} globalState={this.props.globalState} icon={deleteIcon} onClick={() => this._onDelete()} />
                </div>
                {
                    this.state.isExpanded && this.props.animation.dataType !== Animation.ANIMATIONTYPE_COLOR3 &&
                    <>
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#DB3E3E" subName="Red"
                            />
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#51E22D" subName="Green"
                            />
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#00A3FF" subName="Blue"
                            />                                                        
                    </>
                }
                {
                    this.state.isExpanded && this.props.animation.dataType !== Animation.ANIMATIONTYPE_VECTOR3 &&
                    <>
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#DB3E3E" subName="X"
                            />
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#51E22D" subName="Y"
                            />
                        <AnimationCurveEditorAnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#00A3FF" subName="Z"
                            />                                                        
                    </>
                }                
            </>
        );
    }
}