
#if defined(INSTANCES)
varying float vMeshID;
#else
uniform float meshID;
#endif

void main(void) {
    // decode mesh ID into int32
    int id;
#if defined(INSTANCES)
    id = int(vMeshID);
#else
	id = int(meshID);
#endif

#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
    //decompose it into 3 bytes
    gl_FragColor = vec4(
        float((id >> 16) & 0xFF),
        float((id >> 8) & 0xFF),
        float(id & 0xFF),
        255.0
    ) / 255.0;
#else
    // for webgl1, we need to emulate bitwise operations
    gl_FragColor = vec4(
        floor(mod(id / 16777216.0) / 65536.0),
        floor(mod(id / 65536.0) / 256.0),
        mod(id, 256.0),
        255.0
    ) / 255.0;
#endif
}
