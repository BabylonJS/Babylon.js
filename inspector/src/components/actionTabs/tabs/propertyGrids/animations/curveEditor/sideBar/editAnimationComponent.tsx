import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

interface IEditAnimationComponentProps {
    globalState: GlobalState;
    context: Context; 
}

interface IEditAnimationComponentState {
    isVisible: boolean;
    animation: Nullable<Animation>
}

export class EditAnimationComponent extends React.Component<
IEditAnimationComponentProps,
IEditAnimationComponentState
> {
    private _root: React.RefObject<HTMLDivElement>;
    private _displayName: React.RefObject<HTMLInputElement>;
    private _property: React.RefObject<HTMLInputElement>;
    private _loopModeElement: React.RefObject<HTMLSelectElement>;
    private _onEditAnimationRequiredObserver: Nullable<Observer<Animation>>;

    constructor(props: IEditAnimationComponentProps) {
        super(props);

        this.state = {isVisible: false, animation: null};

        this._root = React.createRef();
        this._displayName = React.createRef();
        this._property = React.createRef();
        this._loopModeElement = React.createRef();

        this._onEditAnimationRequiredObserver = this.props.context.onEditAnimationRequired.add((animation) => {
            this.setState({
                isVisible: true,
                animation: animation
            })
        });
    }

    componentWillUnmount() {
        if (this._onEditAnimationRequiredObserver) {
            this.props.context.onEditAnimationRequired.remove(this._onEditAnimationRequiredObserver);
        }
    }

    public close() {
        this.setState({isVisible: false});
        this.props.context.onEditAnimationUIClosed.notifyObservers();
    }

    public validate() {        
        const context = this.props.context;
        const document = this._displayName.current!.ownerDocument;
        const displayName = this._displayName.current!.value;
        const property = this._property.current!.value;
        const loopModeValue = this._loopModeElement.current!.value;

        if (!displayName) {
            document.defaultView!.alert("Please define a display name");
            return;
        }

        if (!property) {
            document.defaultView!.alert("Please define a property");
            return;
        }
        
        const animation = this.state.animation!;

        animation.name = displayName;

        if (animation.targetProperty !== property) {
            animation.targetProperty = property;
            animation.targetPropertyPath = property.split(".");
            context.stop();
        }

        switch (loopModeValue) {
            case "Cycle": {
                animation.loopMode = Animation.ANIMATIONLOOPMODE_CYCLE;
                break;
            }
            case "Relative": {
                animation.loopMode = Animation.ANIMATIONLOOPMODE_RELATIVE;
                break;
            }
            case "Constant": {
                animation.loopMode = Animation.ANIMATIONLOOPMODE_CONSTANT;
                break;
            }
        }

        this.close();
    }

    public render() {
        if (!this.state.isVisible) {
            return null;
        }

        const loopModes = ["Relative", "Cycle", "Constant"];

        return (
            <div id="edit-animation-pane" ref={this._root}>
                <div id="edit-animation-display-name-label">
                    Display Name
                </div>
                <div id="edit-animation-property-label">
                    Property
                </div>   
                <div id="edit-animation-loop-mode-label">
                    Loop Mode
                </div>
                <input type="text" id="edit-animation-name" ref={this._displayName} className="input-text" defaultValue={this.state.animation!.name || ""}/>
                <input type="text" id="edit-animation-property" ref={this._property} className="input-text" defaultValue={this.state.animation!.targetProperty}/>
                <select id="edit-animation-loop-mode" className="option" ref={this._loopModeElement} defaultValue={loopModes[this.state.animation!.loopMode ?? 1]}>
                    {loopModes.map((loopMode, i) => {
                        return (
                            <option key={loopMode + i} value={loopMode} title={loopMode}>
                                {loopMode}
                            </option>
                        );
                    })}
                </select>
                <div id="edit-animation">
                    <button className="simple-button" id="edit-animation-ok" type="button" onClick={() => this.validate()}>
                        OK
                    </button>       
                    <button className="simple-button" id="edit-animation-cancel" type="button" onClick={() => this.close()}>
                        Cancel
                    </button>          
                </div>
            </div>
        );
    }
}