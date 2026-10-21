import { goToFrame, playAnimation, type AnimationGroup, type EngineContext, type TargetedAnimation } from "@babylonjs/lite";

import { GetSceneContexts, IsSceneNode } from "./sceneEntityUtils";

/**
 * Gets the distinct animation groups exposed by the inspected engine's registered scenes.
 * @param engine The engine to inspect.
 * @returns The animation groups in scene order, without duplicates.
 */
export function GetSceneAnimationGroups(engine: EngineContext): readonly AnimationGroup[] {
    return [...new Set(GetSceneContexts(engine).flatMap((scene) => scene.animationGroups))];
}

/**
 * Tests whether an entity is an animation group in a registered scene.
 * @param engine The inspected engine.
 * @param entity The entity to test.
 * @returns Whether the entity is a reachable animation group.
 */
export function IsAnimationGroup(engine: EngineContext, entity: unknown): entity is AnimationGroup {
    return GetSceneAnimationGroups(engine).some((group) => group === entity);
}

/**
 * Tests whether an entity is a public target description in a registered scene's animation group.
 * @param engine The inspected engine.
 * @param entity The entity to test.
 * @returns Whether the entity is a reachable targeted animation.
 */
export function IsTargetedAnimation(engine: EngineContext, entity: unknown): entity is TargetedAnimation {
    return GetSceneAnimationGroups(engine).some((group) => group.targetedAnimations.some((animation) => animation === entity));
}

/**
 * Gets animation groups that directly animate an entity or one of a scene node's transform values.
 * @param engine The inspected engine.
 * @param entity The entity whose animations should be listed.
 * @returns Reachable groups with matching public runtime targets.
 */
export function GetEntityAnimationGroups(engine: EngineContext, entity: object): readonly AnimationGroup[] {
    return GetSceneAnimationGroups(engine).filter((group) =>
        group.targetedAnimations.some(
            (animation) =>
                animation.target === entity ||
                (IsSceneNode(entity) &&
                    (animation.target === entity.position ||
                        animation.target === entity.rotationQuaternion ||
                        animation.target === entity.rotation ||
                        animation.target === entity.scaling))
        )
    );
}

/**
 * Gets a display name using the live runtime name when available, without requiring a runtime target.
 * @param animation The targeted animation.
 * @returns The target name or node identity and its animated path.
 */
export function GetTargetedAnimationDisplayName(animation: TargetedAnimation): string {
    const target = animation.target;
    const name = target && "name" in target && typeof target.name === "string" ? target.name : undefined;
    const targetName = name || animation.targetName || (animation.nodeIndex !== undefined ? `Node ${animation.nodeIndex}` : "Target");
    return `${targetName}: ${animation.path}`;
}

/**
 * Gets the frame rate used by Lite's goToFrame API.
 * @param group The animation group.
 * @returns The authored frame rate, or Lite's default of 60 frames per second.
 */
export function GetAnimationFrameRate(group: AnimationGroup): number {
    return group.frameRate || 60;
}

/**
 * Seeks through Lite's public API while preserving whether playback was active.
 * @param engine The engine used to apply GPU-backed animation poses.
 * @param group The animation group to seek.
 * @param frame The requested frame.
 */
export function SeekAnimationFrame(engine: EngineContext, group: AnimationGroup, frame: number): void {
    const wasPlaying = group.isPlaying;
    goToFrame(group, frame, engine);
    if (wasPlaying) {
        playAnimation(group);
    }
}
