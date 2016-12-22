using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using BabylonExport.Entities;
using UnityEditor;
using UnityEngine;

namespace Unity3D2Babylon
{
    partial class SceneBuilder
    {
        private BabylonMesh ConvertUnityEmptyObjectToBabylon(GameObject gameObject, ref UnityMetaData metaData, ref List<BabylonExport.Entities.BabylonParticleSystem> particleSystems, ref List<UnityFlareSystem> lensFlares, ref string componentTags, BabylonMesh collisionMesh = null, Collider collider = null)
        {
            BabylonMesh babylonMesh = new BabylonMesh { name = gameObject.name, id = GetID(gameObject) };
            metaData.type = "Game";
            if (!String.IsNullOrEmpty(componentTags))
            {
                babylonMesh.tags = componentTags;
            }

            var transform = gameObject.transform;

            babylonMesh.parentId = GetParentID(transform);

            babylonMesh.position = transform.localPosition.ToFloat();

            babylonMesh.rotation = new float[3];
            babylonMesh.rotation[0] = transform.localRotation.eulerAngles.x * (float)Math.PI / 180;
            babylonMesh.rotation[1] = transform.localRotation.eulerAngles.y * (float)Math.PI / 180;
            babylonMesh.rotation[2] = transform.localRotation.eulerAngles.z * (float)Math.PI / 180;

            babylonMesh.scaling = transform.localScale.ToFloat();

            babylonMesh.isVisible = false;
            babylonMesh.visibility = 0;
            babylonMesh.checkCollisions = false;

            // Collision mesh (No detail mesh fallback)
            string collisionMeshId = null;
            if (collider != null && collisionMesh != null)
            {
                collisionMeshId = collisionMesh.id;
                collisionMesh.parentId = babylonMesh.id;
                collisionMesh.visibility = collider.isTrigger ? 0.25f : 0.5f;
                collisionMesh.checkCollisions = (exportationOptions.ExportCollisions && collider.isTrigger == false);
            }
            metaData.properties["collisionMeshId"] = collisionMeshId;

            babylonMesh.metadata = metaData;
            babylonScene.MeshesList.Add(babylonMesh);

            // Animations
            ExportAnimations(transform, babylonMesh);
            if (IsRotationQuaternionAnimated(babylonMesh))
            {
                babylonMesh.rotationQuaternion = transform.localRotation.ToFloat();
            }

            // Lens Flares
            ParseLensFlares(gameObject, babylonMesh.id, ref lensFlares);

            // Particles Systems
            ParseParticleSystems(gameObject, babylonMesh.id, ref particleSystems);

            return babylonMesh;
        }

        private BabylonMesh ConvertUnityTerrainToBabylon(Terrain terrain, GameObject gameObject, float progress, ref UnityMetaData metaData, ref List<BabylonExport.Entities.BabylonParticleSystem> particleSystems, ref List<UnityFlareSystem> lensFlares, ref string componentTags)
        {
            ExporterWindow.ReportProgress(progress, "Exporting terrain: " + gameObject.name);
            var transform = gameObject.transform;
            float[] position = transform.localPosition.ToFloat();
            float[] rotation = new float[3];
            rotation[0] = transform.localRotation.eulerAngles.x * (float)Math.PI / 180;
            rotation[1] = transform.localRotation.eulerAngles.y * (float)Math.PI / 180;
            rotation[2] = transform.localRotation.eulerAngles.z * (float)Math.PI / 180;
            float[] scaling = transform.localScale.ToFloat();

            BabylonMesh babylonMesh = new BabylonMesh { name = gameObject.name, id = GetID(gameObject) };
            metaData.type = "Terrain";
            if (!String.IsNullOrEmpty(componentTags))
            {
                babylonMesh.tags = componentTags;
            }
            babylonMesh.tags += " [TERRAIN]";
            if (!String.IsNullOrEmpty(babylonMesh.tags))
            {
                babylonMesh.tags = babylonMesh.tags.Trim();
            }
            babylonMesh.parentId = GetParentID(transform);
            babylonMesh.position = Vector3.zero.ToFloat();
            babylonMesh.rotation = rotation;
            babylonMesh.scaling = scaling;
            babylonMesh.isVisible = true;
            babylonMesh.visibility = 1;
            babylonMesh.checkCollisions = false;
            metaData.properties["collisionMeshId"] = null;

            var generator = gameObject.GetComponent<BabylonTerrainGenerator>();
            if (generator != null && terrain != null)
            {
                // TODO: Terrain tree information
                object treeInstances = null;
                object treePrototypes = null;

                // Terrain metadata infomation
                Vector3 terrainSize = terrain.terrainData.size;
                metaData.properties.Add("width", terrainSize.x);
                metaData.properties.Add("length", terrainSize.z);
                metaData.properties.Add("height", terrainSize.y);
                metaData.properties.Add("position", position);
                metaData.properties.Add("rotation", rotation);
                metaData.properties.Add("scaling", scaling);
                metaData.properties.Add("thickness", terrain.terrainData.thickness);
                metaData.properties.Add("detailWidth", terrain.terrainData.detailWidth);
                metaData.properties.Add("detailHeight", terrain.terrainData.detailHeight);
                metaData.properties.Add("heightmapWidth", terrain.terrainData.heightmapWidth);
                metaData.properties.Add("heightmapHeight", terrain.terrainData.heightmapHeight);
                metaData.properties.Add("wavingGrassAmount", terrain.terrainData.wavingGrassAmount);
                metaData.properties.Add("wavingGrassSpeed", terrain.terrainData.wavingGrassSpeed);
                metaData.properties.Add("wavingGrassStrength", terrain.terrainData.wavingGrassStrength);
                metaData.properties.Add("wavingGrassTint", terrain.terrainData.wavingGrassTint.ToFloat());
                metaData.properties.Add("treeInstanceCount", terrain.terrainData.treeInstanceCount);
                metaData.properties.Add("treeInstances", treeInstances);
                metaData.properties.Add("treePrototypes", treePrototypes);
                metaData.properties.Add("physicsState", generator.physicsActive);
                metaData.properties.Add("physicsMass", generator.physicsMass);
                metaData.properties.Add("physicsFriction", generator.physicsFriction);
                metaData.properties.Add("physicsRestitution", generator.physicsRestitution);
                metaData.properties.Add("physicsImpostor", (int)generator.physicsImpostor);
                metaData.properties.Add("groundTessellation", generator.groundTessellation);

                // Generate detailed mesh
                ExporterWindow.ReportProgress(progress, "Generating terrain mesh: " + gameObject.name);
                BabylonTerrainData terrainMeshData = Unity3D2Babylon.Tools.CreateTerrainData(terrain.terrainData, (int)generator.terrainResolution, transform.localPosition, true);
                Tools.GenerateBabylonMeshTerrainData(terrainMeshData, babylonMesh, false, babylonScene, transform);
                if (generator.surfaceMaterial != null)
                {
                    babylonMesh.materialId = DumpMaterial(generator.surfaceMaterial, terrain.lightmapIndex, terrain.lightmapScaleOffset, generator.coordinatesIndex).id;
                }

                // Generate collision heightmap
                var terrainCollider = gameObject.GetComponent<TerrainCollider>();
                if (terrainCollider != null && terrainCollider.enabled)
                {
                    ExporterWindow.ReportProgress(progress, "Generating terrain heightmap: " + gameObject.name);
                    float minheight = float.MaxValue;
                    float maxheight = float.MinValue;
                    int hwidth = terrain.terrainData.heightmapWidth;
                    int hheight = terrain.terrainData.heightmapHeight;
                    float[,] rawHeights = terrain.terrainData.GetHeights(0, 0, hwidth, hheight);
                    Texture2D heightMap = new Texture2D(hwidth, hheight, TextureFormat.ARGB32, false);
                    for (int y = 0; y < hheight; y++)
                    {
                        for (int x = 0; x < hwidth; x++)
                        {
                            float inverted = rawHeights[y, x];
                            minheight = Mathf.Min(minheight, inverted);
                            maxheight = Mathf.Max(maxheight, inverted);
                        }
                    }
                    List<Color32> pixels = new List<Color32>();
                    for (int y = 0; y < hheight; y++)
                    {
                        for (int x = 0; x < hwidth; x++)
                        {
                            float inverted = rawHeights[y, x];
                            if (generator.heightmapStrength > 0)
                            {
                                float threadhold = minheight + generator.floorThreashold;
                                if (inverted > threadhold)
                                {
                                    inverted += (generator.heightmapStrength / 10.0f);
                                }
                            }
                            byte[] packed = BitConverter.GetBytes(inverted);
                            if (packed != null && packed.Length >= 4)
                            {
                                pixels.Add(new Color32(packed[0], packed[1], packed[2], packed[3]));
                            }
                        }
                    }
                    heightMap.SetPixels32(pixels.ToArray());
                    heightMap.Apply();
                    byte[] heightmapBytes = heightMap.EncodeToPNG();
                    metaData.properties.Add("heightmapBase64", ("data:image/png;base64," + Convert.ToBase64String(heightmapBytes)));
                }
            }
            else
            {
                UnityEngine.Debug.LogWarning("No valid terrain or generator found for: " + gameObject.name);
            }

            babylonMesh.metadata = metaData;
            babylonScene.MeshesList.Add(babylonMesh);
            SceneBuilder.Metadata.properties["hasTerrainMeshes"] = true;

            // Animations
            ExportAnimations(transform, babylonMesh);
            if (IsRotationQuaternionAnimated(babylonMesh))
            {
                babylonMesh.rotationQuaternion = transform.localRotation.ToFloat();
            }

            // Lens Flares
            ParseLensFlares(gameObject, babylonMesh.id, ref lensFlares);

            // Particles Systems
            ParseParticleSystems(gameObject, babylonMesh.id, ref particleSystems);

            return babylonMesh;
        }

        private BabylonMesh ConvertUnityMeshToBabylon(Mesh mesh, Transform transform, GameObject gameObject, float progress, ref UnityMetaData metaData, ref List<BabylonExport.Entities.BabylonParticleSystem> particleSystems, ref List<UnityFlareSystem> lensFlares, ref string componentTags, BabylonMesh collisionMesh = null, Collider collider = null)
        {
            BabylonMesh babylonMesh = new BabylonMesh();
            metaData.type = "Mesh";
            if (!String.IsNullOrEmpty(componentTags))
            {
                babylonMesh.tags = componentTags;
            }

            ExporterWindow.ReportProgress(progress, "Exporting mesh: " + gameObject.name);

            babylonMesh.name = gameObject.name;
            babylonMesh.id = GetID(transform.gameObject);

            var renderer = gameObject.GetComponent<Renderer>();
            if (renderer != null)
            {
                babylonMesh.receiveShadows = renderer.receiveShadows;
            }

            babylonMesh.parentId = GetParentID(transform);

            babylonMesh.position = transform.localPosition.ToFloat();

            babylonMesh.rotation = new float[3];
            babylonMesh.rotation[0] = transform.localRotation.eulerAngles.x * (float)Math.PI / 180;
            babylonMesh.rotation[1] = transform.localRotation.eulerAngles.y * (float)Math.PI / 180;
            babylonMesh.rotation[2] = transform.localRotation.eulerAngles.z * (float)Math.PI / 180;

            babylonMesh.scaling = transform.localScale.ToFloat();
            babylonMesh.checkCollisions = false;

            // Collision mesh (With detail mesh fallback)
            string collisionMeshId = null;
            if (collider != null)
            {
                if (collisionMesh != null)
                {
                    collisionMeshId = collisionMesh.id;
                    collisionMesh.parentId = babylonMesh.id;
                    collisionMesh.visibility = collider.isTrigger ? 0.25f : 0.5f;
                    collisionMesh.checkCollisions = (exportationOptions.ExportCollisions && collider.isTrigger == false);
                }
                else
                {
                    babylonMesh.checkCollisions = exportationOptions.ExportCollisions;
                }
            }
            metaData.properties["collisionMeshId"] = collisionMeshId;

            if (mesh != null)
            {
                Tools.GenerateBabylonMeshData(mesh, babylonMesh, babylonScene, transform);
                int index = 0;
                if (mesh.boneWeights.Length == mesh.vertexCount)
                {
                    babylonMesh.matricesIndices = new int[mesh.vertexCount];
                    babylonMesh.matricesWeights = new float[mesh.vertexCount * 4];
                    index = 0;
                    foreach (BoneWeight bw in mesh.boneWeights)
                    {
                        babylonMesh.matricesIndices[index] = (bw.boneIndex3 << 24) | (bw.boneIndex2 << 16) | (bw.boneIndex1 << 8) | bw.boneIndex0;
                        babylonMesh.matricesWeights[index * 4 + 0] = bw.weight0;
                        babylonMesh.matricesWeights[index * 4 + 1] = bw.weight1;
                        babylonMesh.matricesWeights[index * 4 + 2] = bw.weight2;
                        babylonMesh.matricesWeights[index * 4 + 3] = bw.weight3;
                        var totalWeight = bw.weight0 + bw.weight1 + bw.weight2 + bw.weight3;
                        if (Mathf.Abs(totalWeight - 1.0f) > 0.01f)
                        {
                            throw new Exception("Total bone weights is not normalized for: " + mesh);
                        }
                        index++;
                    }
                }
                index = 0;
                if (renderer != null && renderer.sharedMaterial != null)
                {
                    // Validate Multi Materials
                    if (mesh.subMeshCount > 1)
                    {
                        BabylonMultiMaterial bMultiMat;

                        string multiMatName = "";
                        for (int i = 0; i < renderer.sharedMaterials.Length; i++)
                        {
                            multiMatName += renderer.sharedMaterials[i].name;
                        }
                    

                        if (!multiMatDictionary.ContainsKey(multiMatName))
                        {
                            bMultiMat = new BabylonMultiMaterial
                            {
                                materials = new string[mesh.subMeshCount],
                                id = Guid.NewGuid().ToString(),
                                name = multiMatName
                            };

                            for (int i = 0; i < renderer.sharedMaterials.Length; i++)
                            {
                                var sharedMaterial = renderer.sharedMaterials[i];
                                BabylonMaterial babylonMaterial;

                                babylonMaterial = DumpMaterial(sharedMaterial, renderer.lightmapIndex, renderer.lightmapScaleOffset);

                                bMultiMat.materials[i] = babylonMaterial.id;
                            }
                            if (mesh.subMeshCount > 1)
                            {
                                multiMatDictionary.Add(bMultiMat.name, bMultiMat);
                            }
                        }
                        else
                        {
                            bMultiMat = multiMatDictionary[multiMatName];
                        }

                        babylonMesh.materialId = bMultiMat.id;
                        babylonMesh.subMeshes = new BabylonSubMesh[mesh.subMeshCount];

                        var offset = 0;
                        for (int materialIndex = 0; materialIndex < mesh.subMeshCount; materialIndex++)
                        {
                            var unityTriangles = mesh.GetTriangles(materialIndex);
                            babylonMesh.subMeshes[materialIndex] = new BabylonSubMesh
                            {
                                verticesStart = 0,
                                verticesCount = mesh.vertexCount,
                                materialIndex = materialIndex,
                                indexStart = offset,
                                indexCount = unityTriangles.Length
                            };
                            offset += unityTriangles.Length;
                        }
                    }
                    else
                    {
                        babylonMesh.materialId = DumpMaterial(renderer.sharedMaterial, renderer.lightmapIndex, renderer.lightmapScaleOffset).id;
                    }
                }

                babylonMesh.metadata = metaData;
                babylonScene.MeshesList.Add(babylonMesh);

                // Animations
                ExportAnimations(transform, babylonMesh);
                if (IsRotationQuaternionAnimated(babylonMesh))
                {
                    babylonMesh.rotationQuaternion = transform.localRotation.ToFloat();
                }

                // Lens Flares
                ParseLensFlares(gameObject, babylonMesh.id, ref lensFlares);

                // Particles Systems
                ParseParticleSystems(gameObject, babylonMesh.id, ref particleSystems);

                // Babylon Physics
                if (exportationOptions.ExportPhysics)
                {
                    var physics = gameObject.GetComponent<BabylonPhysicsState>();
                    if (physics != null)
                    {
                        babylonMesh.physicsMass = physics.mass;
                        babylonMesh.physicsFriction = physics.friction;
                        babylonMesh.physicsRestitution = physics.restitution;
                        babylonMesh.physicsImpostor = (int)physics.imposter;
                    }
                }
            }
            return babylonMesh;
        }

        private BabylonSkeleton ConvertUnitySkeletonToBabylon(Transform[] bones, Matrix4x4[] bindPoses, Transform transform, GameObject gameObject, float progress)
        {
            ExporterWindow.ReportProgress(progress, "Exporting skeleton: " + gameObject.name);
            BabylonSkeleton babylonSkeleton = new BabylonSkeleton();
            babylonSkeleton.name = gameObject.name;
            babylonSkeleton.id = Math.Abs(GetID(transform.gameObject).GetHashCode());
            babylonSkeleton.needInitialSkinMatrix = false;

            // Prefilled to keep order and track parents.
            int index = 0;
            var transformToBoneMap = new Dictionary<Transform, BabylonBone>();
            foreach (Transform unityBone in bones)
            {
                var babylonBone = new BabylonBone();
                babylonBone.name = unityBone.name;
                babylonBone.index = index;

                transformToBoneMap.Add(unityBone, babylonBone);
                index++;
            }

            // Attaches Matrix and parent.
            index = 0;
            foreach (Transform unityBone in bones)
            {
                var babylonBone = transformToBoneMap[unityBone];
                Matrix4x4 localTransform;

                // Unity BindPose is already inverse so take the inverse again :-)
                if (transformToBoneMap.ContainsKey(unityBone.parent))
                {
                    var babylonParentBone = transformToBoneMap[unityBone.parent];
                    babylonBone.parentBoneIndex = babylonParentBone.index;
                    localTransform = bindPoses[babylonBone.parentBoneIndex] * bindPoses[index].inverse;
                }
                else
                {
                    babylonBone.parentBoneIndex = -1;
                    localTransform = bindPoses[index].inverse;
                }

                transformToBoneMap[unityBone].matrix = new[] {
                    localTransform[0, 0], localTransform[1, 0], localTransform[2, 0], localTransform[3, 0],
                    localTransform[0, 1], localTransform[1, 1], localTransform[2, 1], localTransform[3, 1],
                    localTransform[0, 2], localTransform[1, 2], localTransform[2, 2], localTransform[3, 2],
                    localTransform[0, 3], localTransform[1, 3], localTransform[2, 3], localTransform[3, 3]
                };
                index++;
            }

            // Reorder and attach the skeleton.
            babylonSkeleton.bones = transformToBoneMap.Values.OrderBy(b => b.index).ToArray();
            babylonScene.SkeletonsList.Add(babylonSkeleton);
            return babylonSkeleton;
        }
    }
}
