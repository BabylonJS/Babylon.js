using System;
using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFAccessor : GLTFIndexedChildRootProperty
    {
        public enum ComponentType
        {
            BYTE = 5120,
            UNSIGNED_BYTE = 5121,
            SHORT = 5122,
            UNSIGNED_SHORT = 5123,
            UNSIGNED_INT = 5125,
            FLOAT = 5126
        }

        public enum TypeEnum
        {
            SCALAR,
            VEC2,
            VEC3,
            VEC4,
            MAT2,
            MAT3,
            MAT4
        }

        [DataMember(EmitDefaultValue = false)]
        public int? bufferView { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public int byteOffset { get; set; }

        [DataMember(IsRequired = true)]
        public ComponentType componentType { get; set; } // EComponentType BYTE = 5120, 5121..., FLOAT = 5126

        [DataMember(EmitDefaultValue = false)]
        public bool normalized { get; set; }

        [DataMember(IsRequired = true)]
        public int count { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float[] max { get; set; }

        [DataMember(EmitDefaultValue = false)]
        public float[] min { get; set; }

        [DataMember(IsRequired = true)]
        public string type { get; set; } // ex: SCALAR, VEC3

        [DataMember(EmitDefaultValue = false)]
        public string sparse { get; set; } // TODO

        public GLTFBufferView BufferView;

        public int getByteLength()
        {
            return count * getElementSize();
        }

        /// <summary>
        /// Return the size of element accessible by accessor
        /// </summary>
        private int getElementSize()
        {
            TypeEnum typeAsEnum;
            TypeEnum.TryParse(type, out typeAsEnum);
            return getComponentTypeSize(componentType) * getNbComponents(typeAsEnum);
        }

        /// <summary>
        /// Return the size, in bytes, of the 'componentType'
        /// </summary>
        private static int getComponentTypeSize(ComponentType componentType)
        {
            switch (componentType)
            {
                case ComponentType.BYTE:
                case ComponentType.UNSIGNED_BYTE:
                    return 1;
                case ComponentType.SHORT:
                case ComponentType.UNSIGNED_SHORT:
                    return 2;
                case ComponentType.UNSIGNED_INT:
                case ComponentType.FLOAT:
                    return 4;
                default:
                    return 0;
            }
        }

        /// <summary>
        /// Return the number of components defined by 'type'
        /// </summary>
        private static int getNbComponents(TypeEnum type)
        {
            switch (type)
            {
                case TypeEnum.SCALAR:
                    return 1;
                case TypeEnum.VEC2:
                    return 2;
                case TypeEnum.VEC3:
                    return 3;
                case TypeEnum.VEC4:
                case TypeEnum.MAT2:
                    return 4;
                case TypeEnum.MAT3:
                    return 9;
                case TypeEnum.MAT4:
                    return 16;
                default:
                    return 0;
            }
        }
    }
}
