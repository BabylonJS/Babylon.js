import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { ActionButtonComponent } from "../controls/actionButtonComponent";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { AnimationListComponent } from "./animationListComponent";
import { TextInputComponent } from "../controls/textInputComponent";
import { SaveAnimationComponent } from "./saveAnimationComponent";
import { LoadAnimationComponent } from "./loadAnimationComponent";
import { AddAnimationComponent } from "./addAnimationComponent";
import { EditAnimationComponent } from "./editAnimationComponent";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";

require("../scss/sideBar.scss");

const addIcon = require("../assets/addAnimationIcon.svg");
const loadIcon = require("../assets/loadIcon.svg");
const saveIcon = require("../assets/saveIcon.svg");
const editIcon = require("../assets/editIcon.svg");

interface ISideBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ISideBarComponentState {
    mode: Mode;
}

enum Mode {
    Edit,
    Add,
    Load,
    Save
}

export class SideBarComponent extends React.Component<
ISideBarComponentProps,
ISideBarComponentState
> {
    constructor(props: ISideBarComponentProps) {
        super(props);

        this.state = { mode: Mode.Edit };

        this.props.context.onDeleteAnimation.add(animationToDelete => {
            if (this.props.context.activeAnimation === animationToDelete) {
                this.props.context.activeAnimation = null;
                this.props.context.onActiveAnimationChanged.notifyObservers();
            }

            let index = -1;
            if (this.props.context.useTargetAnimations) {
                let targetedAnimations = this.props.context.animations as TargetedAnimation[];

                for (var i = 0; i < targetedAnimations.length; i++) {
                    if (targetedAnimations[i].animation === animationToDelete) {
                        index = i;
                        break;
                    }
                }
            } else {
                index = (this.props.context.animations as Animation[])!.indexOf(animationToDelete);
            }

            if (index > -1) {
                this.props.context.animations!.splice(index, 1);
                this.props.context.play(this.props.context.forwardAnimation);
                this.forceUpdate();
            }
        });

        this.props.context.onAnimationsLoaded.add(() => this.setState({mode: Mode.Edit}));
    }

    private _onAddAnimation() {
        if (this.state.mode === Mode.Add) {
            return;
        }

        this.setState({mode: Mode.Add});
    }

    private _onLoadAnimation() {
        if (this.state.mode === Mode.Load) {
            return;
        }

        this.setState({mode: Mode.Load});
    }

    private _onSaveAnimation() {
        if (this.state.mode === Mode.Save) {
            return;
        }

        this.setState({mode: Mode.Save});
    }

    private _onEditAnimation() {
        if (this.state.mode === Mode.Edit) {
            return;
        }

        this.setState({mode: Mode.Edit});
    }

    public render() {
        let fps = "60";

        if (this.props.context.animations && this.props.context.animations.length) {
            if (this.props.context.useTargetAnimations) {
                fps = (this.props.context.animations[0] as TargetedAnimation).animation.framePerSecond.toString()
            } else {
                fps = (this.props.context.animations[0] as Animation).framePerSecond.toString()
            }
        }

        return (
            <div id="sideBar">
                <div id="menu-bar" className={(this.props.context.useTargetAnimations ? "small" : "")}>
                    {
                        !this.props.context.useTargetAnimations &&
                        <ActionButtonComponent 
                            tooltip="Add new animation"
                            isActive={this.state.mode === Mode.Add}
                            id="add-animation" globalState={this.props.globalState} context={this.props.context} 
                            icon={addIcon} onClick={() => this._onAddAnimation()}/>
                    }
                    {
                        !this.props.context.useTargetAnimations &&
                        <ActionButtonComponent 
                            tooltip="Load animations"
                            isActive={this.state.mode === Mode.Load}
                            id="load-animation" globalState={this.props.globalState} context={this.props.context} 
                            icon={loadIcon} onClick={() => this._onLoadAnimation()}/>
                    }
                    <ActionButtonComponent 
                        tooltip="save current animations"
                        isActive={this.state.mode === Mode.Save}
                        id="save-animation" globalState={this.props.globalState} context={this.props.context} 
                        icon={saveIcon} onClick={() => this._onSaveAnimation()}/>
                    <ActionButtonComponent 
                        tooltip="Edit animations"
                        isActive={this.state.mode === Mode.Edit}
                        id="edit-animation" globalState={this.props.globalState} context={this.props.context} 
                        icon={editIcon} onClick={() => this._onEditAnimation()}/>   

                    <TextInputComponent 
                        value={fps}
                        complement=" fps"
                        isNumber={true}
                        onValueAsNumberChanged={value => {
                            this.props.context.animations?.forEach((anim: Animation | TargetedAnimation) => {
                                if (this.props.context.useTargetAnimations) {
                                    (anim as TargetedAnimation).animation.framePerSecond = value;
                                } else {
                                    (anim as Animation).framePerSecond = value;
                                }
                            });
                        }}
                        tooltip="Framerate"
                        id="framerate-animation"
                        globalState={this.props.globalState} context={this.props.context} />                    
                </div>
                {
                    this.state.mode === Mode.Edit &&
                    <>                        
                        <AnimationListComponent globalState={this.props.globalState} context={this.props.context} />
                        <EditAnimationComponent globalState={this.props.globalState} context={this.props.context} />
                    </>
                }
                {
                    this.state.mode === Mode.Save &&
                    <SaveAnimationComponent globalState={this.props.globalState} context={this.props.context} />
                }                
                {
                    this.state.mode === Mode.Load &&
                    <LoadAnimationComponent globalState={this.props.globalState} context={this.props.context} />
                }               
                {
                    this.state.mode === Mode.Add &&
                    <AddAnimationComponent globalState={this.props.globalState} context={this.props.context} />
                }
            </div>
        );
    }
}