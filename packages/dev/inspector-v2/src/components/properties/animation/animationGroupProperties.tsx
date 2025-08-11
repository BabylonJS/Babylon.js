import type { AnimationGroup } from "core/Animations/animationGroup";
import { useCallback, type FunctionComponent } from "react";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../boundProperty";
import { useObservableState } from "../../../hooks/observableHooks";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";

interface ICurrentFrameHolder {
    currentFrame: number;
}

export const AnimationGroupControlProperties: FunctionComponent<{ animationGroup: AnimationGroup }> = (props) => {
    const { animationGroup } = props;
    const targetedAnimations = animationGroup.targetedAnimations;
    let currentFrameHolder: ICurrentFrameHolder | undefined = undefined;

    if (targetedAnimations.length > 0) {
        currentFrameHolder = targetedAnimations[0].animation.runtimeAnimations.find((rA) => rA.target === targetedAnimations[0].target);
    }

    const isPlaying = useObservableState(
        useCallback(() => {
            return animationGroup.isPlaying;
        }, [animationGroup]),
        animationGroup.onAnimationGroupPlayObservable,
        animationGroup.onAnimationGroupPauseObservable,
        animationGroup.onAnimationGroupEndObservable
    );

    const currentFrame = useObservableState(
        useCallback(() => {
            return currentFrameHolder ? currentFrameHolder.currentFrame : undefined;
        }, [currentFrameHolder]),
        isPlaying ? animationGroup.getScene().onBeforeRenderObservable : null
    );
    const enableBlending = useProperty(animationGroup, "enableBlending");
    return (
        <>
            <ButtonLine label={isPlaying ? "Pause" : "Play"} onClick={() => (isPlaying ? animationGroup.pause() : animationGroup.play(true))} />
            <ButtonLine label="Stop" onClick={() => animationGroup.stop()} />
            <BoundProperty component={SyncedSliderPropertyLine} label="Speed Ratio" min={0} max={10} step={0.1} target={animationGroup} propertyKey="speedRatio" />
            {currentFrameHolder ? (
                <SyncedSliderPropertyLine
                    label="Current Frame"
                    min={animationGroup.from}
                    max={animationGroup.to}
                    step={(animationGroup.to - animationGroup.from) / 1000.0}
                    value={currentFrame!}
                    onChange={(value) => {
                        if (!animationGroup.isPlaying) {
                            animationGroup.play(true);
                            animationGroup.goToFrame(value);
                            animationGroup.pause();
                        } else {
                            animationGroup.goToFrame(value);
                        }
                    }}
                />
            ) : null}
            <BoundProperty component={SwitchPropertyLine} label="Blending" target={animationGroup} propertyKey="enableBlending" ignoreNullable defaultValue={false} />
            <Collapse visible={!!enableBlending}>
                <>
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Blending Speed"
                        min={0}
                        max={1}
                        step={0.01}
                        target={animationGroup}
                        propertyKey="blendingSpeed"
                        ignoreNullable
                        defaultValue={0}
                    />
                    <BoundProperty component={SwitchPropertyLine} label="Is Additive" target={animationGroup} propertyKey="isAdditive" />
                    <BoundProperty component={NumberInputPropertyLine} label="Weight" target={animationGroup} propertyKey="weight" step={0.1} />
                    <BoundProperty component={NumberInputPropertyLine} label="Play Order" target={animationGroup} propertyKey="playOrder" step={0} />
                    {/* TODO: Hey georgie :<Play order> should be integer (even when typing)*/}
                </>
            </Collapse>
        </>
    );
};

export const AnimationGroupInfoProperties: FunctionComponent<{ animationGroup: AnimationGroup }> = (props) => {
    const { animationGroup } = props;
    return (
        <>
            <StringifiedPropertyLine label="Animation Count" value={animationGroup.targetedAnimations.length} />
            <StringifiedPropertyLine label="From" value={animationGroup.from} precision={2} />
            <StringifiedPropertyLine label="To" value={animationGroup.to} precision={2} />
            <StringifiedPropertyLine label="Unique ID" value={animationGroup.uniqueId} />
        </>
    );
};
