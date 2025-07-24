import type { FunctionComponent } from "react";

import type { /*AnimationPropertiesOverride,*/ AnimationRange, IAnimatable, Nullable, Scene } from "core/index";

import { useCallback, useRef } from "react";
import { Badge } from "@fluentui/react-components";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { useObservableState } from "../../../hooks/observableHooks";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

// interface IAnimatableInternal extends IAnimatable {
//     animationPropertiesOverride?: Nullable<AnimationPropertiesOverride>;
// }

export interface IAnimationRangeContainer {
    getAnimationRanges(): Nullable<AnimationRange>[];
}

export interface IAnimatableContainer {
    getAnimatables(): IAnimatable[];
}

export const AnimationsProperties: FunctionComponent<{ scene: Scene; entity: Partial<IAnimatable & IAnimationRangeContainer & IAnimatableContainer> }> = (props) => {
    const { scene, entity } = props;

    const animations = entity.animations ?? [];
    const ranges = entity.getAnimationRanges?.()?.filter((range) => !!range) ?? [];
    const childAnimatables = entity.getAnimatables?.() ?? [];

    const lastFrom = useRef(0);
    const lastTo = useRef(0);
    const lastLoop = useRef(false);

    const animatablesForTarget = scene.getAllAnimatablesByTarget(entity);
    const isPlaying = animatablesForTarget.length > 0;
    const mainAnimatable = isPlaying ? animatablesForTarget[0] : undefined;

    if (mainAnimatable) {
        lastFrom.current = mainAnimatable.fromFrame;
        lastTo.current = mainAnimatable.toFrame;
        lastLoop.current = mainAnimatable.loopAnimation;
    }

    const hasAnimations = animations.length > 0 || ranges.length > 0 || childAnimatables.length > 0;

    const currentFrame = useObservableState(
        useCallback(() => {
            return mainAnimatable ? mainAnimatable.masterFrame : (scene.getAllAnimatablesByTarget(entity)[0]?.masterFrame ?? 0);
        }, [scene, entity, mainAnimatable]),
        hasAnimations ? scene.onAfterAnimationsObservable : undefined
    );

    return (
        <>
            {!hasAnimations ? (
                <MessageBar
                    intent="info"
                    title="No Animations"
                    message="To modify animations, attach an animation to this node."
                    docLink="https://doc.babylonjs.com/features/featuresDeepDive/animation/"
                />
            ) : (
                <>
                    {ranges.length > 0 && (
                        <PropertyLine
                            label="Ranges"
                            expandedContent={
                                <>
                                    {ranges.map((range) => {
                                        return (
                                            <ButtonLine
                                                key={range.name}
                                                label={range.name}
                                                onClick={() => {
                                                    scene.beginAnimation(entity, range.from, range.to, true);
                                                }}
                                            />
                                        );
                                    })}
                                </>
                            }
                        >
                            <Badge appearance="filled">{ranges.length}</Badge>
                        </PropertyLine>
                    )}
                    {animations.length > 0 && (
                        <>
                            <PropertyLine
                                label="Animations"
                                expandedContent={
                                    <>
                                        {animations.map((animation, index) => {
                                            return <TextPropertyLine key={animation.uniqueId} label={`${index}: ${animation.name}`} value={animation.targetProperty} />;
                                        })}
                                    </>
                                }
                            >
                                <Badge appearance="filled">{animations.length}</Badge>
                            </PropertyLine>
                            {mainAnimatable && (
                                <>
                                    <PropertyLine
                                        label="Animation Controls"
                                        expandedContent={
                                            <>
                                                <NumberInputPropertyLine
                                                    label="From"
                                                    value={mainAnimatable.fromFrame}
                                                    onChange={(value) => {
                                                        scene.stopAnimation(entity);
                                                        scene.beginAnimation(entity, value, mainAnimatable.toFrame, true);
                                                    }}
                                                />
                                                <NumberInputPropertyLine
                                                    label="To"
                                                    value={mainAnimatable.toFrame}
                                                    onChange={(value) => {
                                                        scene.stopAnimation(entity);
                                                        scene.beginAnimation(entity, mainAnimatable.fromFrame, value, true);
                                                    }}
                                                />
                                                <SwitchPropertyLine
                                                    label="Loop"
                                                    value={mainAnimatable.loopAnimation}
                                                    onChange={(value) => {
                                                        for (const animatable of animatablesForTarget) {
                                                            animatable.loopAnimation = value;
                                                        }
                                                    }}
                                                />
                                                <SyncedSliderPropertyLine
                                                    label="Current Frame"
                                                    value={currentFrame}
                                                    min={mainAnimatable.fromFrame}
                                                    max={mainAnimatable.toFrame}
                                                    step={(mainAnimatable.toFrame - mainAnimatable.fromFrame) / 1000}
                                                    onChange={(value) => {
                                                        mainAnimatable.goToFrame(value);
                                                    }}
                                                />
                                            </>
                                        }
                                        expandByDefault
                                    ></PropertyLine>
                                </>
                            )}
                            <ButtonLine
                                label={isPlaying ? "Stop Animation" : "Play Animation"}
                                onClick={() => {
                                    if (isPlaying) {
                                        scene.stopAnimation(entity);
                                    } else {
                                        scene.beginAnimation(entity, lastFrom.current, lastTo.current, lastLoop.current);
                                    }
                                }}
                            />
                        </>
                    )}
                </>
            )}
            {/* <TextPropertyLine label="Count" value={animations.length.toString()} /> */}
            {/* {animations.map((animation, index) => {
                return <TextPropertyLine key={animation.uniqueId} label={`${index}: ${animation.name}`} value={animation.targetProperty} />;
            })} */}
        </>
    );
};
