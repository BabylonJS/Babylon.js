using System.Collections.Generic;
using System.Globalization;
using SharpDX;

namespace BabylonExport.Core
{
    public struct PositionNormalTexturedWeights : IDumpable, IQueryable
    {
        public const int Stride = 52; // Maya returning >=52 for PNTW vertex, not 64
        public Vector3 Position;
        public int Indices;
        public Vector4 Weights;
        public Vector3 Normal;
        public Vector2 TextureCoordinates;

        public PositionNormalTexturedWeights(Vector3 position, Vector3 normal, Vector4 weights, int indices, Vector2 textureCoordinates)
        {
            Position = position;
            Normal = normal;
            Weights = weights;
            Indices = indices;
            TextureCoordinates = textureCoordinates;
        }

        public override string ToString()
        {
            return string.Format(CultureInfo.CurrentCulture, "P:{0} N:{1} TV:{4} W:{2} I:{3}", Position, Normal, Weights, Indices, TextureCoordinates);
        }

        public bool HasWeights
        {
            get { return true; }
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
            list.Add(Indices);
        }

        public void DumpMatricesWeights(List<float> list)
        {
            list.Add(Weights.X); list.Add(Weights.Y); list.Add(Weights.Z); list.Add(Weights.W);
        }
    }
}
