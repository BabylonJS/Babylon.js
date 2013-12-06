using System;

namespace BabylonExport.Core
{
    internal class MtlLine : Line
    {
        public override string BlockSperator { get { return "newmtl"; }}

        public MtlHeader Header
        {
            get
            {
                if (IsComment)
                    return MtlHeader.Comment;

                string lineType = Tokens[0].ToLower();
                switch (lineType)
                {
                    case "newmtl":
                        return MtlHeader.Material;
                    case "kd":
                        return MtlHeader.DiffuseColor;
                    case "map_kd":
                        return MtlHeader.DiffuseTexture;
                    case "ks":
                        return MtlHeader.SpecularColor;
                    case "ns":
                        return MtlHeader.SpecularPower;
                    case "map_ks":
                        return MtlHeader.SpecularTexture;
                    case "ke":
                        return MtlHeader.EmissiveColor;
                    case "d":
                        return MtlHeader.Alpha;
                    case "illum":
                        return MtlHeader.IlluminationModel;
                    case "ni":
                        return MtlHeader.RefractionIndex;
                    case "tr":
                        return MtlHeader.Transparency;
                    case "map_d":
                        return MtlHeader.TransparencyTexture;
                    case "tf":
                        return MtlHeader.TransmissionFiter;
                    case "ka":
                        return MtlHeader.AmbientColor;
                    case "map_ka":
                        return MtlHeader.AmbientTexture;
                    case "bump":
                    case "map_bump":
                        return MtlHeader.BumpTexture;
                    case "map_refl":
                        return MtlHeader.ReflectionTexture;
                }

                throw new Exception(string.Format("Unsupported line type [{0}] at line {1}", lineType, Index));
            }
        }
    }
}
