import * as React from "react";

import type { Observable, Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import type { Animation } from "core/Animations/animation";
import type { Animatable } from "core/Animations/animatable";
import { AnimationPropertiesOverride } from "core/Animations/animationPropertiesOverride";
import type { AnimationRange } from "core/Animations/animationRange";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import type { Nullable } from "core/types";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { AnimationCurveEditorComponent } from "./curveEditor/animationCurveEditorComponent";
import { Context } from "./curveEditor/context";

interface IAnimationGridComponentProps {
    globalState: GlobalState;
    animatable: IAnimatable;
    scene: Scene;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class AnimationGridComponent extends React.Component<IAnimationGridComponentProps, { currentFrame: number }> {
    private _animations: Nullable<Animation[]> = null;
    private _ranges: AnimationRange[];
    private _mainAnimatable: Nullable<Animatable>;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _isPlaying = false;
    private _timelineRef: React.RefObject<SliderLineComponent>;
    private _animationCurveEditorContext: Nullable<Context>;
    private _animationControl = {
        from: 0,
        to: 0,
        loop: false,
        initialized: false,
    };

    constructor(props: IAnimationGridComponentProps) {
        super(props);

        this.state = { currentFrame: 0 };

        const animatableAsAny = this.props.animatable as any;

        this._ranges = animatableAsAny.getAnimationRanges ? animatableAsAny.getAnimationRanges() : [];
        if (animatableAsAny.getAnimatables) {
            const animatables = animatableAsAny.getAnimatables();
            this._animations = new Array<Animation>();

            for (const animatable of animatables) {
                if (animatable.animations) {
                    this._animations!.push(...animatable.animations);
                }
            }

            if (animatableAsAny.animations) {
                this._animations!.push(...animatableAsAny.animations);
            }

            // Extract from and to
            if (this._animations && this._animations.length) {
                for (const animation of this._animations) {
                    const keys = animation.getKeys();

                    if (keys && keys.length > 0) {
                        if (keys[0].frame < this._animationControl.from) {
                            this._animationControl.from = keys[0].frame;
                        }
                        const lastKeyIndex = keys.length - 1;
                        if (keys[lastKeyIndex].frame > this._animationControl.to) {
                            this._animationControl.to = keys[lastKeyIndex].frame;
                        }
                    }
                }
            }
        }

        this._timelineRef = React.createRef();
    }

    playOrPause() {
        const animatable = this.props.animatable;
        this._isPlaying = this.props.scene.getAllAnimatablesByTarget(animatable).length > 0;

        if (this._isPlaying) {
            this.props.scene.stopAnimation(this.props.animatable);
            this._mainAnimatable = null;
        } else {
            this._mainAnimatable = this.props.scene.beginAnimation(this.props.animatable, this._animationControl.from, this._animationControl.to, this._animationControl.loop);
        }
        this.forceUpdate();
    }

    override componentDidMount() {
        this._onBeforeRenderObserver = this.props.scene.onBeforeRenderObservable.add(() => {
            if (!this._isPlaying || !this._mainAnimatable) {
                return;
            }
            this.setState({ currentFrame: this._mainAnimatable.masterFrame });
        });
    }

    override componentWillUnmount() {
        if (this._onBeforeRenderObserver) {
            this.props.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;
        }
    }

    onCurrentFrameChange(value: number) {
        if (!this._mainAnimatable) {
            return;
        }

        this._mainAnimatable.goToFrame(value);
        this.setState({ currentFrame: value });
    }

    onChangeFromOrTo() {
        this.playOrPause();
        if (this._isPlaying) {
            this.playOrPause();
        }
    }

    override componentDidUpdate(prevProps: IAnimationGridComponentProps) {
        const prevId = (prevProps.animatable as any).uniqueId;
        const currId = (this.props.animatable as any).uniqueId;
        if (prevId !== currId) {
            this._animationCurveEditorContext = null;
        }
    }

    override render() {
        const animatable = this.props.animatable;
        const animatableAsAny = this.props.animatable as any;

        // NOTE: getAllAnimatablesByTarget is not defined unless animatable has been imported (and its side effects executed)
        const animatablesForTarget = this.props.scene.getAllAnimatablesByTarget?.(animatable) ?? [];
        this._isPlaying = animatablesForTarget.length > 0;

        if (this._isPlaying) {
            this._mainAnimatable = animatablesForTarget[0];
            if (this._mainAnimatable) {
                this._animationControl.from = this._mainAnimatable.fromFrame;
                this._animationControl.to = this._mainAnimatable.toFrame;
                this._animationControl.loop = this._mainAnimatable.loopAnimation;
                this._animationControl.initialized = true;
            }
        }

        const animations = animatable.animations;

        if (!this._animationCurveEditorContext) {
            this._animationCurveEditorContext = new Context();
            this._animationCurveEditorContext.title = (this.props.animatable as any).name || "";
            this._animationCurveEditorContext.animations = animations;
            this._animationCurveEditorContext.target = this.props.animatable;
            this._animationCurveEditorContext.scene = this.props.scene;
            this._animationCurveEditorContext.fromKey = this._animationControl.from;
            this._animationCurveEditorContext.toKey = this._animationControl.to;
            this._animationCurveEditorContext.useExistingPlayRange = this._animationControl.initialized;
        }

        return (
            <>
                {this._ranges.length > 0 && (
                    <LineContainerComponent title="ANIMATION RANGES" selection={this.props.globalState}>
                        {this._ranges.map((range, i) => {
                            return (
                                <ButtonLineComponent
                                    key={range.name + i}
                                    label={range.name}
                                    onClick={() => {
                                        this._mainAnimatable = null;
                                        this.props.scene.beginAnimation(animatable, range.from, range.to, true);
                                    }}
                                />
                            );
                        })}
                    </LineContainerComponent>
                )}
                {animations && (
                    <>
                        <LineContainerComponent title="ANIMATIONS" selection={this.props.globalState}>
                            <TextLineComponent label="Count" value={animations.length.toString()} />
                            {animations.map((anim, i) => {
                                return <TextLineComponent key={anim.targetProperty + i} label={"#" + i + " >"} value={anim.targetProperty} />;
                            })}
                            <AnimationCurveEditorComponent globalState={this.props.globalState} context={this._animationCurveEditorContext} />
                        </LineContainerComponent>
                        {animations.length > 0 && (
                            <LineContainerComponent title="ANIMATION GENERAL CONTROL" selection={this.props.globalState}>
                                <FloatLineComponent
                                    lockObject={this.props.lockObject}
                                    isInteger={true}
                                    label="From"
                                    target={this._animationControl}
                                    propertyName="from"
                                    onChange={() => this.onChangeFromOrTo()}
                                />
                                <FloatLineComponent
                                    lockObject={this.props.lockObject}
                                    isInteger={true}
                                    label="To"
                                    target={this._animationControl}
                                    propertyName="to"
                                    onChange={() => this.onChangeFromOrTo()}
                                />
                                <CheckBoxLineComponent
                                    label="Loop"
                                    onSelect={(value) => {
                                        this._animationControl.loop = value;

                                        for (const at of animatablesForTarget) {
                                            at.loopAnimation = value;
                                        }
                                    }}
                                    isSelected={() => this._animationControl.loop}
                                />
                                {this._isPlaying && (
                                    <SliderLineComponent
                                        lockObject={this.props.lockObject}
                                        ref={this._timelineRef}
                                        label="Current frame"
                                        minimum={this._animationControl.from}
                                        maximum={this._animationControl.to}
                                        step={(this._animationControl.to - this._animationControl.from) / 1000.0}
                                        directValue={this.state.currentFrame}
                                        onInput={(value) => this.onCurrentFrameChange(value)}
                                    />
                                )}
                                <ButtonLineComponent label={this._isPlaying ? "Stop" : "Play"} onClick={() => this.playOrPause()} />
                                {(this._ranges.length > 0 || (this._animations && this._animations.length > 0)) && (
                                    <>
                                        <CheckBoxLineComponent
                                            label="Enable override"
                                            onSelect={(value) => {
                                                if (value) {
                                                    animatableAsAny.animationPropertiesOverride = new AnimationPropertiesOverride();
                                                    animatableAsAny.animationPropertiesOverride.blendingSpeed = 0.05;
                                                } else {
                                                    animatableAsAny.animationPropertiesOverride = null;
                                                }
                                                this.forceUpdate();
                                            }}
                                            isSelected={() => animatableAsAny.animationPropertiesOverride != null}
                                            onValueChanged={() => this.forceUpdate()}
                                        />
                                        {animatableAsAny.animationPropertiesOverride != null && (
                                            <div>
                                                <CheckBoxLineComponent
                                                    label="Enable blending"
                                                    target={animatableAsAny.animationPropertiesOverride}
                                                    propertyName="enableBlending"
                                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                                />
                                                <SliderLineComponent
                                                    lockObject={this.props.lockObject}
                                                    label="Blending speed"
                                                    target={animatableAsAny.animationPropertiesOverride}
                                                    propertyName="blendingSpeed"
                                                    minimum={0}
                                                    maximum={0.1}
                                                    step={0.01}
                                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </LineContainerComponent>
                        )}
                    </>
                )}
            </>
        );
    }
}
