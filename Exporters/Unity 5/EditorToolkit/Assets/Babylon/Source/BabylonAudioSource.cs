using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Audio Source", 2)]
    public class BabylonAudioSource : MonoBehaviour
    {
        public bool exportAudio = true;
        public AudioClip sound;
        public BabylonSoundOptions options;
    }
}