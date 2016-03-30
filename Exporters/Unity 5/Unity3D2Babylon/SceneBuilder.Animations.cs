using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using BabylonExport.Entities;
using UnityEditor;
using UnityEditor.Animations;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private static void ExportAnimations(Transform transform, BabylonIAnimatable animatable)
        {
            var animator = transform.gameObject.GetComponent<Animator>();
            if (animator != null)
            {
                AnimatorController ac = animator.runtimeAnimatorController as AnimatorController;
                if (ac == null)
                {
                    return;
                }
                var layer = ac.layers[0];
                if (layer == null)
                {
                    return;
                }
                AnimatorStateMachine sm = layer.stateMachine;
                if (sm.states.Length > 0)
                {
                    var state = sm.states[0].state; // We only support the first one
                    AnimationClip clip = state.motion as AnimationClip;
                    if (clip != null)
                    {
                        ExportAnimationClip(clip, true, animatable);
                    }
                }
            }
            else
            {
                var animation = transform.gameObject.GetComponent<Animation>();
                if (animation != null && animation.clip != null)
                {
                    ExportAnimationClip(animation.clip, animation.playAutomatically, animatable);
                }
            }
        }

        private static bool IsRotationQuaternionAnimated(BabylonIAnimatable animatable)
        {
            if (animatable.animations == null)
            {
                return false;
            }

            return animatable.animations.Any(animation => animation.property.Contains("rotationQuaternion"));
        }

        private static void ExportAnimationClip(AnimationClip clip, bool autoPlay, BabylonIAnimatable animatable)
        {
            var curveBindings = AnimationUtility.GetCurveBindings(clip);

            var animations = new List<BabylonAnimation>();

            var maxFrame = 0;

            foreach (var binding in curveBindings)
            {
                var curve = AnimationUtility.GetEditorCurve(clip, binding);
                string property;

                switch (binding.propertyName)
                {
                    case "m_LocalPosition.x":
                        property = "position.x";
                        break;
                    case "m_LocalPosition.y":
                        property = "position.y";
                        break;
                    case "m_LocalPosition.z":
                        property = "position.z";
                        break;

                    case "m_LocalRotation.x":
                        property = "rotationQuaternion.x";
                        break;
                    case "m_LocalRotation.y":
                        property = "rotationQuaternion.y";
                        break;
                    case "m_LocalRotation.z":
                        property = "rotationQuaternion.z";
                        break;
                    case "m_LocalRotation.w":
                        property = "rotationQuaternion.w";
                        break;

                    case "m_LocalScale.x":
                        property = "scaling.x";
                        break;
                    case "m_LocalScale.y":
                        property = "scaling.y";
                        break;
                    case "m_LocalScale.z":
                        property = "scaling.z";
                        break;
                    default:
                        continue;
                }

                var babylonAnimation = new BabylonAnimation
                {
                    dataType = (int)BabylonAnimation.DataType.Float,
                    name = property + " animation",
                    keys = curve.keys.Select(keyFrame => new BabylonAnimationKey
                    {
                        frame = (int)(keyFrame.time * clip.frameRate),
                        values = new[] { keyFrame.value }
                    }).ToArray(),
                    framePerSecond = (int)clip.frameRate,
                    loopBehavior = (int)BabylonAnimation.LoopBehavior.Cycle,
                    property = property
                };

                maxFrame = Math.Max(babylonAnimation.keys.Last().frame, maxFrame);

                animations.Add(babylonAnimation);
            }

            if (animations.Count > 0)
            {
                animatable.animations = animations.ToArray();
                if (autoPlay)
                {
                    animatable.autoAnimate = true;
                    animatable.autoAnimateFrom = 0;
                    animatable.autoAnimateTo = maxFrame;
                    animatable.autoAnimateLoop = clip.isLooping;
                }
            }
        }
    }
}
