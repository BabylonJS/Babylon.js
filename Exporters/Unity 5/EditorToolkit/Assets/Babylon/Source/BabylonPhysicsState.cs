using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Physics State", 1)]
    public sealed class BabylonPhysicsState : MonoBehaviour
    {
        public float mass = 0.0f;
        public float friction = 0.1f;
        public float restitution = 0.25f;
        public BabylonPhysicsImposter imposter = BabylonPhysicsImposter.None;
    }
}