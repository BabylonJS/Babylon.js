using GLTFExport.Entities;

namespace Max2Babylon
{
    public class GLTFBufferService
    {
        private static GLTFBufferService _instance;

        public static GLTFBufferService Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = new GLTFBufferService();
                }
                return _instance;
            }
        }

        public GLTFBuffer GetBuffer(GLTF gltf)
        {
            var buffer = gltf.buffer;
            if (buffer == null)
            {
                buffer = new GLTFBuffer
                {
                    uri = gltf.OutputFile + ".bin"
                };
                buffer.index = gltf.BuffersList.Count;
                gltf.BuffersList.Add(buffer);
                gltf.buffer = buffer;
            }
            return buffer;
        }

        public GLTFBufferView GetBufferViewScalar(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewScalar == null)
            {
                gltf.bufferViewScalar = CreateBufferView(gltf, buffer, "bufferViewScalar");
            }
            return gltf.bufferViewScalar;
        }

        public GLTFBufferView GetBufferViewFloatVec2(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewFloatVec2 == null)
            {
                var bufferView = CreateBufferView(gltf, buffer, "bufferViewFloatVec2");
                bufferView.byteStride = 8;
                gltf.bufferViewFloatVec2 = bufferView;
            }
            return gltf.bufferViewFloatVec2;
        }

        public GLTFBufferView GetBufferViewFloatVec3(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewFloatVec3 == null)
            {
                var bufferView = CreateBufferView(gltf, buffer, "bufferViewFloatVec3");
                bufferView.byteStride = 12;
                gltf.bufferViewFloatVec3 = bufferView;
            }
            return gltf.bufferViewFloatVec3;
        }

        public GLTFBufferView GetBufferViewFloatVec4(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewFloatVec4 == null)
            {
                var bufferView = CreateBufferView(gltf, buffer, "bufferViewFloatVec4");
                bufferView.byteStride = 16;
                gltf.bufferViewFloatVec4 = bufferView;
            }
            return gltf.bufferViewFloatVec4;
        }

        public GLTFBufferView GetBufferViewAnimationFloatScalar(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewAnimationFloatScalar == null)
            {
                gltf.bufferViewAnimationFloatScalar = CreateBufferView(gltf, buffer, "bufferViewAnimationFloatScalar");
            }
            return gltf.bufferViewAnimationFloatScalar;
        }

        public GLTFBufferView GetBufferViewAnimationFloatVec3(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewAnimationFloatVec3 == null)
            {
                var bufferView = CreateBufferView(gltf, buffer, "bufferViewAnimationFloatVec3");
                gltf.bufferViewAnimationFloatVec3 = bufferView;
            }
            return gltf.bufferViewAnimationFloatVec3;
        }

        public GLTFBufferView GetBufferViewAnimationFloatVec4(GLTF gltf, GLTFBuffer buffer)
        {
            if (gltf.bufferViewAnimationFloatVec4 == null)
            {
                var bufferView = CreateBufferView(gltf, buffer, "bufferViewAnimationFloatVec4");
                gltf.bufferViewAnimationFloatVec4 = bufferView;
            }
            return gltf.bufferViewAnimationFloatVec4;
        }

        private GLTFBufferView CreateBufferView(GLTF gltf, GLTFBuffer buffer, string name)
        {
            var bufferView = new GLTFBufferView
            {
                name = name,
                buffer = buffer.index,
                Buffer = buffer
            };
            bufferView.index = gltf.BufferViewsList.Count;
            gltf.BufferViewsList.Add(bufferView);
            buffer.BufferViews.Add(bufferView);
            return bufferView;
        }

        public GLTFAccessor CreateAccessor(GLTF gltf, GLTFBufferView bufferView, string name, GLTFAccessor.ComponentType componentType, GLTFAccessor.TypeEnum type)
        {
            var accessor = new GLTFAccessor
            {
                name = name,
                bufferView = bufferView.index,
                BufferView = bufferView,
                componentType = componentType,
                type = type.ToString()
            };
            accessor.index = gltf.AccessorsList.Count;
            gltf.AccessorsList.Add(accessor);
            bufferView.Accessors.Add(accessor);
            return accessor;
        }

        public static void UpdateMinMaxAccessor(GLTFAccessor accessor, float[] values)
        {
            for (int indexComponent = 0; indexComponent < values.Length; indexComponent++)
            {
                UpdateMinMaxAccessor(accessor, values[indexComponent], indexComponent);
            }
        }

        public static void UpdateMinMaxAccessor(GLTFAccessor accessor, float value, int indexComponent = 0)
        {
            if (value < accessor.min[indexComponent])
            {
                accessor.min[indexComponent] = value;
            }
            if (value > accessor.max[indexComponent])
            {
                accessor.max[indexComponent] = value;
            }
        }
    }
}
