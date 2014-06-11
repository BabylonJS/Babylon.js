using System;
using System.Collections.Generic;
using System.Windows.Forms;
using Autodesk.Max;

namespace Max2Babylon
{
    public partial class ObjectPropertiesForm : Form
    {
        private readonly List<IINode> objects = new List<IINode>();

        public ObjectPropertiesForm()
        {
            InitializeComponent();
        }

        private void butOK_Click(object sender, EventArgs e)
        {
            Tools.UpdateCheckBox(chkCollisions, objects, "babylonjs_checkcollisions");
            Tools.UpdateCheckBox(chkPickable, objects, "babylonjs_checkpickable");            
        }

        private void ObjectPropertiesForm_Load(object sender, EventArgs e)
        {
            for (var index = 0; index < Loader.Core.SelNodeCount; index++)
            {
                var node = Loader.Core.GetSelNode(index);

                if (node.ObjectRef != null && node.ObjectRef.SuperClassID == SClass_ID.Geomobject)
                {
                    objects.Add(node);
                }
            }

            Tools.PrepareCheckBox(chkCollisions, objects, "babylonjs_checkcollisions");
            Tools.PrepareCheckBox(chkPickable, objects, "babylonjs_checkpickable");
        }
    }
}
