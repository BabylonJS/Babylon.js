using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Unity3D2Babylon
{
    public class ExporterOutput : EditorWindow
    {
        Vector2 scrollPosLog;

        public void OnInitialize()
        {
        }

        void OnEnable()
        {
            titleContent = new GUIContent("Output");
        }

        public void OnGUI()
        {
            if (GUILayout.Button("Clear Output Window"))
            {
                ExporterWindow.logs.Clear();
            }
            EditorGUILayout.Space();
            scrollPosLog = EditorGUILayout.BeginScrollView(scrollPosLog, GUILayout.ExpandWidth(false), GUILayout.ExpandHeight(true));
            foreach (var log in ExporterWindow.logs)
            {
                var bold = log.StartsWith("*");
                GUILayout.Label(bold ? log.Remove(0, 1) : log, bold ? (EditorStyles.boldLabel) : EditorStyles.label);
            }
            EditorGUILayout.EndScrollView();
        }

        public void OnInspectorUpdate()
        {
            this.Repaint();
        }
    }
}