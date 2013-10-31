using System;

namespace BabylonExport.Core
{
    internal class ObjLine : Line
    {
        public override string BlockSperator { get { return "v"; } }
        public ObjHeader Header
        {
            get
            {
                if (IsComment)
                    return ObjHeader.Comment;

                string lineType = Tokens[0].ToLower();
                switch (lineType)
                {
                    case "o":
                        return ObjHeader.Object;
                    case "v":
                        return ObjHeader.Vertices;
                    case "vt":
                        return ObjHeader.TextureCoordinates;
                    case "vn":
                        return ObjHeader.Normals;
                    case "g":
                        return ObjHeader.Group;
                    case "s":
                        return ObjHeader.None;
                    case "l":
                        return ObjHeader.Line;
                    case "f":
                        return ObjHeader.Faces;
                    case "mtllib":
                        return ObjHeader.MaterialLibrary;
                    case "usemtl":
                        return ObjHeader.Material;
                }

                throw new Exception(string.Format("Unsupported line type [{0}] at line {1}", lineType, Index));
            }
        }
    }
}
