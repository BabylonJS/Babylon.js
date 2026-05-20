/* eslint-disable @typescript-eslint/naming-convention */
import {
    type AnimationAppendSerializedAnimations,
    type AnimationCreateAndStartAnimation,
    type AnimationCreateAndStartHierarchyAnimation,
    type AnimationCreateFromSnippetAsync,
    type AnimationCreateMergeAndStartAnimation,
    type AnimationCreateAnimation,
    type AnimationMakeAnimationAdditive,
    type AnimationParse,
    type AnimationParseFromFileAsync,
    type AnimationParseFromSnippetAsync,
    type AnimationTransitionTo,
} from "./animation.pure";

type AnimationAppendSerializedAnimationsType = typeof AnimationAppendSerializedAnimations;
type AnimationCreateAndStartAnimationType = typeof AnimationCreateAndStartAnimation;
type AnimationCreateAndStartHierarchyAnimationType = typeof AnimationCreateAndStartHierarchyAnimation;
type AnimationCreateFromSnippetAsyncType = typeof AnimationCreateFromSnippetAsync;
type AnimationCreateMergeAndStartAnimationType = typeof AnimationCreateMergeAndStartAnimation;
type AnimationCreateAnimationType = typeof AnimationCreateAnimation;
type AnimationMakeAnimationAdditiveType = typeof AnimationMakeAnimationAdditive;
type AnimationParseType = typeof AnimationParse;
type AnimationParseFromFileAsyncType = typeof AnimationParseFromFileAsync;
type AnimationParseFromSnippetAsyncType = typeof AnimationParseFromSnippetAsync;
type AnimationTransitionToType = typeof AnimationTransitionTo;

declare module "./animation.pure" {
    namespace Animation {
        export let Parse: AnimationParseType;
        export let ParseFromFileAsync: AnimationParseFromFileAsyncType;
        export let ParseFromSnippetAsync: AnimationParseFromSnippetAsyncType;
        export let CreateFromSnippetAsync: AnimationCreateFromSnippetAsyncType;
        export let CreateAnimation: AnimationCreateAnimationType;
        export let CreateAndStartAnimation: AnimationCreateAndStartAnimationType;
        export let CreateAndStartHierarchyAnimation: AnimationCreateAndStartHierarchyAnimationType;
        export let CreateMergeAndStartAnimation: AnimationCreateMergeAndStartAnimationType;
        export let MakeAnimationAdditive: AnimationMakeAnimationAdditiveType;
        export let TransitionTo: AnimationTransitionToType;
        export let AppendSerializedAnimations: AnimationAppendSerializedAnimationsType;
    }
}
