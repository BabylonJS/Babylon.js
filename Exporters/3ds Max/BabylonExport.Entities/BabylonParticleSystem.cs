using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonParticleSystem
    {
		[DataMember]
		public string name;

		[DataMember]
		public bool preventAutoStart;

        [DataMember]
        public string emitterId { get; set; }

        [DataMember]
        public float[] gravity { get; set; }

        [DataMember]
        public float[] direction1 { get; set; }

        [DataMember]
        public float[] direction2 { get; set; }

        [DataMember]
        public float[] minEmitBox { get; set; }

        [DataMember]
        public float[] maxEmitBox { get; set; }

        [DataMember]
        public float[] color1 { get; set; }

        [DataMember]
        public float[] color2 { get; set; }

        [DataMember]
        public float[] colorDead { get; set; }

        [DataMember]
        public float deadAlpha { get; set; }

        [DataMember]
        public float emitRate { get; set; }

        [DataMember]
        public float updateSpeed { get; set; }

        [DataMember]
        public int targetStopFrame { get; set; }

        [DataMember]
        public float minEmitPower { get; set; }

        [DataMember]
        public float maxEmitPower { get; set; }

        [DataMember]
        public float minLifeTime { get; set; }

        [DataMember]
        public float maxLifeTime { get; set; }

        [DataMember]
        public float minSize { get; set; }

        [DataMember]
        public float maxSize { get; set; }

        [DataMember]
        public float minAngularSpeed { get; set; }

        [DataMember]
        public float maxAngularSpeed { get; set; }

        [DataMember]
        public string textureName { get; set; }

        [DataMember]
        public int blendMode { get; set; }

        [DataMember]
        public int capacity { get; set; }

        [DataMember]
        public float[] textureMask { get; set; }

        [DataMember]
        public bool linkToEmitter { get; set; }
    }
}
