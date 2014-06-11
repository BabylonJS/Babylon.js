using Autodesk.Max;

namespace Max2Babylon
{
    public class Descriptor : Autodesk.Max.Plugins.ClassDesc2
    {
        public override object Create(bool loading)
        {
            return new GlobalUtility();
        }

        public override bool IsPublic
        {
            get
            {
                return true;
            }
        }

        public override string ClassName
        {
            get
            {
                return "Babylon File Exporter";
            }
        }

        public override SClass_ID SuperClassID
        {
            get
            {
                return SClass_ID.Gup;
            }
        }

        public override IClass_ID ClassID
        {
            get
            {
                return Loader.Class_ID;
            }
        }

        public override string Category
        {
            get
            {
                return "Babylon";
            }
        }
    }
}
