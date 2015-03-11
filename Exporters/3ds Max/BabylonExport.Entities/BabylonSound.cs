using System.Runtime.Serialization;

namespace BabylonExport.Entities
{
    [DataContract]
    public class BabylonSound
    {
        [DataMember]
        public string name { get; set; }

        [DataMember]
        public float volume { get; set; }

        [DataMember]
        public float playbackRate { get; set; }

        [DataMember]
        public bool autoplay { get; set; }

        [DataMember]
        public bool loop { get; set; }

        [DataMember]
        public int soundTrackId { get; set; }

        [DataMember]
        public bool spatialSound { get; set; }

        [DataMember]
        public float[] position { get; set; }

        [DataMember]
        public float refDistance { get; set; }

        [DataMember]
        public float rolloffFactor { get; set; }

        [DataMember]
        public float maxDistance { get; set; }

        [DataMember]
        public string distanceModel { get; set; }

        [DataMember]
        public string panningModel { get; set; }

        [DataMember]
        public bool isDirectional { get; set; }

        [DataMember]
        public float coneInnerAngle { get; set; }

        [DataMember]
        public float coneOuterAngle { get; set; }

        [DataMember]
        public float coneOuterGain { get; set; }

        [DataMember]
        public string connectedMeshId { get; set; }

        [DataMember]
        public float[] localDirectionToMesh { get; set; }

        public BabylonSound()
        {
            volume = 1;
            playbackRate = 1;
            autoplay = false;
            loop = false;
            soundTrackId = -1;
            spatialSound = false;
            position = new[] { 0f, 0f, 0f };
            refDistance = 1;
            rolloffFactor = 1;
            maxDistance = 100;
            distanceModel = "linear";
            panningModel = "equalpower";
            isDirectional = false;
            coneInnerAngle = 360;
            coneOuterAngle = 360;
            coneOuterGain = 0;
            localDirectionToMesh = new[] { 1f, 0f, 0f };
        }
    }
}
