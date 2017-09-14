using System;
using System.Drawing;
using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    public class BabylonColor3
    {
        public float r;
        public float g;
        public float b;

        public BabylonColor3(float r = 0, float g = 0, float b = 0)
        {
            this.r = r;
            this.g = g;
            this.b = b;
        }

        public BabylonColor3(float[] array)
        {
            if (array.Length >= 3)
            {
                this.r = array[0];
                this.g = array[1];
                this.b = array[2];
            }
        }

        public BabylonColor3(Color color)
        {
            this.r = color.R / 255.0f;
            this.g = color.G / 255.0f;
            this.b = color.B / 255.0f;
        }

        public override string ToString()
        {
            return "{ r=" + r + ", g=" + g + ", b=" + b + "}";
        }

        public BabylonColor3 clamp(float min = 0, float max = 1)
        {
            this.r = ClampScalar(this.r, min, max);
            this.g = ClampScalar(this.g, min, max);
            this.b = ClampScalar(this.b, min, max);
            return this;
        }

        public float getPerceivedBrightness()
        {
            return (float)Math.Sqrt(0.299 * this.r * this.r + 0.587 * this.g * this.g + 0.114 * this.b * this.b);
        }

        public float getMaxComponent()
        {
            return Math.Max(this.r, Math.Max(this.g, this.b));
        }

        /**
         * Multiplies in place each rgb value by scale.  
         * Returns the updated Color3.  
         */
        public BabylonColor3 scale(float scale)
        {
            return new BabylonColor3(this.r * scale, this.g * scale, this.b * scale);
        }

        /**
         * Returns a new Color3 set with the subtracted values of the passed one from the current Color3.    
         */
        public BabylonColor3 subtract(BabylonColor3 right)
        {
            return new BabylonColor3(this.r - right.r, this.g - right.g, this.b - right.b);
        }

        /**
         * Creates a new Color3 with values linearly interpolated of "amount" between the start Color3 and the end Color3.  
         */
        public static BabylonColor3 Lerp(BabylonColor3 start, BabylonColor3 end, float amount)
        {
            var r = start.r + ((end.r - start.r) * amount);
            var g = start.g + ((end.g - start.g) * amount);
            var b = start.b + ((end.b - start.b) * amount);
            return new BabylonColor3(r, g, b);
        }

        /**
         * Returns the value itself if it's between min and max.  
         * Returns min if the value is lower than min.
         * Returns max if the value is greater than max.  
         */
        private static float ClampScalar(float value, float min = 0, float max = 1)
        {
            return Math.Min(max, Math.Max(min, value));
        }
    }
}
