using Autodesk.Max;
using ActionItem = Autodesk.Max.Plugins.ActionItem;

namespace Max2Babylon
{
    public class BabylonPropertiesActionItem : ActionItem
    {
        public override bool ExecuteAction()
        {
            if (Loader.Core.SelNodeCount == 0)
            {
                using (var frm = new ScenePropertiesForm())
                {
                    frm.ShowDialog();
                    return true;
                }
            }

            var firstNode = Loader.Core.GetSelNode(0);

            if (firstNode.ObjectRef != null && firstNode.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Camera)
            {
                using (var frm = new CameraPropertiesForm())
                {
                    frm.ShowDialog();
                    return true;
                }
            }

           

            if (firstNode.ObjectRef != null && firstNode.ObjectRef.Eval(0).Obj.SuperClassID == SClass_ID.Light)
            {
                using (var frm = new LightPropertiesForm())
                {
                    frm.ShowDialog();
                    return true;
                }
            }
           
            // consider non-recognized objects as meshes so they can be animated intermediate nodes
            using (var frm = new ObjectPropertiesForm())
            {
                frm.ShowDialog();
                return true;
            }
            

        }

        public override int Id_
        {
            get { return 1; }
        }

        public override string ButtonText
        {
            get { return "Babylon Properties"; }
        }

        public override string MenuText
        {
            get { return "Babylon Properties"; }
        }

        public override string DescriptionText
        {
            get { return "UI for setting Babylon.js specific properties"; }
        }

        public override string CategoryText
        {
            get { return "Babylon"; }
        }

        public override bool IsChecked_
        {
            get { return false; }
        }

        public override bool IsItemVisible
        {
            get { return true; }
        }

        public override bool IsEnabled_
        {
            get { return true; }
        }
    }
}
