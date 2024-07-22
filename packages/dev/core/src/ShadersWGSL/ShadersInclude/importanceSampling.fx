// https://www.tobias-franke.eu/log/2014/03/30/notes_on_importance_sampling.html
//
// Importance sampling
// -------------------
//
// Important samples are chosen to integrate cos(theta) over the hemisphere.
//
// All calculations are made in tangent space, with n = [0 0 1]
//
//                      l (important sample)
//                     /.
//                    / .
//                   /  .
//                  /   .
//         --------o----+-------> n (direction)
//                   cos(theta)
//                    = n•l
//
//
//  'direction' is given as an input parameter, and serves as tge z direction of the tangent space.
//
//  l = important_sample_cos()
//
//  n•l = [0 0 1] • l = l.z
//
//           n•l
//  pdf() = -----
//           PI
//
fn hemisphereCosSample(u: vec2f) -> vec3f {
    // pdf = cosTheta / M_PI;
    var phi: f32 = 2. * PI * u.x;

    var cosTheta2: f32 = 1. - u.y;
    var cosTheta: f32 = sqrt(cosTheta2);
    var sinTheta: f32 = sqrt(1. - cosTheta2);

    return  vec3f(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
}

// https://www.tobias-franke.eu/log/2014/03/30/notes_on_importance_sampling.html
//
//
// Importance sampling GGX - Trowbridge-Reitz
// ------------------------------------------
//
// Important samples are chosen to integrate Dggx() * cos(theta) over the hemisphere.
//
// All calculations are made in tangent space, with n = [0 0 1]
//
//                      h (important sample)
//                     /.
//                    / .
//                   /  .
//                  /   .
//         --------o----+-------> n
//                   cos(theta)
//                    = n•h
//
//  h is micro facet's normal
//  l is the reflection of v around h, l = reflect(-v, h)  ==>  v•h = l•h
//
//  n•v is given as an input parameter at runtime
//
//  Since n = [0 0 1], we also have v.z = n•v
//
//  Since we need to compute v•h, we chose v as below. This choice only affects the
//  computation of v•h (and therefore the fresnel term too), but doesn't affect
//  n•l, which only relies on l.z (which itself only relies on v.z, i.e.: n•v)
//
//      | sqrt(1 - (n•v)^2)     (sin)
//  v = | 0
//      | n•v                   (cos)
//
//
//  h = important_sample_ggx()
//
fn hemisphereImportanceSampleDggx(u: vec2f, a: f32) -> vec3f {
    // pdf = D(a) * cosTheta
    var phi: f32 = 2. * PI * u.x;

    // NOTE: (aa-1) == (a-1)(a+1) produces better fp accuracy
    var cosTheta2: f32 = (1. - u.y) / (1. + (a + 1.) * ((a - 1.) * u.y));
    var cosTheta: f32 = sqrt(cosTheta2);
    var sinTheta: f32 = sqrt(1. - cosTheta2);

    return  vec3f(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
}

//
//
// Importance sampling Charlie
// ---------------------------
//
// In order to pick the most significative samples and increase the convergence rate, we chose to
// rely on Charlie's distribution function for the pdf as we do in hemisphereImportanceSampleDggx.
//
// To determine the direction we then need to resolve the cdf associated to the chosen pdf for random inputs.
//
// Knowing pdf() = DCharlie(h) <n•h>
//
// We need to find the cdf:
//
// / 2pi     / pi/2
// |         |  (2 + (1 / a)) * sin(theta) ^ (1 / a) * cos(theta) * sin(theta)
// / phi=0   / theta=0
//
// We sample theta and phi independently.
//
// 1. as in all the other isotropic cases phi = 2 * pi * epsilon
//    (https://www.tobias-franke.eu/log/2014/03/30/notes_on_importance_sampling.html)
//
// 2. we need to solve the integral on theta:
//
//             / sTheta
// P(sTheta) = |  (2 + (1 / a)) * sin(theta) ^ (1 / a + 1) * cos(theta) * dtheta
//             / theta=0
//
// By subsitution of u = sin(theta) and du = cos(theta) * dtheta
//
// /
// |  (2 + (1 / a)) * u ^ (1 / a + 1) * du
// /
//
// = (2 + (1 / a)) * u ^ (1 / a + 2) / (1 / a + 2)
//
// = u ^ (1 / a + 2)
//
// = sin(theta) ^ (1 / a + 2)
//
//             +-                          -+ sTheta
// P(sTheta) = |  sin(theta) ^ (1 / a + 2)  |
//             +-                          -+ 0
//
// P(sTheta) = sin(sTheta) ^ (1 / a + 2)
//
// We now need to resolve the cdf for an epsilon value:
//
// epsilon = sin(theta) ^ (a / ( 2 * a + 1))
//
//  +--------------------------------------------+
//  |                                            |
//  |  sin(theta) = epsilon ^ (a / ( 2 * a + 1)) |
//  |                                            |
//  +--------------------------------------------+
//
fn hemisphereImportanceSampleDCharlie(u: vec2f, a: f32) -> vec3f { 
    // pdf = DistributionCharlie() * cosTheta
    var phi: f32 = 2. * PI * u.x;

    var sinTheta: f32 = pow(u.y, a / (2. * a + 1.));
    var cosTheta: f32 = sqrt(1. - sinTheta * sinTheta);

    return  vec3f(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
}