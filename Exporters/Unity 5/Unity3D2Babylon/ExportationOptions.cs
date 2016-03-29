using System;
using UnityEngine;

namespace Unity3D2Babylon
{
    public class ExportationOptions
    {
        public string DefaultFolder { get; set; }
        public float ReflectionDefaultLevel { get; set; }
        public bool ExportCollisions { get; set; }
        public bool ExportPhysics { get; set; }
        public SerializableVector3 CameraEllipsoid { get; set; }
        public SerializableVector3 Gravity { get; set; }

        public ExportationOptions()
        {
            DefaultFolder = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            ReflectionDefaultLevel = 0.3f;
            ExportCollisions = false;
            ExportPhysics = false;
            CameraEllipsoid = new Vector3(0.5f, 1.0f, 0.5f);
            Gravity = new Vector3(0, -0.9f, 0);
        }
    }
}
