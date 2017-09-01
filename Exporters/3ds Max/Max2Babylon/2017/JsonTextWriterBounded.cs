using Newtonsoft.Json;
using System.IO;

namespace Max2Babylon
{
    class JsonTextWriterBounded : JsonTextWriter
    {
        public JsonTextWriterBounded(TextWriter textWriter)
            : base(textWriter)
        {
        }

        public override void WriteValue(float value)
        {
            if (float.IsNegativeInfinity(value))
            {
                value = float.MinValue;
            }
            else if (float.IsPositiveInfinity(value))
            {
                value = float.MaxValue;
            }
            base.WriteValue(value);
        }

        public override void WriteValue(float? value)
        {
            if (value.HasValue)
            {
                if (float.IsNegativeInfinity(value.Value))
                {
                    value = float.MinValue;
                }
                else if (float.IsPositiveInfinity(value.Value))
                {
                    value = float.MaxValue;
                }
            }
            base.WriteValue(value);
        }
    }
}
