import type { FunctionComponent } from "react";

import { useCallback } from "react";

import type { AnimationGroup } from "core/Animations/animationGroup";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";
import { CurveEditorButton } from "../../curveEditor/curveEditorButton";

interface ICurrentFrameHolder {
    currentFrame: number;
}

export const AnimationGroupControlProperties: FunctionComponent<{ animationGroup: AnimationGroup }> = (props) => {
    const { animationGroup } = props;
    const targetedAnimations = animationGroup.targetedAnimations;
    const scene = animationGroup.getScene();
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
            <ButtonLine uniqueId="Start/Stop" label={isPlaying ? "Pause" : "Play"} onClick={() => (isPlaying ? animationGroup.pause() : animationGroup.play(true))} />
            <ButtonLine label="Stop" onClick={() => animationGroup.stop()} />
            <CurveEditorButton
                scene={scene}
                target={null}
                animations={targetedAnimations}
                rootAnimationGroup={animationGroup}
                title={animationGroup.name}
                useTargetAnimations={true}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Speed Ratio" min={0} max={10} step={0.1} target={animationGroup} propertyKey="speedRatio" />
            {currentFrameHolder && currentFrame !== undefined ? (
                <SyncedSliderPropertyLine
                    label="Current Frame"
                    min={animationGroup.from}
                    max={animationGroup.to}
                    step={(animationGroup.to - animationGroup.from) / 1000.0}
                    value={currentFrame}
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
                    <BoundProperty component={NumberInputPropertyLine} label="Play order" target={animationGroup} propertyKey="playOrder" forceInt />
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
