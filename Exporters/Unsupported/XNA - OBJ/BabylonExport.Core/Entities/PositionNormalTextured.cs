using System.Collections.Generic;
using System.Globalization;
using SharpDX;

namespace BabylonExport.Core
{
    public struct PositionNormalTextured : IDumpable, IQueryable
    {
        public const int Stride = 32;
        public Vector3 Position;
        public Vector3 Normal;
        public Vector2 TextureCoordinates;

        public PositionNormalTextured(Vector3 position, Vector3 normal, Vector2 textureCoordinates)
        {
            Position = position;
            Normal = normal;
            TextureCoordinates = textureCoordinates;
        }

        public override string ToString()
        {
            return string.Format(CultureInfo.CurrentCulture, "P:{0} N:{1} TV:{2}", Position, Normal, TextureCoordinates);
        }

        public bool HasWeights
        {
            get { return false; }
        }

        public Vector3 GetPosition()
        {
            return Position;
        }

        public void DumpPositions(List<float> list)
        {
            list.Add(Position.X); list.Add(Position.Y); list.Add(Position.Z);
        }

        public void DumpNormals(List<float> list)
        {
            Normal.Normalize();
            list.Add(Normal.X); list.Add(Normal.Y); list.Add(Normal.Z);
        }

        public void DumpUVs(List<float> list)
        {
            list.Add(TextureCoordinates.X); list.Add(TextureCoordinates.Y);
        }

        public void DumpUVs2(List<float> list)
        {
        }

        public void DumpColors(List<float> list)
        {
        }


        public void DumpMatricesIndices(List<int> list)
        {
        }

        public void DumpMatricesWeights(List<float> list)
        {
        }
    }
}
