using System;
using System.Windows.Forms;

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
            Tools.UpdateVector3Control(gravityControl, Loader.Core.RootNode, "babylonjs_gravity");
            Tools.UpdateCheckBox(chkQuaternions, Loader.Core.RootNode, "babylonjs_exportquaternions");
        }

        private void ScenePropertiesForm_Load(object sender, EventArgs e)
        {
            Tools.PrepareVector3Control(gravityControl, Loader.Core.RootNode, "babylonjs_gravity", 0, -0.9f, 0);
            Tools.PrepareCheckBox(chkQuaternions, Loader.Core.RootNode, "babylonjs_exportquaternions", 1);
        }
    }
}
