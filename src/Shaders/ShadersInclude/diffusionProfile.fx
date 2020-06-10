uniform vec3 diffusionS[5];
uniform float diffusionD[5];
uniform float filterRadii[5];

// struct DiffusionProfile
// {
//   vec3 S;
//   float d;
//   float filterRadius;
// };

// DiffusionProfile diffusionProfiles[3] = DiffusionProfile[3](
// 	DiffusionProfile(vec3(1., 1., 1.), 1., 16.564398753373407), // neutral
// 	DiffusionProfile(vec3(0.7568628, 0.32156864, 0.20000002), 0.7568628, 12.536977220794705), // skin
// 	DiffusionProfile(vec3(0.7568628, 0.7019608, 0.24313727), 0.7568628, 12.536977220794705) // foliage
// );