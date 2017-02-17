#ifdef USESPHERICALFROMREFLECTIONMAP
    uniform vec3 vSphericalX;
    uniform vec3 vSphericalY;
    uniform vec3 vSphericalZ;
    uniform vec3 vSphericalXX;
    uniform vec3 vSphericalYY;
    uniform vec3 vSphericalZZ;
    uniform vec3 vSphericalXY;
    uniform vec3 vSphericalYZ;
    uniform vec3 vSphericalZX;

    vec3 EnvironmentIrradiance(vec3 normal)
    {
        // Note: 'normal' is assumed to be normalised (or near normalised)
        // This isn't as critical as it is with other calculations (e.g. specular highlight), but the result will be incorrect nonetheless.

        // TODO: switch to optimal implementation
        vec3 result =
            vSphericalX * normal.x +
            vSphericalY * normal.y +
            vSphericalZ * normal.z +
            vSphericalXX * normal.x * normal.x +
            vSphericalYY * normal.y * normal.y +
            vSphericalZZ * normal.z * normal.z +
            vSphericalYZ * normal.y * normal.z +
            vSphericalZX * normal.z * normal.x +
            vSphericalXY * normal.x * normal.y;

        return result.rgb;
    }
#endif