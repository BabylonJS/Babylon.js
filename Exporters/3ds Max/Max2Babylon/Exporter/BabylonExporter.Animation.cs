using System;
using System.Collections.Generic;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        const int Ticks = 160;

        private BabylonAnimationKey GenerateFloatFunc(int index, IIKeyControl keyControl)
        {
            var key = Loader.Global.ILinFloatKey.Create();
            keyControl.GetKey(index, key);

            return new BabylonAnimationKey
            {
                frame = key.Time / Ticks,
                values = new []{key.Val}
            };
        }

        private bool ExportFloatController(IControl control, string property, List<BabylonAnimation> animations)
        {
            return ExportController(control, property, animations, 0x2001, BabylonAnimation.DataType.Float, GenerateFloatFunc);
        }

        private bool ExportQuaternionController(IControl control, string property, List<BabylonAnimation> animations)
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

        private bool ExportVector3Controller(IControl control, string property, List<BabylonAnimation> animations)
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
                        frame = key.Time/Ticks,
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
                        frame = key.Time/Ticks,
                        values = key.Val.S.ToArraySwitched()
                    };
                });
        }

        private bool ExportController(IControl control, string property, List<BabylonAnimation> animations, uint classId, BabylonAnimation.DataType dataType, Func<int, IIKeyControl, BabylonAnimationKey> generateFunc)
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

            var keys = new List<BabylonAnimationKey>();
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

            for (var index = 0; index < keyControl.NumKeys; index++)
            {
                keys.Add(generateFunc(index, keyControl));
            }

            var babylonAnimation = new BabylonAnimation
            {
                dataType = dataType,
                name = property + " animation",
                keys = keys.ToArray(),
                framePerSecond = Loader.Global.FrameRate,
                loopBehavior = loopBehavior,
                property = property
            };

            animations.Add(babylonAnimation);

            return true;
        }

        private void ExportVector3Animation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Vector3);
        }

        private void ExportQuaternionAnimation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Quaternion);
        }

        private void ExportFloatAnimation(string property, List<BabylonAnimation> animations,
            Func<int, float[]> extractValueFunc)
        {
            ExportAnimation(property, animations, extractValueFunc, BabylonAnimation.DataType.Float);
        }

        private void ExportAnimation(string property, List<BabylonAnimation> animations, Func<int, float[]> extractValueFunc, BabylonAnimation.DataType dataType)
        {
            var start = Loader.Core.AnimRange.Start;
            var end = Loader.Core.AnimRange.End;

            float[] previous = null;
            var keys = new List<BabylonAnimationKey>();
            for (var key = start; key <= end; key += Ticks)
            {
                var current = extractValueFunc(key);

                if (key == start || key == end || !(previous.IsEqualTo(current)))
                {
                    keys.Add(new BabylonAnimationKey()
                    {
                        frame = key / Ticks,
                        values = current
                    });
                }

                previous = current;
            }

            if (keys.Count > 0)
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
                    var babylonAnimation = new BabylonAnimation
                    {
                        dataType = dataType,
                        name = property + " animation",
                        keys = keys.ToArray(),
                        framePerSecond = Loader.Global.FrameRate,
                        loopBehavior = BabylonAnimation.LoopBehavior.Relative,
                        property = property
                    };

                    animations.Add(babylonAnimation);
                }
            }
        }        
    }
}
