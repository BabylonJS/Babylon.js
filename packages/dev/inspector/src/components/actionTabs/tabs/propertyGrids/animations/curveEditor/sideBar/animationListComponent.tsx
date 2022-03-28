import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context } from "../context";
import { AnimationEntryComponent } from "./animationEntryComponent";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

interface IAnimationListComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IAnimationListComponentState {
    isVisible: boolean;
}

export class AnimationListComponent extends React.Component<IAnimationListComponentProps, IAnimationListComponentState> {
    private _onEditAnimationRequiredObserver: Nullable<Observer<Animation>>;
    private _onEditAnimationUIClosedObserver: Nullable<Observer<void>>;
    private _onDeleteAnimationObserver: Nullable<Observer<Animation>>;

    constructor(props: IAnimationListComponentProps) {
        super(props);

        this.state = { isVisible: true };

        this._onEditAnimationRequiredObserver = this.props.context.onEditAnimationRequired.add(() => {
            this.setState({
                isVisible: false,
            });
        });

        this._onEditAnimationUIClosedObserver = this.props.context.onEditAnimationUIClosed.add(() => {
            this.setState({
                isVisible: true,
            });
        });

        this._onDeleteAnimationObserver = this.props.context.onDeleteAnimation.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        if (this._onEditAnimationRequiredObserver) {
            this.props.context.onEditAnimationRequired.remove(this._onEditAnimationRequiredObserver);
        }

        if (this._onEditAnimationUIClosedObserver) {
            this.props.context.onEditAnimationUIClosed.remove(this._onEditAnimationUIClosedObserver);
        }

        if (this._onDeleteAnimationObserver) {
            this.props.context.onDeleteAnimation.remove(this._onDeleteAnimationObserver);
        }
    }

    public render() {
        if (!this.state.isVisible) {
            return null;
        }

        return (
            <div id="animation-list">
                {this.props.context.animations?.map((a: Animation | TargetedAnimation, i: number) => {
                    return (
                        <AnimationEntryComponent
                            key={i}
                            globalState={this.props.globalState}
                            context={this.props.context}
                            animation={this.props.context.useTargetAnimations ? (a as TargetedAnimation).animation : (a as Animation)}
                        />
                    );
                })}
            </div>
        );
    }
}
