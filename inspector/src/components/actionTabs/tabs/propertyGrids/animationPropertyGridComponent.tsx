import * as React from "react";

import { Observable, Observer } from "babylonjs/Misc/observable";
import { Scene } from "babylonjs/scene";

import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { ButtonLineComponent } from "../../lines/buttonLineComponent";
import { LineContainerComponent } from "../../lineContainerComponent";
import { SliderLineComponent } from "../../lines/sliderLineComponent";
import { LockObject } from "./lockObject";
import { GlobalState } from '../../../globalState';
import { IAnimatable } from 'babylonjs/Misc/tools';
import { Animation } from 'babylonjs/Animations/animation';
import { Animatable } from 'babylonjs/Animations/animatable';
import { AnimationPropertiesOverride } from 'babylonjs/Animations/animationPropertiesOverride';
import { AnimationRange } from 'babylonjs/Animations/animationRange';
import { CheckBoxLineComponent } from '../../lines/checkBoxLineComponent';
import { Nullable } from 'babylonjs/types';
import { FloatLineComponent } from '../../lines/floatLineComponent';
import { TextLineComponent } from '../../lines/textLineComponent';

interface IAnimationGridComponentProps {
    globalState: GlobalState;
    animatable: IAnimatable,
    scene: Scene,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class AnimationGridComponent extends React.Component<IAnimationGridComponentProps, { currentFrame: number }> {
    private _animations: Nullable<Animation[]> = null;
    private _ranges: AnimationRange[];
    private _animationControl = {
        from: 0,
        to: 0,
        loop: false
    }
    private _runningAnimatable: Nullable<Animatable>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _isPlaying = false;

    constructor(props: IAnimationGridComponentProps) {
        super(props);

        this.state = { currentFrame: 0 };

        const animatableAsAny = this.props.animatable as any;

        this._ranges = animatableAsAny.getAnimationRanges ? animatableAsAny.getAnimationRanges() : [];
        if (animatableAsAny.getAnimatables) {
            const animatables = animatableAsAny.getAnimatables();
            this._animations = new Array<Animation>();

            animatables.forEach((animatable: IAnimatable) => {
                this._animations!.push(...animatable.animations);
            });

            // Extract from and to
            if (this._animations && this._animations.length) {
                this._animations.forEach(animation => {
                    let keys = animation.getKeys();

                    if (keys && keys.length > 0) {
                        if (keys[0].frame < this._animationControl.from) {
                            this._animationControl.from = keys[0].frame;
                        }
                        const lastKeyIndex = keys.length - 1;
                        if (keys[lastKeyIndex].frame > this._animationControl.to) {
                            this._animationControl.to = keys[lastKeyIndex].frame;
                        }
                    }
                });
            }
        }
    }

    playOrPause() {
        const animatable = this.props.animatable;
        this._isPlaying = this.props.scene.getAllAnimatablesByTarget(animatable).length > 0;

        if (this._isPlaying) {
            this.props.scene.stopAnimation(this.props.animatable);
            this._runningAnimatable = null;
        } else {
            this._runningAnimatable = this.props.scene.beginAnimation(this.props.animatable, this._animationControl.from, this._animationControl.to, this._animationControl.loop);
        }
        this.forceUpdate();
    }

    componentWillMount() {
        this._onBeforeRenderObserver = this.props.scene.onBeforeRenderObservable.add(() => {
            if (!this._isPlaying || !this._runningAnimatable) {
                return;
            }
            this.setState({ currentFrame: this._runningAnimatable.masterFrame });
        });
    }

    componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }

    onCurrentFrameChange(value: number) {
        if (!this._runningAnimatable) {
            return;
        }

        this._runningAnimatable.goToFrame(value);
        this.setState({ currentFrame: value });
    }

    render() {
        const animatable = this.props.animatable;
        const animatableAsAny = this.props.animatable as any;

        let animatablesForTarget = this.props.scene.getAllAnimatablesByTarget(animatable);
        this._isPlaying = animatablesForTarget.length > 0;

        if (this._isPlaying && !this._runningAnimatable) {
            this._runningAnimatable = animatablesForTarget[0];
        }

        if (this._runningAnimatable) {
            this._animationControl.from = this._runningAnimatable.fromFrame;
            this._animationControl.to = this._runningAnimatable.toFrame;
            this._animationControl.loop = this._runningAnimatable.loopAnimation;
        }

        return (
            <div>
                {
                    (this._ranges.length > 0 || this._animations && this._animations.length > 0) &&
                    <LineContainerComponent globalState={this.props.globalState} title="ANIMATION OVERRIDE">
                        <CheckBoxLineComponent label="Enable override" onSelect={value => {
                            if (value) {
                                animatableAsAny.animationPropertiesOverride = new AnimationPropertiesOverride();
                                animatableAsAny.animationPropertiesOverride.blendingSpeed = 0.05;
                            } else {
                                animatableAsAny.animationPropertiesOverride = null;
                            }
                            this.forceUpdate();
                        }} isSelected={() => animatableAsAny.animationPropertiesOverride != null} />
                        {
                            animatableAsAny.animationPropertiesOverride != null &&
                            <div>
                                <CheckBoxLineComponent label="Enable blending" target={animatableAsAny.animationPropertiesOverride} propertyName="enableBlending" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                                <SliderLineComponent label="Blending speed" target={animatableAsAny.animationPropertiesOverride} propertyName="blendingSpeed" minimum={0} maximum={0.1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                            </div>
                        }
                    </LineContainerComponent>
                }
                {
                    this._ranges.length > 0 &&
                    <LineContainerComponent globalState={this.props.globalState} title="ANIMATION RANGES">
                        {
                            this._ranges.map(range => {
                                return (
                                    <ButtonLineComponent key={range.name} label={range.name}
                                        onClick={() => {
                                            this._runningAnimatable = null;
                                            this.props.scene.beginAnimation(animatable, range.from, range.to, true)
                                        }} />
                                );
                            })
                        }
                    </LineContainerComponent>
                }
                {
                    this._animations && this._animations.length > 0 &&
                    <LineContainerComponent globalState={this.props.globalState} title="ANIMATIONS">
                        <TextLineComponent label="Count" value={this._animations.length.toString()} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="From" target={this._animationControl} propertyName="from" />
                        <FloatLineComponent lockObject={this.props.lockObject} label="To" target={this._animationControl} propertyName="to" />
                        <CheckBoxLineComponent label="Loop" onSelect={value => this._animationControl.loop = value} isSelected={() => this._animationControl.loop} />
                        <ButtonLineComponent label={this._isPlaying ? "Stop" : "Play"} onClick={() => this.playOrPause()} />
                        {
                            this._isPlaying &&
                            <SliderLineComponent ref="timeline" label="Current frame" minimum={this._animationControl.from} maximum={this._animationControl.to}
                                step={(this._animationControl.to - this._animationControl.from) / 1000.0} directValue={this.state.currentFrame}
                                onInput={value => this.onCurrentFrameChange(value)}
                            />
                        }
                    </LineContainerComponent>
                }
            </div>
        );
    }

}