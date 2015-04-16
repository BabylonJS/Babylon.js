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

                if (node.ObjectRef != null && node.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Camera)
                {
                    cameras.Add(node);
                }
            }

            Tools.PrepareCheckBox(chkNoExport, cameras, "babylonjs_noexport");
            Tools.PrepareCheckBox(chkCollisions, cameras, "babylonjs_checkcollisions");
            Tools.PrepareCheckBox(chkGravity, cameras, "babylonjs_applygravity");

            Tools.PrepareNumericUpDown(nupSpeed, cameras, "babylonjs_speed", 1.0f);
            Tools.PrepareNumericUpDown(nupInertia, cameras, "babylonjs_inertia", 0.9f);

            Tools.PrepareVector3Control(ellipsoidControl, cameras[0], "babylonjs_ellipsoid", 0.5f, 1.0f, 0.5f);

            Tools.PrepareComboBox(cbCameraType, cameras[0], "babylonjs_type", "FreeCamera");

            Tools.PrepareCheckBox(chkAutoAnimate, cameras, "babylonjs_autoanimate");
            Tools.PrepareCheckBox(chkLoop, cameras, "babylonjs_autoanimateloop");
            Tools.PrepareNumericUpDown(nupFrom, cameras, "babylonjs_autoanimate_from");
            Tools.PrepareNumericUpDown(nupTo, cameras, "babylonjs_autoanimate_to", 100.0f);
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            Tools.UpdateCheckBox(chkNoExport, cameras, "babylonjs_noexport");
            Tools.UpdateCheckBox(chkCollisions, cameras, "babylonjs_checkcollisions");
            Tools.UpdateCheckBox(chkGravity, cameras, "babylonjs_applygravity");

            Tools.UpdateNumericUpDown(nupSpeed, cameras, "babylonjs_speed");
            Tools.UpdateNumericUpDown(nupInertia, cameras, "babylonjs_inertia");

            Tools.UpdateVector3Control(ellipsoidControl, cameras, "babylonjs_ellipsoid");

            Tools.UpdateComboBox(cbCameraType, cameras, "babylonjs_type");

            Tools.UpdateCheckBox(chkAutoAnimate, cameras, "babylonjs_autoanimate");
            Tools.UpdateCheckBox(chkLoop, cameras, "babylonjs_autoanimateloop");
            Tools.UpdateNumericUpDown(nupFrom, cameras, "babylonjs_autoanimate_from");
            Tools.UpdateNumericUpDown(nupTo, cameras, "babylonjs_autoanimate_to");
        }

        private void chkAutoAnimate_CheckedChanged(object sender, EventArgs e)
        {
            grpAutoAnimate.Enabled = chkAutoAnimate.Checked;
        }

    }
}
