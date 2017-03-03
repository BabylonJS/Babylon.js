using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Shadow Bake", 0)]
    public sealed class BabylonShadowBake : MonoBehaviour
    {
        public BabylonShadowOptions shadowOption = BabylonShadowOptions.Baked;
    }
}