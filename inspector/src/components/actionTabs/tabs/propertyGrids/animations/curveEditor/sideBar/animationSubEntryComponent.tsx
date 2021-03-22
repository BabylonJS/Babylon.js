import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { KeyPointComponent, SelectionState } from "../graph/keyPoint";

const selectedIcon = require("../assets/keySelectedIcon.svg");

interface IAnimationSubEntryComponentProps {
    globalState: GlobalState;
    context: Context;
    animation: Animation;
    color: string;
    subName: string;
}

interface IAnimationSubEntryComponentState {
    isSelected: boolean;
}

export class AnimationSubEntryComponent extends React.Component<
IAnimationSubEntryComponentProps,
IAnimationSubEntryComponentState
> {
    private _onActiveAnimationChangedObserver: Nullable<Observer<void>>;
    private _onActiveKeyPointChangedObserver: Nullable<Observer<Nullable<{keyPoint: KeyPointComponent, channel: string}>>>;

    constructor(props: IAnimationSubEntryComponentProps) {
        super(props);

        let isSelected = false;

        if (this.props.animation === this.props.context.activeAnimation && this.props.context.activeKeyPoints) {
            for (var keyPoint of this.props.context.activeKeyPoints) {
                if (keyPoint.state.selectedState === SelectionState.Selected && keyPoint.props.channel === this.props.color) {
                    isSelected = true;
                }
            }
        }

        this.state = { isSelected: isSelected };

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