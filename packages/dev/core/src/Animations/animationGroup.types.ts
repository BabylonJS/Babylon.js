/* eslint-disable @typescript-eslint/naming-convention */
import {
    type AnimationGroupClipFrames,
    type AnimationGroupClipFramesInPlace,
    type AnimationGroupClipInPlace,
    type AnimationGroupClipKeys,
    type AnimationGroupClipKeysInPlace,
    type AnimationGroupMakeAnimationAdditive,
    type AnimationGroupMergeAnimationGroups,
    type AnimationGroupParse,
} from "./animationGroup.pure";

type AnimationGroupClipFramesType = typeof AnimationGroupClipFrames;
type AnimationGroupClipFramesInPlaceType = typeof AnimationGroupClipFramesInPlace;
type AnimationGroupClipInPlaceType = typeof AnimationGroupClipInPlace;
type AnimationGroupClipKeysType = typeof AnimationGroupClipKeys;
type AnimationGroupClipKeysInPlaceType = typeof AnimationGroupClipKeysInPlace;
type AnimationGroupMakeAnimationAdditiveType = typeof AnimationGroupMakeAnimationAdditive;
type AnimationGroupMergeAnimationGroupsType = typeof AnimationGroupMergeAnimationGroups;
type AnimationGroupParseType = typeof AnimationGroupParse;

declare module "./animationGroup.pure" {
    namespace AnimationGroup {
        export let ClipFrames: AnimationGroupClipFramesType;
        export let ClipFramesInPlace: AnimationGroupClipFramesInPlaceType;
        export let ClipInPlace: AnimationGroupClipInPlaceType;
        export let ClipKeys: AnimationGroupClipKeysType;
        export let ClipKeysInPlace: AnimationGroupClipKeysInPlaceType;
        export let MakeAnimationAdditive: AnimationGroupMakeAnimationAdditiveType;
        export let MergeAnimationGroups: AnimationGroupMergeAnimationGroupsType;
        export let Parse: AnimationGroupParseType;
    }
}
