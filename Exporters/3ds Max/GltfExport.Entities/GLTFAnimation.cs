using System.Collections.Generic;
using System.Runtime.Serialization;

namespace GLTFExport.Entities
{
    [DataContract]
    public class GLTFAnimation : GLTFChildRootProperty
    {
        /// <summary>
        /// An array of channels, each of which targets an animation's sampler at a node's property.
        /// Different channels of the same animation can't have equal targets.
        /// </summary>
        [DataMember(IsRequired = true)]
        public GLTFChannel[] channels { get; set; }

        /// <summary>
        /// An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
        /// </summary>
        [DataMember(IsRequired = true)]
        public GLTFAnimationSampler[] samplers { get; set; }
    }
}
