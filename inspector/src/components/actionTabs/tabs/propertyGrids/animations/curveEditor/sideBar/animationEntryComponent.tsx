import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { ActionButtonComponent } from "../controls/actionButtonComponent";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { AnimationSubEntryComponent } from "./animationSubEntryComponent";

const gearIcon = require("../assets/animationOptionsIcon.svg");
const deleteIcon = require("../assets/closeWindowIcon.svg");
const bulletIcon = require("../assets/animationBulletIcon.svg");
const selectedIcon = require("../assets/keySelectedIcon.svg");
const chevronIcon = require("../assets/animationTriangleIcon.svg");


interface IAnimationEntryComponentProps {
    globalState: GlobalState;
    context: Context;
    animation: Animation;
}

interface IAnimationEntryComponentState {
    isExpanded: boolean;
    isSelected: boolean;
}

export class AnimationEntryComponent extends React.Component<
IAnimationEntryComponentProps,
IAnimationEntryComponentState
> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private _onActiveKeyPointChangedObserver: Nullable<Observer<void>>;
    private _onSelectToActivatedObserver: Nullable<Observer<{from:number, to:number}>>;

    private _unmount = false;

    constructor(props: IAnimationEntryComponentProps) {
        super(props);

        this.state = { isExpanded: false, isSelected: false };

        this._onActiveAnimationChangedObserver = props.context.onActiveAnimationChanged.add(() => {
            if (this._unmount) {
                return;
            }
            if (this.props.context.activeAnimations.indexOf(this.props.animation) === -1) {
                this.setState({isSelected: false});
            }
            this.forceUpdate();
        });

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(() => {
            this.setState({isSelected: this.props.animation.dataType === Animation.ANIMATIONTYPE_FLOAT && 
                this.props.context.activeAnimations.indexOf(this.props.animation) !== -1 &&
                this.props.context.activeKeyPoints !== null &&
                this.props.context.activeKeyPoints.length > 0 &&
                this.props.context.activeKeyPoints.some(kp => kp.props.curve.animation === this.props.animation)
            })
        });

        this._onSelectToActivatedObserver = this.props.context.onSelectToActivated.add((info: {from:number, to:number}) => {
            const currentIndex = this.props.context.getAnimationSortIndex(this.props.animation);
            const activeIndex = this.props.context.activeAnimations.indexOf(this.props.animation);

            if ((currentIndex > info.from && currentIndex <= info.to 
                || currentIndex >= info.to && currentIndex < info.from)) {
                if (activeIndex === -1) {
                    this.props.context.activeAnimations.push(this.props.animation);
                }
            } else if (currentIndex !== info.from && activeIndex !== -1) {
                this.props.context.activeAnimations.splice(activeIndex, 1);
            }
        });
    }

    private _onGear() {
        this.props.context.onEditAnimationUIClosed.addOnce(() => {if (!this._unmount) { this.forceUpdate()}});
        this.props.context.onEditAnimationRequired.notifyObservers(this.props.animation);
    }

    private _onDelete() {
        this.props.context.onDeleteAnimation.notifyObservers(this.props.animation);
    }

    componentWillUnmount() {
        this._unmount = true;
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        if (this._onActiveKeyPointChangedObserver) {
            this.props.context.onActiveKeyPointChanged.remove(this._onActiveKeyPointChangedObserver);
        }

        if (this._onSelectToActivatedObserver) {
            this.props.context.onSelectToActivated.remove(this._onSelectToActivatedObserver);
        }
    }

    private _activate(evt: React.MouseEvent<HTMLDivElement>) {
        if (evt.shiftKey) {
            if (this.props.context.activeAnimations.length > 0) {
                const firstOne = this.props.context.activeAnimations[0];
                const payload = {
                    from: this.props.context.getAnimationSortIndex(firstOne),
                    to: this.props.context.getAnimationSortIndex(this.props.animation),
                }

                this.props.context.onSelectToActivated.notifyObservers(payload);

                this.props.context.onActiveAnimationChanged.notifyObservers();
            }
            return;
        }
        if (!evt.ctrlKey) {
            this.props.context.activeAnimations = [this.props.animation];
            this.props.context.resetAllActiveChannels();
        } else {
            const index = this.props.context.activeAnimations.indexOf(this.props.animation);

            if (index !== -1) {
                    this.props.context.activeAnimations.splice(index, 1);            
            } else {            
                this.props.context.activeAnimations.push(this.props.animation);
            }
        }

        this.props.context.disableChannel(this.props.animation);
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    private _expandOrCollapse() {
        this.setState({isExpanded: !this.state.isExpanded});
    }

    public render() {
        let isActive = this.props.context.activeAnimations.indexOf(this.props.animation) !== -1;        

        return (
            <>
                <div className={"animation-entry" + (isActive ? " isActive" : "")}>
                    {
                        this.state.isSelected &&
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
                    <div className="animation-name" onClick={evt => this._activate(evt)}>{this.props.animation.name}</div>
                    <ActionButtonComponent className="animation-options" context={this.props.context} globalState={this.props.globalState} icon={gearIcon} onClick={() => this._onGear()} />
                    <ActionButtonComponent className="animation-delete" context={this.props.context} globalState={this.props.globalState} icon={deleteIcon} onClick={() => this._onDelete()} />
                </div>
                {
                    this.state.isExpanded && this.props.animation.dataType === Animation.ANIMATIONTYPE_COLOR3 &&
                    <>
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#DB3E3E" subName="Red"
                            />
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#51E22D" subName="Green"
                            />
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#00A3FF" subName="Blue"
                            />                                                        
                    </>
                }
                {
                    this.state.isExpanded && this.props.animation.dataType === Animation.ANIMATIONTYPE_VECTOR3 &&
                    <>
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#DB3E3E" subName="X"
                            />
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#51E22D" subName="Y"
                            />
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#00A3FF" subName="Z"
                            />                                                        
                    </>
                }                       
                {
                    this.state.isExpanded && this.props.animation.dataType === Animation.ANIMATIONTYPE_VECTOR2 &&
                    <>
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#DB3E3E" subName="X"
                            />
                        <AnimationSubEntryComponent 
                            globalState={this.props.globalState} context={this.props.context} animation={this.props.animation} 
                            color="#51E22D" subName="Y"
                            />                                                     
                    </>
                }           
            </>
        );
    }
}