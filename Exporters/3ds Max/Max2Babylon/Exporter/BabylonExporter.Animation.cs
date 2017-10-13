using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;
using System.Runtime.InteropServices;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        const int Ticks = 160;

        private static bool ExportBabylonKeys(List<BabylonAnimationKey> keys, string property, List<BabylonAnimation> animations, BabylonAnimation.DataType dataType, BabylonAnimation.LoopBehavior loopBehavior)
        {
            if (keys.Count == 0)
            {
                return false;
            }

            var end = Loader.Core.AnimRange.End;
            if (keys[keys.Count - 1].frame != end / Ticks)
            {
                keys.Add(new BabylonAnimationKey()
                {
                    frame = end / Ticks,
                    values = keys[keys.Count - 1].values
                });
            }

            var babylonAnimation = new BabylonAnimation
            {
                dataType = (int)dataType,
                name = property + " animation",
                keys = keys.ToArray(),
                framePerSecond = Loader.Global.FrameRate,
                loopBehavior = (int)loopBehavior,
                property = property
            };

            animations.Add(babylonAnimation);

            return true;
        }

        // -----------------------
        // -- From GameControl ---
        // -----------------------

        private bool ExportFloatGameController(IIGameControl control, string property, List<BabylonAnimation> animations)
        {
            return ExportGameController(control, property, animations, IGameControlType.Float, BabylonAnimation.DataType.Float, gameKey => new float[] { gameKey.SampleKey.Fval / 100.0f });
        }

        private bool ExportGameController(IIGameControl control, string property, List<BabylonAnimation> animations, IGameControlType type, BabylonAnimation.DataType dataType, Func<IIGameKey, float[]> extractValueFunc)
        {
            var keys = ExportBabylonKeysFromGameController(control, type, extractValueFunc);

            if (keys == null)
            {
                return false;
            }

            var loopBehavior = BabylonAnimation.LoopBehavior.Cycle;
            return ExportBabylonKeys(keys, property, animations, dataType, loopBehavior);
        }

        private List<BabylonAnimationKey> ExportBabylonKeysFromGameController(IIGameControl control, IGameControlType type, Func<IIGameKey, float[]> extractValueFunc)
        {
            if (control == null)
            {
                return null;
            }

            ITab<IIGameKey> gameKeyTab = GlobalInterface.Instance.Tab.Create<IIGameKey>();
            control.GetQuickSampledKeys(gameKeyTab, type);

            if (gameKeyTab == null)
            {
                return null;
            }

            var keys = new List<BabylonAnimationKey>();
            for (int indexKey = 0; indexKey < gameKeyTab.Count; indexKey++)
            {
#if MAX2017
                var indexer = indexKey;
#else
                    var indexer = new IntPtr(indexKey);
                    Marshal.FreeHGlobal(indexer);
#endif
                var gameKey = gameKeyTab[indexer];

                var key = new BabylonAnimationKey()
                {
                    frame = gameKey.T / Ticks,
                    values = extractValueFunc(gameKey)
                };
                keys.Add(key);
            }

            return keys;
        }

        // -----------------------
        // ---- From Control -----
        // -----------------------

        private static BabylonAnimationKey GenerateFloatFunc(int index, IIKeyControl keyControl)
        {
            var key = Loader.Global.ILinFloatKey.Create();
            keyControl.GetKey(index, key);

            return new BabylonAnimationKey
            {
                frame = key.Time / Ticks,
                values = new[] { key.Val }
            };
        }

        private static bool ExportFloatController(IControl control, string property, List<BabylonAnimation> animations)
        {
            return ExportController(control, property, animations, 0x2001, BabylonAnimation.DataType.Float, GenerateFloatFunc);
        }

        private static bool ExportQuaternionController(IControl control, string property, List<BabylonAnimation> animations)
        {
            IQuat previousQuat = null;

            return ExportController(control, property, animations, 0x2003, BabylonAnimation.DataType.Quaternion,
                (index, keyControl) =>
                {
                    var key = Loader.Global.ILinRotKey.Create();
                    keyControl.GetKey(index, key);
                    var newQuat = key.Val;

                    if (index > 0)
                    {
                        newQuat = previousQuat.Multiply(newQuat);
                    }

                    previousQuat = newQuat;

                    return new BabylonAnimationKey
                    {
                        frame = key.Time / Ticks,
                        values = newQuat.ToArray()
                    };
                });
        }

        private static bool ExportVector3Controller(IControl control, string property, List<BabylonAnimation> animations)
        {
            var result = false;

            if (control == null)
            {
                return false;
            }

            if (control.XController != null || control.YController != null || control.ZController != null)
            {
                result |= ExportFloatController(control.XController, property + ".x", animations);
                result |= ExportFloatController(control.ZController, property + ".y", animations);
                result |= ExportFloatController(control.YController, property + ".z", animations);

                return result;
            }

            if (ExportController(control, property, animations, 0x2002, BabylonAnimation.DataType.Vector3,
                (index, keyControl) =>
                {
                    var key = Loader.Global.ILinPoint3Key.Create();
                    keyControl.GetKey(index, key);

                    return new BabylonAnimationKey
                    {
                        frame = key.Time / Ticks,
                        values = key.Val.ToArraySwitched()
                    };
                }))
            {
                return true;
            }

            return ExportController(control, property, animations, 0x2004, BabylonAnimation.DataType.Vector3,
                (index, keyControl) =>
                {
                    var key = Loader.Global.ILinScaleKey.Create();
                    keyControl.GetKey(index, key);

                    return new BabylonAnimationKey
                    {
                        frame = key.Time / Ticks,
                        values = key.Val.S.ToArraySwitched()
                    };
                });
        }

        private static bool ExportController(IControl control, string property, List<BabylonAnimation> animations, uint classId, BabylonAnimation.DataType dataType, Func<int, IIKeyControl, BabylonAnimationKey> generateFunc)
        {
            if (control == null)
            {
                return false;
            }

            var keyControl = control.GetInterface(InterfaceID.Keycontrol) as IIKeyControl;

            if (keyControl == null)
            {
                return false;
            }

            if (control.ClassID.PartA != classId)
            {
                return false;
            }

            BabylonAnimation.LoopBehavior loopBehavior;
            switch (control.GetORT(2))
            {
                case 2:
                    loopBehavior = BabylonAnimation.LoopBehavior.Cycle;
                    break;
                default:
                    loopBehavior = BabylonAnimation.LoopBehavior.Relative;
                    break;
            }

            var keys = new List<BabylonAnimationKey>();
            for (var index = 0; index < keyControl.NumKeys; index++)
            {
                keys.Add(generateFunc(index, keyControl));
            }

            return ExportBabylonKeys(keys, property, animations, dataType, loopBehavior);
        }

        // -----------------------
        // ---- From ext func ----
        // -----------------------

        private static void ExportColor3Animation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Color3);
        }

        private static void ExportVector3Animation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Vector3);
        }

        private static void ExportQuaternionAnimation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Quaternion);
        }

        private static void ExportFloatAnimation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Float);
        }

        private static BabylonAnimation ExportMatrixAnimation(string property, Func<int, float[]> extractValueFunc, bool removeLinearAnimationKeys = true)
        {
            return ExportAnimation(property, extractValueFunc, BabylonAnimation.DataType.Matrix, removeLinearAnimationKeys);
        }

        static void RemoveLinearAnimationKeys(List<BabylonAnimationKey> keys)
        {
            for (int ixFirst = keys.Count - 3; ixFirst >= 0; --ixFirst)
            {
                while (keys.Count - ixFirst >= 3)
                {
                    if (!RemoveAnimationKey(keys, ixFirst))
                    {
                        break;
                    }
                }
            }
        }

        static float[] weightedLerp(int frame0, int frame1, int frame2, float[] value0, float[] value2)
        {
            double weight2 = (frame1 - frame0) / (double)(frame2 - frame0);
            double weight0 = 1 - weight2;
            float[] result = new float[value0.Length];
            for (int i = 0; i < result.Length; ++i)
            {
                result[i] = (float)(value0[i] * weight0 + value2[i] * weight2);
            }
            return result;
        }

        private static bool RemoveAnimationKey(List<BabylonAnimationKey> keys, int ixFirst)
        {
            var first = keys[ixFirst];
            var middle = keys[ixFirst + 1];
            var last = keys[ixFirst + 2];

            // first pass, frame equality
            if (first.values.IsEqualTo(last.values) && first.values.IsEqualTo(middle.values))
            {
                keys.RemoveAt(ixFirst + 1);
                return true;
            }

            // second pass : linear interpolation detection
            var computedMiddleValue = weightedLerp(first.frame, middle.frame, last.frame, first.values, last.values);
            if (computedMiddleValue.IsEqualTo(middle.values))
            {
                keys.RemoveAt(ixFirst + 1);
                return true;
            }
            return false;

        }

        private static void ExportAnimation(string property, List<BabylonAnimation> animations, Func<int, float[]> extractValueFunc, BabylonAnimation.DataType dataType, bool removeLinearAnimationKeys = true)
        {
            var babylonAnimation = ExportAnimation(property, extractValueFunc, dataType, removeLinearAnimationKeys);
            if (babylonAnimation != null)
            {
                animations.Add(babylonAnimation);
            }
        }

        private static BabylonAnimation ExportAnimation(string property, Func<int, float[]> extractValueFunc, BabylonAnimation.DataType dataType, bool removeLinearAnimationKeys = true)
        {
            var optimizeAnimations = !Loader.Core.RootNode.GetBoolProperty("babylonjs_donotoptimizeanimations"); // reverse negation for clarity

            var start = Loader.Core.AnimRange.Start;
            var end = Loader.Core.AnimRange.End;

            float[] previous = null;
            var keys = new List<BabylonAnimationKey>();
            for (var key = start; key <= end; key += Ticks)
            {
                var current = extractValueFunc(key);

                // if animations are not optimized, all keys from start to end are created
                // otherwise, keys are added only for non constant values
                if (optimizeAnimations && previous != null && previous.IsEqualTo(current))
                {
                    continue; // Do not add key
                }

                keys.Add(new BabylonAnimationKey()
                {
                    frame = key / Ticks,
                    values = current
                });

                previous = current;
            }

            // if animations are not optimized, do the following as minimal optimization
            if (removeLinearAnimationKeys && !optimizeAnimations)
            {
                RemoveLinearAnimationKeys(keys);
            }

            if (keys.Count > 1)
            {
                var animationPresent = true;

                if (keys.Count == 2)
                {
                    if (keys[0].values.IsEqualTo(keys[1].values))
                    {
                        animationPresent = false;
                    }
                }

                if (animationPresent)
                {
                    if (keys[keys.Count - 1].frame != end / Ticks)
                    {
                        keys.Add(new BabylonAnimationKey()
                        {
                            frame = end / Ticks,
                            values = keys[keys.Count - 1].values
                        });
                    }

                    var babylonAnimation = new BabylonAnimation
                    {
                        dataType = (int)dataType,
                        name = property + " animation",
                        keys = keys.ToArray(),
                        framePerSecond = Loader.Global.FrameRate,
                        loopBehavior = (int)BabylonAnimation.LoopBehavior.Cycle,
                        property = property
                    };
                    return babylonAnimation;
                }
            }
            return null;
        }
    }
}
