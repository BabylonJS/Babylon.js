import * as React from "react";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { GlobalState } from "../../../../../globalState";
import { PopupComponent } from "../../../../../popupComponent";
import { BottomBarComponent } from "./bottomBar/bottomBarComponent";
import type { Context } from "./context";
import { TopBarComponent } from "./topBarComponent";
import { CanvasComponent } from "./graph/canvasComponent";
import { SideBarComponent } from "./sideBar/sideBarComponent";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";
import type { IterateAnimationCallback } from "core/Animations/animationTools";
import { replaceAnimations } from "core/Animations/animationTools";
import type { IAnimatable } from "core/Animations/animatable.interface";
import { CompactAnimation } from "core/Animations/compactAnimation";
import { compactAnimationToAnimation } from "core/Animations/compactAnimationTools";

import "./scss/curveEditor.scss";

interface IAnimationCurveEditorComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IAnimationCurveEditorComponentState {
    isOpen: boolean;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, IAnimationCurveEditorComponentState> {
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);

        this.state = { isOpen: false };
    }

    onCloseAnimationCurveEditor(window: Window | null) {
        if (window !== null) {
            window.close();
        }
        this.setState({ isOpen: false });
        this.props.context.activeAnimations = [];
        this.props.context.onActiveAnimationChanged.notifyObservers({});
    }

    shouldComponentUpdate(newProps: IAnimationCurveEditorComponentProps, newState: IAnimationCurveEditorComponentState) {
        if (newState.isOpen !== this.state.isOpen) {
            if (newState.isOpen) {
                this.props.context.prepare();
                if (this.props.context.animations && this.props.context.animations.length) {
                    setTimeout(() => {
                        this.props.context.activeAnimations.push(
                            this.props.context.useTargetAnimations
                                ? (this.props.context.animations![0] as TargetedAnimation).animation
                                : (this.props.context.animations![0] as Animation)
                        );
                        this.props.context.onActiveAnimationChanged.notifyObservers({});
                    });
                }
            }

            return true;
        }

        return false;
    }
    private _onKeyDown(evt: KeyboardEvent) {
        switch (evt.key) {
            case "Delete":
                if (this.props.context.activeKeyPoints?.length && !this.props.context.focusedInput) {
                    this.props.context.onDeleteKeyActiveKeyPoints.notifyObservers();
                }
                break;
            case " ":
                if (this.props.context.isPlaying) {
                    this.props.context.stop();
                } else {
                    this.props.context.play(true);
                }
                break;
            case "a":
                if (evt.ctrlKey) {
                    this.props.context.onSelectAllKeys.notifyObservers();
                    this.props.context.onActiveKeyPointChanged.notifyObservers();
                    evt.preventDefault();
                }
                break;
            case "ArrowLeft":
                if (!this.props.context.focusedInput) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(Math.max(0, this.props.context.activeFrame - 1));
                }
                break;
            case "ArrowRight":
                if (!this.props.context.focusedInput) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(Math.min(this.props.context.clipLength, this.props.context.activeFrame + 1));
                }
                break;
            case "ArrowDown": {
                const prevKey = this.props.context.getPrevKey();
                if (prevKey !== null) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(prevKey);
                }
                break;
            }
            case "ArrowUp": {
                const nextKey = this.props.context.getNextKey();
                if (nextKey !== null) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(nextKey);
                }
            }
        }
    }

    /**
     * Iterate all animations related to this.props.context
     */
    _iterateAnimationsInContext(callBack: IterateAnimationCallback): void {
        const context = this.props.context;
        let len: number | undefined = context.activeAnimations?.length;
        if (len) {
            for (let i = 0; i < len; i++) {
                const animation = context.activeAnimations[i];
                if (callBack(animation, i, context.activeAnimations) === false) {
                    return;
                }
            }
        }
        len = context.animations?.length;
        if (context.animations && len) {
            for (let i = 0; i < len; i++) {
                const animation = context.animations[i];
                if ((animation as TargetedAnimation).animation) {
                    if (callBack((animation as TargetedAnimation).animation, "animation", animation) === false) {
                        return;
                    }
                } else {
                    if (callBack(animation as Animation, i, context.animations) === false) {
                        return;
                    }
                }
            }
        }
        const animations = context.target?.animations;
        len = animations?.length;
        if (animations && len) {
            for (let i = 0; i < len; i++) {
                const animation = animations[i];
                if (callBack(animation, i, animations) === false) {
                    return;
                }
            }
        }

        const group = context.rootAnimationGroup;
        const targetedAnimations = group?.targetedAnimations;
        if (!targetedAnimations) {
            return;
        }
        let length = targetedAnimations.length;
        if (length) {
            for (let j = 0; j < length; j++) {
                const targetedAnimation = targetedAnimations[j];
                const animation = targetedAnimation?.animation;
                if (animation && callBack(animation, "animation", targetedAnimation)) {
                    return;
                }
                const target = targetedAnimation.target;
                if (target?.animations) {
                    const iAnimatable = target as IAnimatable;
                    const animations = iAnimatable.animations;
                    const animationsLength = animations?.length;
                    if (animations && animationsLength) {
                        for (let k = 0; k < animationsLength; k++) {
                            const animation = animations[k];
                            if (animation && callBack(animation, k, animations) === false) {
                                return;
                            }
                        }
                    }
                }
            }
        }
        const animatables = group?.animatables;
        length = animatables?.length;
        if (length) {
            for (let j = 0; j < length; j++) {
                const animatable = animatables[j];
                const runtimeAnimations = animatable.getAnimations();
                const length = runtimeAnimations?.length;
                if (length) {
                    for (let k = 0; k < length; k++) {
                        const runtimeAnimation = runtimeAnimations[k];
                        if (runtimeAnimation.animation && callBack(runtimeAnimation.animation, "_animation", runtimeAnimation) === false) {
                            return;
                        }
                    }
                }
            }
        }
    }

    /**
     * Check if this.props.context is currently holding any CompactAnimations
     */
    _hasCompactAnimation(): boolean {
        let hasCompactAnimation = false;
        this._iterateAnimationsInContext((animation) => {
            if (animation instanceof CompactAnimation) {
                hasCompactAnimation = true;
                return false;
            }
            return true;
        });
        return hasCompactAnimation;
    }

    /**
     * Convert all CompactAnimations holding by this.props.context to Animation
     */
    _convertCompactAnimationToAnimation(): void {
        // Map of ES2015 is used, legacy browsers might need a polyfill for that
        const map = new Map<CompactAnimation<any>, Animation>();

        this._iterateAnimationsInContext((animation) => {
            if (animation instanceof CompactAnimation) {
                if (!map.has(animation)) {
                    const converted = compactAnimationToAnimation(animation);
                    map.set(animation, converted);
                }
            }
        });

        replaceAnimations(this.props.context.scene, map);

        this._iterateAnimationsInContext((animation, key, context) => {
            const replacement = map.get(animation as CompactAnimation<any>);
            if (replacement) {
                context[key] = replacement;
            }
        });
    }

    public render() {
        return (
            <>
                <ButtonLineComponent
                    label="Edit"
                    onClick={() => {
                        if (this._hasCompactAnimation()) {
                            const msg =
                                "Can not edit CompactAnimation," +
                                " convert CompactAnimation to regular animation to continue editing," +
                                " which would consume much larger heap memory, continue?";
                            if (confirm(msg)) {
                                this._convertCompactAnimationToAnimation();
                                this.props.context.onActiveAnimationChanged.notifyObservers({});
                            } else {
                                return;
                            }
                        }
                        this.setState({ isOpen: true });
                    }}
                />
                {this.state.isOpen && (
                    <PopupComponent
                        id="curve-editor"
                        title="Animation Curve Editor"
                        size={{ width: 1024, height: 512 }}
                        onResize={() => this.props.context.onHostWindowResized.notifyObservers()}
                        onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}
                        onKeyDown={(evt) => this._onKeyDown(evt)}
                    >
                        <div id="curve-editor">
                            <TopBarComponent globalState={this.props.globalState} context={this.props.context} />
                            <SideBarComponent globalState={this.props.globalState} context={this.props.context} />
                            <CanvasComponent globalState={this.props.globalState} context={this.props.context} />
                            <BottomBarComponent globalState={this.props.globalState} context={this.props.context} />
                        </div>
                    </PopupComponent>
                )}
            </>
        );
    }
}
