using System.Runtime.Serialization;
namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonUniversalCamera : BabylonCamera
    {
        public BabylonUniversalCamera()
        {
            type = "UniversalCamera";
        }
    }
}