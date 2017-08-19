namespace BabylonExport.Entities
{
    public class BabylonQuaternion
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        public float W { get; set; }

        public float[] ToArray()
        {
            return new [] {X, Y, Z, W};
        }
    }
}
