#ifdef USESPHERICALFROMREFLECTIONMAP
    #ifdef SPHERICAL_HARMONICS
        // Please note the coefficient have been prescaled.
        //
        // This uses the theory from both Sloan and Ramamoothi:
        //   https://www.ppsloan.org/publications/SHJCGT.pdf
        //   http://www-graphics.stanford.edu/papers/envmap/
        // The only difference is the integration of the reconstruction coefficients direcly
        // into the vectors as well as the 1 / pi multiplication to simulate a lambertian diffuse.
        fn computeEnvironmentIrradiance(normal: vec3f) -> vec3f {
            return uniforms.vSphericalL00

                + uniforms.vSphericalL1_1 * (normal.y)
                + uniforms.vSphericalL10 * (normal.z)
                + uniforms.vSphericalL11 * (normal.x)

                + uniforms.vSphericalL2_2 * (normal.y * normal.x)
                + uniforms.vSphericalL2_1 * (normal.y * normal.z)
                + uniforms.vSphericalL20 * ((3.0 * normal.z * normal.z) - 1.0)
                + uniforms.vSphericalL21 * (normal.z * normal.x)
                + uniforms.vSphericalL22 * (normal.x * normal.x - (normal.y * normal.y));
        }
    #else
        // By Matthew Jones.
        fn computeEnvironmentIrradiance(normal: vec3f) -> vec3f {
            // Fast method for evaluating a fixed spherical harmonics function on the sphere (e.g. irradiance or radiance).
            // Cost: 24 scalar operations on modern GPU "scalar" shader core, or 8 multiply-adds of 3D vectors:
            // "Function Cost 24	24x mad"

            // Note: the lower operation count compared to other methods (e.g. Sloan) is by further
            // taking advantage of the input 'normal' being normalised, which affords some further algebraic simplification.
            // Namely, the SH coefficients are first converted to spherical polynomial (SP) basis, then 
            // a substitution is performed using Z^2 = (1 - X^2 - Y^2).

            // As with other methods for evaluation spherical harmonic, the input 'normal' is assumed to be normalised (or near normalised).
            // This isn't as critical as it is with other calculations (e.g. specular highlight), but the result will be slightly incorrect nonetheless.
            var Nx: f32 = normal.x;
            var Ny: f32 = normal.y;
            var Nz: f32 = normal.z;

            var C1: vec3f = uniforms.vSphericalZZ.rgb;
            var Cx: vec3f = uniforms.vSphericalX.rgb;
            var Cy: vec3f = uniforms.vSphericalY.rgb;
            var Cz: vec3f = uniforms.vSphericalZ.rgb;
            var Cxx_zz: vec3f = uniforms.vSphericalXX_ZZ.rgb;
            var Cyy_zz: vec3f = uniforms.vSphericalYY_ZZ.rgb;
            var Cxy: vec3f = uniforms.vSphericalXY.rgb;
            var Cyz: vec3f = uniforms.vSphericalYZ.rgb;
            var Czx: vec3f = uniforms.vSphericalZX.rgb;

            var a1: vec3f = Cyy_zz * Ny + Cy;
            var a2: vec3f = Cyz * Nz + a1;
            var b1: vec3f = Czx * Nz + Cx;
            var b2: vec3f = Cxy * Ny + b1;
            var b3: vec3f = Cxx_zz * Nx + b2;
            var t1: vec3f = Cz  * Nz + C1;
            var t2: vec3f = a2  * Ny + t1;
            var t3: vec3f = b3  * Nx + t2;

            return t3;
        }
    #endif
#endif