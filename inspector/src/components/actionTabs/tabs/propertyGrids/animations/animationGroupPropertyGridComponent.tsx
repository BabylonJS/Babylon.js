import * as React from "react";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { AnimationGroup } from "babylonjs/Animations/animationGroup";
import { Scene } from "babylonjs/scene";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { ButtonLineComponent } from "../../../lines/buttonLineComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface IAnimationGroupGridComponentProps {
    globalState: GlobalState;
    animationGroup: AnimationGroup,
    scene: Scene,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class AnimationGroupGridComponent extends React.Component<IAnimationGroupGridComponentProps, { playButtonText: string, currentFrame: number }> {
    private _onAnimationGroupPlayObserver: Nullable<Observer<AnimationGroup>>;
    private _onAnimationGroupPauseObserver: Nullable<Observer<AnimationGroup>>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private timelineRef: React.RefObject<SliderLineComponent>;

    constructor(props: IAnimationGroupGridComponentProps) {
        super(props);

        const animationGroup = this.props.animationGroup;
        this.state = { playButtonText: animationGroup.isPlaying ? "Pause" : "Play", currentFrame: 0 };

        this.connect(this.props.animationGroup);

        this._onBeforeRenderObserver = this.props.scene.onBeforeRenderObservable.add(() => {
            this.updateCurrentFrame(this.props.animationGroup);
        });

        this.timelineRef = React.createRef();
    }

    disconnect(animationGroup: AnimationGroup) {

        if (this._onAnimationGroupPlayObserver) {
            animationGroup.onAnimationGroupPlayObservable.remove(this._onAnimationGroupPlayObserver);
            this._onAnimationGroupPlayObserver = null;
        }

        if (this._onAnimationGroupPauseObserver) {
            animationGroup.onAnimationGroupPauseObservable.remove(this._onAnimationGroupPauseObserver);
            this._onAnimationGroupPauseObserver = null;
        }
    }

    connect(animationGroup: AnimationGroup) {
        this._onAnimationGroupPlayObserver = animationGroup.onAnimationGroupPlayObservable.add(() => {
            this.forceUpdate();
        });

        this._onAnimationGroupPauseObserver = animationGroup.onAnimationGroupPauseObservable.add(() => {
            this.forceUpdate();
        });

        this.updateCurrentFrame(animationGroup);
    }

    updateCurrentFrame(animationGroup: AnimationGroup) {
        var targetedAnimations = animationGroup.targetedAnimations;
        if (targetedAnimations.length > 0) {
            var runtimeAnimations = animationGroup.targetedAnimations[0].animation.runtimeAnimations;
            if (runtimeAnimations.length > 0) {
                this.setState({ currentFrame: runtimeAnimations[0].currentFrame });
            } else {
                this.setState({ currentFrame: 0 });
            }
        }
    }

    shouldComponentUpdate(nextProps: IAnimationGroupGridComponentProps): boolean {
        if (this.props.animationGroup !== nextProps.animationGroup) {
            this.disconnect(this.props.animationGroup);
            this.connect(nextProps.animationGroup);
        }
        return true;
    }

    componentWillUnmount() {
        this.disconnect(this.props.animationGroup);

        if (this._onBeforeRenderObserver) {
            this.props.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }

    playOrPause() {
        const animationGroup = this.props.animationGroup;

        if (animationGroup.isPlaying) {
            this.setState({ playButtonText: "Play" });
            animationGroup.pause();
        } else {
            this.setState({ playButtonText: "Pause" });
            this.props.scene.animationGroups.forEach(grp => grp.pause());
            animationGroup.play(true);
        }
    }

    onCurrentFrameChange(value: number) {
        const animationGroup = this.props.animationGroup;

        if (!animationGroup.isPlaying) {
            animationGroup.play(true);
            animationGroup.goToFrame(value);
            animationGroup.pause();
        } else {
            animationGroup.goToFrame(value);
        }

        this.setState({ currentFrame: value });
    }

    render() {
        const animationGroup = this.props.animationGroup;

        const playButtonText = animationGroup.isPlaying ? "Pause" : "Play"

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="CONTROLS">
                    <ButtonLineComponent label={playButtonText} onClick={() => this.playOrPause()} />
                    <SliderLineComponent label="Speed ratio" minimum={0} maximum={10} step={0.1} target={animationGroup} propertyName="speedRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent ref={this.timelineRef} label="Current frame" minimum={animationGroup.from} maximum={animationGroup.to} step={(animationGroup.to - animationGroup.from) / 1000.0} directValue={this.state.currentFrame} onInput={value => this.onCurrentFrameChange(value)} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="INFOS">
                    <TextLineComponent label="Animation count" value={animationGroup.targetedAnimations.length.toString()} />
                    <TextLineComponent label="From" value={animationGroup.from.toFixed(2)} />
                    <TextLineComponent label="To" value={animationGroup.to.toFixed(2)} />
                    <TextLineComponent label="Unique ID" value={animationGroup.uniqueId.toString()} />
                </LineContainerComponent>
            </div>
        );
    }
}