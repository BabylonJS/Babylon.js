import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { ActionButtonComponent } from "../controls/actionButtonComponent";
import { Context } from "../context";
import { AnimationListComponent } from "./animationListComponent";
import { TextInputComponent } from "../controls/textInputComponent";

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
        return (
            <div id="sideBar">
                <div id="menu-bar">
                    <ActionButtonComponent 
                        tooltip="Add new animation"
                        isActive={this.state.mode === Mode.Add}
                        id="add-animation" globalState={this.props.globalState} context={this.props.context} 
                        icon={addIcon} onClick={() => this._onAddAnimation()}/>
                    <ActionButtonComponent 
                        tooltip="Load animations"
                        isActive={this.state.mode === Mode.Load}
                        id="load-animation" globalState={this.props.globalState} context={this.props.context} 
                        icon={loadIcon} onClick={() => this._onLoadAnimation()}/>
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
                        value={this.props.context.animations && this.props.context.animations.length ? this.props.context.animations[0].framePerSecond + " fps" : "60 fps"}
                        tooltip="Framerate"
                        id="framerate-animation"
                        globalState={this.props.globalState} context={this.props.context} />                    
                </div>
                {
                    this.state.mode === Mode.Edit &&
                    <AnimationListComponent globalState={this.props.globalState} context={this.props.context} />
                }
            </div>
        );
    }
}