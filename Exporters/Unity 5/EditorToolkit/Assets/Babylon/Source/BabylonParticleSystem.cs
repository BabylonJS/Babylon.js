using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Particle System", 4)]
    public sealed class BabylonParticleSystem : MonoBehaviour
    {
        public bool exportParticle = true;
        public string particleName = String.Empty;
        public Texture2D texture = null;
        public Color textureMask = Color.white;
        public bool autoStart = true;
        public float updateSpeed = 0.01f;
        public float emitRate = 10;
        public Vector3 gravity = new Vector3(0, -9.8f, 0);
        public BabylonParticleBlend blendMode = BabylonParticleBlend.OneOne;
        public int capacity = 100;
        public Color color1 = Color.white;
        public Color color2 = Color.white;
        public Color colorDead = Color.black;
        public Vector3 direction1 = new Vector3(0, 1.0f, 0);
        public Vector3 direction2 = new Vector3(0, 1.0f, 0);
        public Vector3 minEmitBox = new Vector3(-0.5f, -0.5f, -0.5f);
        public Vector3 maxEmitBox = new Vector3(0.5f, 0.5f, 0.5f);
        public float minEmitPower = 1;
        public float maxEmitPower = 1;
        public float minLifeTime = 1;
        public float maxLifeTime = 1;
        public float minSize = 1;
        public float maxSize = 1;
        public float minAngularSpeed = 0;
        public float maxAngularSpeed = 0;
        public int targetStopFrame = 0;
        public float deadAlpha = 0;
    }
}
