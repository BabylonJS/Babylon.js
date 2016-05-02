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
            Tools.UpdateCheckBox(chkNoExport, objects, "babylonjs_noexport");
            Tools.UpdateCheckBox(chkCollisions, objects, "babylonjs_checkcollisions");
            Tools.UpdateCheckBox(chkPickable, objects, "babylonjs_checkpickable");
            Tools.UpdateCheckBox(chkOptimize, objects, "babylonjs_optimizevertices");
            Tools.UpdateCheckBox(chkShowBoundingBox, objects, "babylonjs_showboundingbox");
            Tools.UpdateCheckBox(chkShowSubMeshesBoundingBox, objects, "babylonjs_showsubmeshesboundingbox");

            Tools.UpdateCheckBox(chkAutoAnimate, objects, "babylonjs_autoanimate");
            Tools.UpdateCheckBox(chkLoop, objects, "babylonjs_autoanimateloop");
            Tools.UpdateNumericUpDown(nupFrom, objects, "babylonjs_autoanimate_from");
            Tools.UpdateNumericUpDown(nupTo, objects, "babylonjs_autoanimate_to");

            Tools.UpdateNumericUpDown(nupAlphaIndex, objects, "babylonjs_alphaindex");
            Tools.UpdateNumericUpDown(nupMass, objects, "babylonjs_mass");
            Tools.UpdateNumericUpDown(nupFriction, objects, "babylonjs_friction");
            Tools.UpdateNumericUpDown(nupRestitution, objects, "babylonjs_restitution");
            Tools.UpdateComboBox(cbImpostor, objects, "babylonjs_impostor");

            Tools.UpdateCheckBox(chkAutoPlay, objects, "babylonjs_sound_autoplay");
            Tools.UpdateCheckBox(chkLoop, objects, "babylonjs_sound_loop");
            Tools.UpdateNumericUpDown(nupVolume, objects, "babylonjs_sound_volume");
            Tools.UpdateNumericUpDown(nupPlaybackRate, objects, "babylonjs_sound_playbackrate");

            Tools.UpdateComboBox(cbDistanceModel, objects, "babylonjs_sound_distancemodel");
            Tools.UpdateNumericUpDown(nupMaxDistance, objects, "babylonjs_sound_maxdistance");
            Tools.UpdateNumericUpDown(nupRolloff, objects, "babylonjs_sound_rolloff");
            Tools.UpdateNumericUpDown(nupRefDistance, objects, "babylonjs_sound_refdistance");

            Tools.UpdateCheckBox(chkDirectional, objects, "babylonjs_sound_directional");
            Tools.UpdateNumericUpDown(nupConeInnerAngle, objects, "babylonjs_sound_coneinnerangle");
            Tools.UpdateNumericUpDown(nupConeOuterAngle, objects, "babylonjs_sound_coneouterangle");
            Tools.UpdateNumericUpDown(nupConeOuterGain, objects, "babylonjs_sound_coneoutergain");

            Tools.UpdateTextBox(txtSound, objects, "babylonjs_sound_filename");
        }

        private void ObjectPropertiesForm_Load(object sender, EventArgs e)
        {
            for (var index = 0; index < Loader.Core.SelNodeCount; index++)
            {
                var node = Loader.Core.GetSelNode(index);

                if (node.ObjectRef != null && 
                    (
                    node.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Geomobject
                    ||
                    node.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Helper
                    ))
                {
                    objects.Add(node);
                }
            }

            Tools.PrepareCheckBox(chkNoExport, objects, "babylonjs_noexport");
            Tools.PrepareCheckBox(chkCollisions, objects, "babylonjs_checkcollisions");
            Tools.PrepareCheckBox(chkPickable, objects, "babylonjs_checkpickable");
            Tools.PrepareCheckBox(chkOptimize, objects, "babylonjs_optimizevertices");
            Tools.PrepareCheckBox(chkShowBoundingBox, objects, "babylonjs_showboundingbox");
            Tools.PrepareCheckBox(chkShowSubMeshesBoundingBox, objects, "babylonjs_showsubmeshesboundingbox");

            Tools.PrepareCheckBox(chkAutoAnimate, objects, "babylonjs_autoanimate", 1);
            Tools.PrepareCheckBox(chkLoop, objects, "babylonjs_autoanimateloop", 1);
            Tools.PrepareNumericUpDown(nupFrom, objects, "babylonjs_autoanimate_from");
            Tools.PrepareNumericUpDown(nupTo, objects, "babylonjs_autoanimate_to", 100.0f);
            Tools.PrepareNumericUpDown(nupAlphaIndex, objects, "babylonjs_alphaindex", 1000);

            Tools.PrepareNumericUpDown(nupMass, objects, "babylonjs_mass");
            Tools.PrepareNumericUpDown(nupFriction, objects, "babylonjs_friction", 0.2f);
            Tools.PrepareNumericUpDown(nupRestitution, objects, "babylonjs_restitution", 0.2f);

            Tools.PrepareComboBox(cbImpostor, objects[0], "babylonjs_impostor", "None");

            Tools.PrepareCheckBox(chkAutoPlay, objects, "babylonjs_sound_autoplay", 1);
            Tools.PrepareCheckBox(chkLoop, objects, "babylonjs_sound_loop", 1);
            Tools.PrepareNumericUpDown(nupVolume, objects, "babylonjs_sound_volume", 1.0f);
            Tools.PrepareNumericUpDown(nupPlaybackRate, objects, "babylonjs_sound_playbackrate", 1.0f);

            Tools.PrepareComboBox(cbDistanceModel, objects[0], "babylonjs_sound_distancemodel", "linear");
            Tools.PrepareNumericUpDown(nupMaxDistance, objects, "babylonjs_sound_maxdistance", 100.0f);
            Tools.PrepareNumericUpDown(nupRolloff, objects, "babylonjs_sound_rolloff", 1.0f);
            Tools.PrepareNumericUpDown(nupRefDistance, objects, "babylonjs_sound_refdistance", 1.0f);

            Tools.PrepareCheckBox(chkDirectional, objects, "babylonjs_sound_directional", 0);
            Tools.PrepareNumericUpDown(nupConeInnerAngle, objects, "babylonjs_sound_coneinnerangle", 360.00f);
            Tools.PrepareNumericUpDown(nupConeOuterAngle, objects, "babylonjs_sound_coneouterangle", 360.00f);
            Tools.PrepareNumericUpDown(nupConeOuterGain, objects, "babylonjs_sound_coneoutergain", 1.0f);

            Tools.PrepareTextBox(txtSound, objects[0], "babylonjs_sound_filename");
        }

        private void chkAutoAnimate_CheckedChanged(object sender, EventArgs e)
        {
            grpAutoAnimate.Enabled = chkAutoAnimate.Checked;
        }

        private void chkDirectional_CheckedChanged(object sender, EventArgs e)
        {
            grpDirectional.Enabled = chkDirectional.Checked;
        }

        private void cmdFileBrowse_Click(object sender, EventArgs e)
        {
            if (ofdOpenSound.ShowDialog() == DialogResult.OK)
            {
                txtSound.Text = ofdOpenSound.FileName;
            }
        }
    }
}
