using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFCamera : GLTFIndexedChildRootProperty
    {
        public enum CameraType
        {
            perspective,
            orthographic
        }

        [DataMember(EmitDefaultValue = false)]
        public GLTFCameraOrthographic orthographic { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public GLTFCameraPerspective perspective { get; set; }

        [DataMember(IsRequired = true)]
        public string type { get; set; }

        public GLTFNode gltfNode;
    }
}
