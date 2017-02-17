using System;
using UnityEngine;

namespace UnityEditor
{
    [AddComponentMenu("BabylonJS/Terrain Generator", 99)]
    public sealed class BabylonTerrainGenerator : MonoBehaviour
    {
        public Material surfaceMaterial = null;

        public BabylonTerrainResolution terrainResolution = BabylonTerrainResolution.HighResolution;

        [Header("Heightmap Tools")]

        [Range(0.0f, 0.1f)]
        public float floorThreashold = 0.001f;

        [Range(0.0f, 1.0f)]
        public float heightmapStrength = 0.01f;

        [Range(10, 100)]
        public int groundTessellation = 50;

        [Header("Lightmap Details")]

        [Range(0, 1)]
        public int coordinatesIndex = 0;

        [Header("Ground Physics State")]

        public bool physicsActive = false;

        public float physicsMass = 0.0f;

        public float physicsFriction = 0.2f;

        public float physicsRestitution = 0.2f;

        public BabylonPhysicsImposter physicsImpostor = BabylonPhysicsImposter.Box;
    }
}
