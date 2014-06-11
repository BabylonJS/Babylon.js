using System;
using System.Collections.Generic;
using System.Windows.Forms;
using Autodesk.Max;

namespace Max2Babylon
{
    public partial class CameraPropertiesForm : Form
    {
        private readonly List<IINode> cameras = new List<IINode>();

        public CameraPropertiesForm()
        {
            InitializeComponent();
        }

        private void CameraPropertiesForm_Load(object sender, EventArgs e)
        {
            for (var index = 0; index < Loader.Core.SelNodeCount; index++)
            {
                var node = Loader.Core.GetSelNode(index);

                if (node.ObjectRef != null && node.ObjectRef.SuperClassID == SClass_ID.Camera)
                {
                    cameras.Add(node);
                }
            }

            Tools.PrepareCheckBox(chkCollisions, cameras, "babylonjs_checkcollisions");
            Tools.PrepareCheckBox(chkGravity, cameras, "babylonjs_applygravity");

            Tools.PrepareNumericUpDown(nupSpeed, cameras, "babylonjs_speed", 1.0f);
            Tools.PrepareNumericUpDown(nupInertia, cameras, "babylonjs_inertia", 0.9f);

            Tools.PrepareVector3Control(ellipsoidControl, cameras[0], "babylonjs_ellipsoid", 0.5f, 1.0f, 0.5f);
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            Tools.UpdateCheckBox(chkCollisions, cameras, "babylonjs_checkcollisions");
            Tools.UpdateCheckBox(chkGravity, cameras, "babylonjs_applygravity");

            Tools.UpdateNumericUpDown(nupSpeed, cameras, "babylonjs_speed");
            Tools.UpdateNumericUpDown(nupInertia, cameras, "babylonjs_inertia");

            Tools.UpdateVector3Control(ellipsoidControl, cameras, "babylonjs_ellipsoid");
        }
    }
}
