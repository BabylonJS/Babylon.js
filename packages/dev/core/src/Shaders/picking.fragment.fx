
#ifdef GPUPICKER_DEPTH
#extension GL_EXT_draw_buffers : require
#endif

#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
precision highp int;
#endif

#ifdef GPUPICKER_DEPTH
layout(location = 0) out highp vec4 glFragData[2];
highp vec4 gl_FragColor;
#endif

#ifdef GPUPICKER_PACK_DEPTH
#include<packingFunctions>
#endif

#if defined(INSTANCES)
flat varying float vMeshID;
#else
uniform float meshID;
#endif

void main(void) {
    // decode mesh ID into int32
    float id;
#if defined(INSTANCES)
    id = vMeshID;
#else
	id = meshID;
#endif

#if defined(WEBGL2) || defined(WEBGPU) || defined(NATIVE)
    int castedId = int(id);
    //decompose it into 3 bytes
    vec3 color = vec3(
        float((castedId >> 16) & 0xFF),
        float((castedId >> 8) & 0xFF),
        float(castedId & 0xFF)
    ) / 255.0;
    #ifdef GPUPICKER_DEPTH
        glFragData[0] = vec4(color, 1.0);
        #ifdef GPUPICKER_PACK_DEPTH
            glFragData[1] = pack(gl_FragCoord.z);
        #else
        glFragData[1] = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
        #endif
    #else
        gl_FragColor = vec4(color, 1.0);
    #endif
#else
    float castedId = floor(id + 0.5);
    // for webgl1, we need to emulate bitwise operations
    vec3 color = vec3(
        floor(mod(castedId, 16777216.0) / 65536.0),
        floor(mod(castedId, 65536.0) / 256.0),
        mod(castedId, 256.0)
    ) / 255.0;
    #ifdef GPUPICKER_DEPTH
        glFragData[0] = vec4(color, 1.0);
        #ifdef GPUPICKER_PACK_DEPTH
            glFragData[1] = pack(gl_FragCoord.z);
        #else
        glFragData[1] = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
        #endif
    #else
        gl_FragColor = vec4(color, 1.0);
    #endif
#endif
}
