using System;
using System.Windows.Forms;
using MaxSharp;

namespace Max2Babylon
{
    public partial class ScenePropertiesForm : Form
    {
        public ScenePropertiesForm()
        {
            InitializeComponent();
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            Tools.UpdateVector3Control(gravityControl, Kernel.Scene.RootNode._Node, "babylonjs_gravity");
            Tools.UpdateCheckBox(chkQuaternions, Kernel.Scene.RootNode._Node, "babylonjs_exportquaternions");
        }

        private void ScenePropertiesForm_Load(object sender, EventArgs e)
        {
            Tools.PrepareVector3Control(gravityControl, Kernel.Scene.RootNode._Node, "babylonjs_gravity", 0, -0.9f, 0);
            Tools.PrepareCheckBox(chkQuaternions, Kernel.Scene.RootNode._Node, "babylonjs_exportquaternions");
        }
    }
}
