#ifdef USESPHERICALFROMREFLECTIONMAP
    uniform vec3 vSphericalX;
    uniform vec3 vSphericalY;
    uniform vec3 vSphericalZ;
    uniform vec3 vSphericalXX_ZZ;
    uniform vec3 vSphericalYY_ZZ;
    uniform vec3 vSphericalZZ;
    uniform vec3 vSphericalXY;
    uniform vec3 vSphericalYZ;
    uniform vec3 vSphericalZX;

    vec3 quaternionVectorRotation_ScaledSqrtTwo(vec4 Q, vec3 V){
        vec3 T = cross(Q.xyz, V);
        T += Q.www * V;
        return cross(Q.xyz, T) + V;
    }

    vec3 environmentIrradianceJones(vec3 normal)
    {
        // Fast method for evaluating a fixed spherical harmonics function on the sphere (e.g. irradiance or radiance).
        // Cost: 24 scalar operations on modern GPU "scalar" shader core, or 8 multiply-adds of 3D vectors:
        // "Function Cost 24	24x mad"

        // Note: the lower operation count compared to other methods (e.g. Sloan) is by further
        // taking advantage of the input 'normal' being normalised, which affords some further algebraic simplification.
        // Namely, the SH coefficients are first converted to spherical polynomial (SP) basis, then 
        // a substitution is performed using Z^2 = (1 - X^2 - Y^2).

        // As with other methods for evaluation spherical harmonic, the input 'normal' is assumed to be normalised (or near normalised).
        // This isn't as critical as it is with other calculations (e.g. specular highlight), but the result will be slightly incorrect nonetheless.
        float Nx = normal.x;
        float Ny = normal.y;
        float Nz = normal.z;

        vec3 C1 = vSphericalZZ.rgb;
        vec3 Cx = vSphericalX.rgb;
        vec3 Cy = vSphericalY.rgb;
        vec3 Cz = vSphericalZ.rgb;
        vec3 Cxx_zz = vSphericalXX_ZZ.rgb;
        vec3 Cyy_zz = vSphericalYY_ZZ.rgb;
        vec3 Cxy = vSphericalXY.rgb;
        vec3 Cyz = vSphericalYZ.rgb;
        vec3 Czx = vSphericalZX.rgb;

        vec3 a1 = Cyy_zz * Ny + Cy;
        vec3 a2 = Cyz * Nz + a1;
        vec3 b1 = Czx * Nz + Cx;
        vec3 b2 = Cxy * Ny + b1;
        vec3 b3 = Cxx_zz * Nx + b2;
        vec3 t1 = Cz  * Nz + C1;
        vec3 t2 = a2  * Ny + t1;
        vec3 t3 = b3  * Nx + t2;

        return t3;
    }
#endif