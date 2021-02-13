import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

const selectedIcon = require("../assets/keySelectedIcon.svg");

interface IAnimationCurveEditorAnimationSubEntryComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    animation: Animation;
    color: string;
    subName: string;
}

interface IAnimationCurveEditorAnimationSubEntryComponentState {
}

export class AnimationCurveEditorAnimationSubEntryComponent extends React.Component<
IAnimationCurveEditorAnimationSubEntryComponentProps,
IAnimationCurveEditorAnimationSubEntryComponentState
> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;

    constructor(props: IAnimationCurveEditorAnimationSubEntryComponentProps) {
        super(props);

        this.state = { };

        this._onActiveAnimationChangedObserver = props.context.onActiveAnimationChanged.add(animation => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }
    }

    private _activate() {
        this.props.context.onActiveKeyPointChanged.notifyObservers(null);
        this.props.context.activeAnimation = this.props.animation;
        this.props.context.activeSubAnimation = this.props.subName;
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    public render() {
        let isActive = this.props.animation === this.props.context.activeAnimation;
        let isSelected = isActive && this.props.subName === this.props.context.activeSubAnimation;
        return (
            <>
                <div className={"animation-entry" + (isActive ? " isActive" : "")}>
                    {
                        isSelected &&
                        <div className="animation-active-indicator">
                            <img src={selectedIcon}/>
                        </div>
                    }
                    <div 
                        className="animation-name" 
                        style={
                            {
                                color: this.props.color
                            }
                        }
                        onClick={() => this._activate()}>{this.props.subName}</div>
                </div>
            </>
        );
    }
}