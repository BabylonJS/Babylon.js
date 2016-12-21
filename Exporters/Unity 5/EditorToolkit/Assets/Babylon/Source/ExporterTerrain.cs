using UnityEngine;
using UnityEditor;
using System;
using System.Collections;
using System.IO;
using System.Text;
using BabylonExport.Entities;

class ExporterTerrain : EditorWindow
{
    BabylonTerrainFormat saveFormat = BabylonTerrainFormat.Triangles;

    BabylonTerrainResolution saveResolution = BabylonTerrainResolution.HighResolution;

    static TerrainData terrain;

    static Terrain terrainObject;

    int tCount;
    int counter;
    int totalCount;
    bool flipNormals = true;
    int progressUpdateInterval = 10000;

    [MenuItem("BabylonJS/Terrain Exporter", false, 100)]
    static void InitTerrain()
    {
        ExporterTerrain terrains = ScriptableObject.CreateInstance<ExporterTerrain>();
        terrains.OnInitialize();
        terrains.ShowUtility();
    }

    public void OnInitialize()
    {
        maxSize = new Vector2(512, 85);
        minSize = this.maxSize;
        terrain = null;

        terrainObject = Selection.activeObject as Terrain;
        if (!terrainObject)
        {
            terrainObject = Terrain.activeTerrain;
        }
        if (terrainObject)
        {
            terrain = terrainObject.terrainData;
        }
    }

    void OnGUI()
    {
        if (!terrain)
        {
            GUILayout.Label("No terrain found");
            if (GUILayout.Button("Cancel"))
            {
                this.Close();
            }
            return;
        }
        saveFormat = (BabylonTerrainFormat)EditorGUILayout.EnumPopup("Export Format", saveFormat);
        saveResolution = (BabylonTerrainResolution)EditorGUILayout.EnumPopup("Mesh Resolution", saveResolution);
        flipNormals = EditorGUILayout.Toggle("Reverse Normals", flipNormals);
        if (GUILayout.Button("Export"))
        {
            Export();
        }
    }

    void Export()
    {
        int index = 0;
        string fileName = EditorUtility.SaveFilePanel("Export Terrain File", "", "Terrain", "obj");
        BabylonMesh babylonMesh = new BabylonMesh();
        BabylonTerrainData terrainData = Unity3D2Babylon.Tools.CreateTerrainData(terrain, (int)saveResolution, terrainObject.transform.localPosition, false);
        Unity3D2Babylon.Tools.GenerateBabylonMeshTerrainData(terrainData, babylonMesh, flipNormals);

        System.Threading.Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo("en-US");
        StreamWriter sw = new StreamWriter(fileName);
        try
        {
            // StringBuilder stuff is done this way because it's faster than using the "{0} {1} {2}"etc. format
            // Which is important when you're exporting huge terrains.
            sw.WriteLine("# U3D - BabylonJS - Terrain Mesh File");

            // Write vertices
            counter = tCount = 0;
            totalCount = ((babylonMesh.positions.Length / 3) * 2 + (babylonMesh.indices.Length / 3)) / progressUpdateInterval;
            for (index = 0; index < babylonMesh.positions.Length / 3; index++)
            {
                UpdateProgress();
                StringBuilder sb = new StringBuilder("v ", 32);
                sb.Append(babylonMesh.positions[index * 3].ToString()).Append(" ").
                Append(babylonMesh.positions[index * 3 + 1].ToString()).Append(" ").
                Append(babylonMesh.positions[index * 3 + 2].ToString());
                sw.WriteLine(sb);
            }

            // Write normals
            for (index = 0; index < babylonMesh.normals.Length / 3; index++)
            {
                UpdateProgress();
                StringBuilder sb = new StringBuilder("vn ", 32);
                sb.Append(babylonMesh.normals[index * 3].ToString()).Append(" ").
                Append(babylonMesh.normals[index * 3 + 1].ToString()).Append(" ").
                Append(babylonMesh.normals[index * 3 + 2].ToString());
                sw.WriteLine(sb);
            }

            // Write uvs
            for (index = 0; index < babylonMesh.uvs.Length / 2; index++)
            {
                UpdateProgress();
                StringBuilder sb = new StringBuilder("vt ", 32);
                sb.Append(babylonMesh.uvs[index * 2].ToString()).Append(" ").
                Append(babylonMesh.uvs[index * 2 + 1].ToString());
                sw.WriteLine(sb);
            }

            // Write triangles
            for (int i = 0; i < babylonMesh.indices.Length; i += 3)
            {
                UpdateProgress();
                StringBuilder sb = new StringBuilder("f ", 64);
                sb.Append(babylonMesh.indices[i] + 1).Append("/").Append(babylonMesh.indices[i] + 1).Append(" ").
                Append(babylonMesh.indices[i + 1] + 1).Append("/").Append(babylonMesh.indices[i + 1] + 1).Append(" ").
                Append(babylonMesh.indices[i + 2] + 1).Append("/").Append(babylonMesh.indices[i + 2] + 1);
                sw.WriteLine(sb);
            }
        }
        catch (Exception err)
        {
            Debug.Log("Error saving file: " + err.Message);
        }
        sw.Close();

        terrain = null;
        EditorUtility.DisplayProgressBar("Babylon.js", "Saving terrain mesh data... This may take a while.", 1f);
        AssetDatabase.Refresh();
        EditorUtility.ClearProgressBar();
        this.Close();
    }

    void UpdateProgress()
    {
        if (counter++ == progressUpdateInterval)
        {
            counter = 0;
            EditorUtility.DisplayProgressBar("Generating terrain mesh...", "", Mathf.InverseLerp(0, totalCount, ++tCount));
        }
    }
}