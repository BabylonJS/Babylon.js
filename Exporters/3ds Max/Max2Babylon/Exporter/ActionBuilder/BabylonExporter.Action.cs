using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Autodesk.Max;
using BabylonExport.Entities;

namespace Max2Babylon
{
    partial class BabylonExporter
    {
        private BabylonActions ExportNodeAction(IIGameNode node)
        {
            string prop;
            if (node != null)
                prop = node.MaxNode.GetStringProperty("babylon_actionsbuilder", "");
            else
                prop = Loader.Core.RootNode.GetStringProperty("babylon_actionsbuilder", "");

            if (String.IsNullOrEmpty(prop))
                return null;

            var result = JsonConvert.DeserializeObject<BabylonActions>(prop);

            return result;
        }
    }
}
