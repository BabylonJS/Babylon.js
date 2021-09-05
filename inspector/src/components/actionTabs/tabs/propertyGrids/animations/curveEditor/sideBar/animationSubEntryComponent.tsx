import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { Animation } from "babylonjs/Animations/animation";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { SelectionState } from "../graph/keyPoint";

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
    private _onActiveKeyPointChangedObserver: Nullable<Observer<void>>;

    constructor(props: IAnimationSubEntryComponentProps) {
        super(props);

        let isSelected = false;

        if (this.props.context.activeAnimations.indexOf(this.props.animation) !== -1 && this.props.context.activeKeyPoints) {
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

        this._onActiveKeyPointChangedObserver = this.props.context.onActiveKeyPointChanged.add(() => {
            let isSelected = false;

            if (this.props.context.activeKeyPoints) {
                for (let activeKeyPoint of this.props.context.activeKeyPoints) {
                    if (activeKeyPoint.props.curve.animation === this.props.animation 
                        && activeKeyPoint.props.channel === this.props.color 
                        && this.props.context.activeAnimations.indexOf(this.props.animation) !== -1) {
                        isSelected = true;
                        break;
                    }
                }
            }

            this.setState({isSelected: isSelected});
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

    private _activate(evt: React.MouseEvent<HTMLDivElement>) {
        const index = this.props.context.activeAnimations.indexOf(this.props.animation);

        if (index !== -1 && this.props.context.getActiveChannel(this.props.animation) === this.props.color) {
            return;
        }

        if (!evt.ctrlKey) {
            this.props.context.activeAnimations = [this.props.animation];
            this.props.context.resetAllActiveChannels();
        } else {
            if (index === -1) {
                this.props.context.activeAnimations.push(this.props.animation);
            }
        }
        this.props.context.enableChannel(this.props.animation, this.props.color);
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    public render() {
        let isActive = this.props.context.activeAnimations.indexOf(this.props.animation) !== -1 
                        && (this.props.context.isChannelEnabled(this.props.animation, this.props.color));
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
                        onClick={evt => this._activate(evt)}>{this.props.subName}</div>
                </div>
            </>
        );
    }
}