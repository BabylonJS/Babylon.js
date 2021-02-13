import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { AnimationCurveEditorContext } from "../animationCurveEditorContext";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { AnimationCurveEditorKeyPointComponent } from "../graph/animationCurveEditorKeyPoint";

const selectedIcon = require("../assets/keySelectedIcon.svg");

interface IAnimationCurveEditorAnimationSubEntryComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
    animation: Animation;
    color: string;
    subName: string;
}

interface IAnimationCurveEditorAnimationSubEntryComponentState {
    isSelected: boolean;
}

export class AnimationCurveEditorAnimationSubEntryComponent extends React.Component<
IAnimationCurveEditorAnimationSubEntryComponentProps,
IAnimationCurveEditorAnimationSubEntryComponentState
> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<{keyPoint: AnimationCurveEditorKeyPointComponent, channel: string}>>>;

    constructor(props: IAnimationCurveEditorAnimationSubEntryComponentProps) {
        super(props);

        this.state = { isSelected: false };

        this._onActiveAnimationChangedObserver = props.context.onActiveAnimationChanged.add(animation => {
            this.forceUpdate();
        });

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(data => {
            this.setState({isSelected: data?.channel === this.props.color && this.props.animation === this.props.context.activeAnimation})
        });
    }

    componentWillUnmount() {
        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        if (this._onActiveKeyPointChangedObserver) {
            this.props.context.onActiveKeyPointChanged.remove(this._onActiveKeyPointChangedObserver);
        }
    }

    private _activate() {
        if (this.props.animation === this.props.context.activeAnimation) {
            return;
        }

        this.props.context.onActiveKeyPointChanged.notifyObservers(null);
        this.props.context.activeAnimation = this.props.animation;
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    public render() {
        let isActive = this.props.animation === this.props.context.activeAnimation;
        return (
            <>
                <div className={"animation-entry" + (isActive ? " isActive" : "")}>
                    {
                        this.state.isSelected &&
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