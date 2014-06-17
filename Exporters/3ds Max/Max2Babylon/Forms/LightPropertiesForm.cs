using System;
using System.Collections.Generic;
using System.Windows.Forms;
using Autodesk.Max;

namespace Max2Babylon
{
    public partial class LightPropertiesForm : Form
    {
        private readonly List<IINode> lights = new List<IINode>();

        public LightPropertiesForm()
        {
            InitializeComponent();
        }

        private void LightPropertiesForm_Load(object sender, EventArgs e)
        {
            for (var index = 0; index < Loader.Core.SelNodeCount; index++)
            {
                var node = Loader.Core.GetSelNode(index);

                if (node.ObjectRef != null && node.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Light)
                {
                    lights.Add(node);
                }
            }

            Tools.PrepareCheckBox(chkNoExport, lights, "babylonjs_noexport");
            Tools.PrepareCheckBox(chkAutoAnimate, lights, "babylonjs_autoanimate");
            Tools.PrepareCheckBox(chkLoop, lights, "babylonjs_autoanimateloop");
            Tools.PrepareNumericUpDown(nupFrom, lights, "babylonjs_autoanimate_from");
            Tools.PrepareNumericUpDown(nupTo, lights, "babylonjs_autoanimate_to", 100.0f);
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            Tools.UpdateCheckBox(chkNoExport, lights, "babylonjs_noexport");
            Tools.UpdateCheckBox(chkAutoAnimate, lights, "babylonjs_autoanimate");
            Tools.UpdateCheckBox(chkLoop, lights, "babylonjs_autoanimateloop");
            Tools.UpdateNumericUpDown(nupFrom, lights, "babylonjs_autoanimate_from");
            Tools.UpdateNumericUpDown(nupTo, lights, "babylonjs_autoanimate_to");
        }

        private void chkAutoAnimate_CheckedChanged(object sender, EventArgs e)
        {
            grpAutoAnimate.Enabled = chkAutoAnimate.Checked;
        }
    }
}
