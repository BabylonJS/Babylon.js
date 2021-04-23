import { Observer } from "babylonjs/Misc/observable";
import { Nullable } from "babylonjs/types";
import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { AnimationEntryComponent } from "./animationEntryComponent";
import { Animation } from "babylonjs/Animations/animation";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";

interface IAnimationListComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IAnimationListComponentState {
    isVisible: boolean
}

export class AnimationListComponent extends React.Component<
IAnimationListComponentProps,
IAnimationListComponentState
> {
    private _onEditAnimationRequiredObserver: Nullable<Observer<Animation>>;
    private _onEditAnimationUIClosedObserver: Nullable<Observer<void>>;

    constructor(props: IAnimationListComponentProps) {
        super(props);

        this.state = {isVisible: true };

        this._onEditAnimationRequiredObserver = this.props.context.onEditAnimationRequired.add((animation) => {
            this.setState({
                isVisible: false
            })
        });

        this._onEditAnimationUIClosedObserver = this.props.context.onEditAnimationUIClosed.add(() => {
            this.setState({
                isVisible: true
            })
        });
    }

    componentWillUnmount() {
        if (this._onEditAnimationRequiredObserver) {
            this.props.context.onEditAnimationRequired.remove(this._onEditAnimationRequiredObserver);
        }

        if (this._onEditAnimationUIClosedObserver) {
            this.props.context.onEditAnimationUIClosed.remove(this._onEditAnimationUIClosedObserver);
        }
    }    

    public render() {
        if (!this.state.isVisible) {
            return null;
        }

        return (
            <div id="animation-list">
                {
                    this.props.context.animations?.map((a: Animation | TargetedAnimation, i: number) => {
                        return (
                            <AnimationEntryComponent key={i} globalState={this.props.globalState} context={this.props.context} animation={this.props.context.useTargetAnimations ? (a as TargetedAnimation).animation : a as Animation}/>
                        );
                    })
                }
            </div>
        );
    }
}