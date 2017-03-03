using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Unity3D2Babylon
{
    public class BabylonTextureImporter
    {
        public TextureImporter textureImporter { get; private set; }
        private bool previousIsReadable;
        private string texturePath;

        public BabylonTextureImporter(string path)
        {
            try
            {
                texturePath = path;
                textureImporter = AssetImporter.GetAtPath(texturePath) as TextureImporter;
                previousIsReadable = textureImporter.isReadable;
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
        }

        public bool IsReadable()
        {
            return previousIsReadable;
        }

        public bool SetReadable()
        {
            bool result = false;
            try
            {
                textureImporter.isReadable = true;
                AssetDatabase.ImportAsset(texturePath);
                result = true;
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
            return result;
        }

        public void Resotre()
        {
            try
            {
                textureImporter.isReadable = previousIsReadable;
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
            finally
            {
                ForceUpdate();
            }
        }

        public void ForceUpdate()
        {
            try
            {
                AssetDatabase.ImportAsset(texturePath, ImportAssetOptions.ForceUpdate);
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogException(ex);
            }
        }
    }
}