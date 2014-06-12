using System;
using System.Collections.Generic;
using BabylonExport.Entities;
using MaxSharp;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
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
            const int ticks = 160;
            var start = Loader.Core.AnimRange.Start;
            var end = Loader.Core.AnimRange.End;

            float[] previous = null;
            var keys = new List<BabylonAnimationKey>();
            for (var key = start; key <= end; key += ticks)
            {
                var current = extractValueFunc(key);

                if (key == start || key == end || !(previous.IsEqualTo(current)))
                {
                    keys.Add(new BabylonAnimationKey()
                    {
                        frame = key / ticks,
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
