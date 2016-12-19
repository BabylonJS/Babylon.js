using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Flare System", 3)]
    public sealed class BabylonFlareSystem : MonoBehaviour
    {
        public bool exportFlare = true;
        public string flareName = String.Empty;
        public int borderLimit = 300;
        public UnityLensFlareItem[] lensFlares = null;
    }
}