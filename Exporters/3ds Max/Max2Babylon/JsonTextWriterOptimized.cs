using System;
using System.IO;
using Newtonsoft.Json;

namespace Max2Babylon
{
    class JsonTextWriterOptimized : JsonTextWriter
    {
        public JsonTextWriterOptimized(TextWriter textWriter)
            : base(textWriter)
        {
        }
        public override void WriteValue(float value)
        {
            value = (float)Math.Round(value, 4);
            base.WriteValue(value);
        }
    }
}
