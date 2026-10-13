import { pauseAnimation, playAnimation, setAnimationWeight, stopAnimation, type AnimationGroup, type EngineContext, type TargetedAnimation } from "@babylonjs/lite";
import { type FunctionComponent, useCallback } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Link } from "shared-ui-components/fluent/primitives/link";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

import { GetEntityId } from "../../../components/explorer/explorerModel";
import { BoundProperty, ComputedProperty, DerivedProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue, useWatcher } from "../../../contexts/watcherContext";
import { type ISelectionService } from "../../../services/selectionService";
import { GetAnimationFrameRate, GetEntityAnimationGroups, GetTargetedAnimationDisplayName, SeekAnimationFrame } from "../../animationUtils";

const GetIsPlaying = (group: AnimationGroup) => group.isPlaying;
const GetCurrentFrame = (group: AnimationGroup) => group.currentTime * GetAnimationFrameRate(group);
const GetLastFrame = (group: AnimationGroup) => group.duration * GetAnimationFrameRate(group);
const GetAnimationCount = (group: AnimationGroup) => group.targetedAnimations.length;
const GetWeight = (group: AnimationGroup) => group.weight;
const GetGroupName = (group: AnimationGroup) => group.name || "Unnamed Animation Group";
const GetAnimationTarget = (animation: TargetedAnimation) => animation.target;
const GetGroupPropertyOwner = (group: AnimationGroup) => group;

type AnimationGroupProps = {
    /** The engine used to apply GPU-backed poses when seeking. */
    engine: EngineContext;
    /** The animation group being inspected. */
    group: AnimationGroup;
};

type TargetedAnimationProps = {
    /** The public target description being inspected. */
    animation: TargetedAnimation;
    /** The selection service used to navigate to runtime targets. */
    selectionService: ISelectionService;
};

type EntityAnimationProps = {
    /** The engine whose registered scene groups are searched. */
    engine: EngineContext;
    /** The runtime entity whose animation relationships are displayed. */
    entity: object;
    /** The selection service used to navigate to groups. */
    selectionService: ISelectionService;
};

/**
 * Renders Lite animation playback and frame controls.
 * @param props The engine and animation group.
 * @returns The group's control property lines.
 */
export const AnimationGroupControlProperties: FunctionComponent<AnimationGroupProps> = (props) => {
    const { engine, group } = props;
    const watcher = useWatcher();
    const isPlaying = useWatchedValue(group, GetIsPlaying);
    const lastFrame = useWatchedValue(group, GetLastFrame);
    const seekFrame = useCallback(
        (animationGroup: AnimationGroup, frame: number) => {
            SeekAnimationFrame(engine, animationGroup, frame);
        },
        [engine]
    );

    return (
        <>
            <ButtonLine
                uniqueId="Start/Stop"
                label={isPlaying ? "Pause" : "Play"}
                onClick={() => {
                    if (group.isPlaying) {
                        pauseAnimation(group);
                    } else {
                        playAnimation(group);
                    }
                    watcher.refresh();
                }}
            />
            <ButtonLine
                label="Stop"
                onClick={() => {
                    stopAnimation(group);
                    watcher.refresh();
                }}
            />
            <BoundProperty component={SyncedSliderPropertyLine} label="Speed Ratio" min={0} max={10} step={0.1} target={group} propertyKey="speedRatio" />
            <BoundProperty component={SwitchPropertyLine} label="Loop" target={group} propertyKey="loopAnimation" />
            <DerivedProperty
                component={SyncedSliderPropertyLine}
                label="Current Frame"
                target={group}
                getValue={GetCurrentFrame}
                setValue={seekFrame}
                min={0}
                max={lastFrame}
                step={lastFrame > 0 ? lastFrame / 1000 : 1}
                disabled={lastFrame <= 0}
            />
            <DerivedProperty
                component={SyncedSliderPropertyLine}
                label="Weight"
                min={0}
                max={1}
                step={0.01}
                target={group}
                getValue={GetWeight}
                setValue={setAnimationWeight}
                propertyPath="weight"
                getPropertyOwner={GetGroupPropertyOwner}
                propertyKey="weight"
            />
        </>
    );
};

/**
 * Renders public clip information in Lite frame units.
 * @param props The animation group.
 * @returns Read-only clip property lines.
 */
export const AnimationGroupInfoProperties: FunctionComponent<Pick<AnimationGroupProps, "group">> = (props) => {
    const { group } = props;

    return (
        <>
            <BoundProperty component={TextPropertyLine} label="Name" target={group} propertyKey="name" />
            <ComputedProperty component={StringifiedPropertyLine} label="Animation Count" target={group} getValue={GetAnimationCount} />
            <BoundProperty component={StringifiedPropertyLine} label="Duration (seconds)" target={group} propertyKey="duration" precision={2} />
            <ComputedProperty component={StringifiedPropertyLine} label="Frame Rate" target={group} getValue={GetAnimationFrameRate} />
            <ComputedProperty component={StringifiedPropertyLine} label="End Frame" target={group} getValue={GetLastFrame} precision={2} />
        </>
    );
};

/**
 * Renders a public animation target description and optional runtime link.
 * @param props The target description and selection service.
 * @returns The target's general property lines.
 */
export const TargetedAnimationProperties: FunctionComponent<TargetedAnimationProps> = (props) => {
    const { animation, selectionService } = props;
    const target = useWatchedValue(animation, GetAnimationTarget);
    const displayName = useWatchedValue(animation, GetTargetedAnimationDisplayName);

    return (
        <>
            {target ? (
                <PropertyLine label="Target" description="The runtime object affected by this animation, when exposed by Babylon Lite.">
                    <Link value={displayName} onLink={() => (selectionService.selectedEntity = target)} />
                </PropertyLine>
            ) : (
                <TextPropertyLine label="Target" value={displayName} />
            )}
            <BoundProperty component={TextPropertyLine} label="Path" target={animation} propertyKey="path" />
            <BoundProperty component={TextPropertyLine} label="Target Name" target={animation} propertyKey="targetName" defaultValue={null} />
            <BoundProperty component={StringifiedPropertyLine} label="Node Index" target={animation} propertyKey="nodeIndex" defaultValue={null} />
        </>
    );
};

const AnimationGroupLink: FunctionComponent<Pick<AnimationGroupProps, "group"> & Pick<EntityAnimationProps, "selectionService">> = (props) => {
    const { group, selectionService } = props;
    const name = useWatchedValue(group, GetGroupName);
    return (
        <PropertyLine label="Animation Group" uniqueId={`AnimationGroup-${GetEntityId(group)}`}>
            <Link value={name} onLink={() => (selectionService.selectedEntity = group)} />
        </PropertyLine>
    );
};

/**
 * Lists an entity's reachable animation groups.
 * @param props The engine, entity, and selection service.
 * @returns Group links or an explanation when no runtime targets match.
 */
export const EntityAnimationProperties: FunctionComponent<EntityAnimationProps> = (props) => {
    const { engine, entity, selectionService } = props;
    const getGroupIdentities = useCallback(
        () =>
            GetEntityAnimationGroups(engine, entity)
                .map((group) => GetEntityId(group))
                .join(","),
        [engine, entity]
    );
    useWatchedValue(entity, getGroupIdentities);
    const groups = GetEntityAnimationGroups(engine, entity);

    return groups.length ? (
        <>
            {groups.map((group) => (
                <AnimationGroupLink key={GetEntityId(group)} group={group} selectionService={selectionService} />
            ))}
        </>
    ) : (
        <MessageBar intent="info" title="No Animations" message="No scene animation groups expose a runtime target for this entity." />
    );
};
