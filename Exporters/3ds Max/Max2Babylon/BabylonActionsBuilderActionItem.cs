using Autodesk.Max;
using ActionItem = Autodesk.Max.Plugins.ActionItem;

namespace Max2Babylon
{
    public class BabylonActionsBuilderActionItem : ActionItem
    {
        public override bool ExecuteAction()
        {
            if (Loader.Core.SelNodeCount > 1)
            {
                Loader.Core.PushPrompt("Actions Builder only supports one Node");
            }
            else
            {
                IINode node = null;
                SClass_ID type;

                if (Loader.Core.SelNodeCount == 0)
                    type = SClass_ID.Scene;
                else
                {
                    node = Loader.Core.GetSelNode(0);
                    type = node.ObjectRef.Eval(0).Obj.SuperClassID;
                }

                if (type == SClass_ID.Geomobject || type == SClass_ID.Light || type == SClass_ID.Camera || type == SClass_ID.Scene)
                {
                    using (var ab = new ActionsBuilderForm())
                    {
                        // Just show dialog
                        ab.ShowDialog();
                    }
                }
            }

            return true;
        }

        public override int Id_
        {
            get { return 2; }
        }

        public override string ButtonText
        {
            get { return "Babylon Actions Builder"; }
        }

        public override string MenuText
        {
            get { return "Babylon Actions Builder"; }
        }

        public override string DescriptionText
        {
            get { return "UI graph to build custom actions on selected object"; }
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
