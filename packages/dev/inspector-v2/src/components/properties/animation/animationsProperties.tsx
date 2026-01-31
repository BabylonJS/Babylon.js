import type { FunctionComponent } from "react";

import { useCallback, useRef } from "react";
import { Badge } from "@fluentui/react-components";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useObservableState } from "../../../hooks/observableHooks";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import type { AnimationRange } from "core/Animations/animationRange";
import type { Nullable } from "core/types";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { Scene } from "core/scene";
import { AnimationPropertiesOverride } from "core/Animations/animationPropertiesOverride";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { CurveEditorButton } from "../../curveEditor/curveEditorButton";

export interface IAnimationRangeContainer {
    getAnimationRanges(): Nullable<AnimationRange>[];
}

export interface IAnimatableContainer {
    getAnimatables(): IAnimatable[];
}

declare module "core/Animations/animatable" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Animatable {
        animationPropertiesOverride?: AnimationPropertiesOverride;
    }
}

export const AnimationsProperties: FunctionComponent<{ scene: Scene; entity: Partial<IAnimatable & IAnimationRangeContainer & IAnimatableContainer> }> = (props) => {
    const { scene, entity } = props;

    // Track animations array changes via property interception
    const trackedAnimations = useProperty(entity as IAnimatable, "animations");
    const animations = trackedAnimations ?? [];
    const ranges = entity.getAnimationRanges?.()?.filter((range) => !!range) ?? [];
    const childAnimatablesAnimations = entity.getAnimatables?.().flatMap((animatable) => animatable.animations ?? []) ?? [];
    animations.concat(childAnimatablesAnimations);

    const lastFrom = useRef(0);
    const lastTo = useRef(0);
    const lastLoop = useRef(false);

    const animatablesForTarget = scene.getAllAnimatablesByTarget(entity);
    const isPlaying = animatablesForTarget.length > 0;
    const mainAnimatable = isPlaying ? animatablesForTarget[0] : undefined;

    const animationPropertiesOverride = useProperty(mainAnimatable, "animationPropertiesOverride");

    if (mainAnimatable) {
        lastFrom.current = mainAnimatable.fromFrame;
        lastTo.current = mainAnimatable.toFrame;
        lastLoop.current = mainAnimatable.loopAnimation;
    }

    const hasAnimations = animations.length > 0 || ranges.length > 0;

    const currentFrame = useObservableState(
        useCallback(() => {
            return mainAnimatable ? mainAnimatable.masterFrame : (scene.getAllAnimatablesByTarget(entity)[0]?.masterFrame ?? 0);
        }, [scene, entity, mainAnimatable]),
        hasAnimations ? scene.onAfterAnimationsObservable : undefined
    );

    return (
        <>
            {!hasAnimations && (
                <MessageBar
                    intent="info"
                    title="No Animations"
                    message="To modify animations, attach an animation to this node."
                    docLink="https://doc.babylonjs.com/features/featuresDeepDive/animation/"
                />
            )}
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
            )}
            {/* CurveEditorButton is always rendered at the same position to preserve ChildWindow state */}
            <CurveEditorButton scene={scene} target={entity as IAnimatable} animations={animations} title={(entity as { name?: string }).name ?? "Animation Curve Editor"} />
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
            {hasAnimations && (
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
            )}
            {mainAnimatable && (ranges.length > 0 || animations.length > 0) ? (
                <>
                    <SwitchPropertyLine
                        label="Enable Override"
                        value={animationPropertiesOverride != null}
                        onChange={(value) => {
                            if (value) {
                                mainAnimatable.animationPropertiesOverride = new AnimationPropertiesOverride();
                                mainAnimatable.animationPropertiesOverride.blendingSpeed = 0.05;
                            } else {
                                mainAnimatable.animationPropertiesOverride = undefined;
                            }
                        }}
                    />
                    <Collapse visible={animationPropertiesOverride != null}>
                        <div>
                            <BoundProperty component={SwitchPropertyLine} label="Enable Blending" target={animationPropertiesOverride!} propertyKey="enableBlending" />
                            <BoundProperty
                                component={SyncedSliderPropertyLine}
                                label="Blending Speed"
                                target={animationPropertiesOverride!}
                                propertyKey="blendingSpeed"
                                min={0}
                                max={0.1}
                                step={0.01}
                            />
                        </div>
                    </Collapse>
                </>
            ) : null}
        </>
    );
};
