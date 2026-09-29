#ifdef PREPASS
#extension GL_EXT_draw_buffers : require
    #ifdef PREPASS_MESH_BLEND_TAG
        #if {X} > 0
            #if PREPASS_MESH_BLEND_TAG_INDEX == 0
                layout(location = 0) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 0) out highp vec4 glFragData0;
            #endif
        #endif
        #if {X} > 1
            #if PREPASS_MESH_BLEND_TAG_INDEX == 1
                layout(location = 1) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 1) out highp vec4 glFragData1;
            #endif
        #endif
        #if {X} > 2
            #if PREPASS_MESH_BLEND_TAG_INDEX == 2
                layout(location = 2) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 2) out highp vec4 glFragData2;
            #endif
        #endif
        #if {X} > 3
            #if PREPASS_MESH_BLEND_TAG_INDEX == 3
                layout(location = 3) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 3) out highp vec4 glFragData3;
            #endif
        #endif
        #if {X} > 4
            #if PREPASS_MESH_BLEND_TAG_INDEX == 4
                layout(location = 4) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 4) out highp vec4 glFragData4;
            #endif
        #endif
        #if {X} > 5
            #if PREPASS_MESH_BLEND_TAG_INDEX == 5
                layout(location = 5) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 5) out highp vec4 glFragData5;
            #endif
        #endif
        #if {X} > 6
            #if PREPASS_MESH_BLEND_TAG_INDEX == 6
                layout(location = 6) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 6) out highp vec4 glFragData6;
            #endif
        #endif
        #if {X} > 7
            #if PREPASS_MESH_BLEND_TAG_INDEX == 7
                layout(location = 7) out highp uvec4 meshBlendTagOutput;
            #else
                layout(location = 7) out highp vec4 glFragData7;
            #endif
        #endif

        void writeGeometryFragmentOutput(highp int index, highp vec4 value) {
            #if {X} > 0 && PREPASS_MESH_BLEND_TAG_INDEX != 0
                if (index == 0) { glFragData0 = value; }
            #endif
            #if {X} > 1 && PREPASS_MESH_BLEND_TAG_INDEX != 1
                if (index == 1) { glFragData1 = value; }
            #endif
            #if {X} > 2 && PREPASS_MESH_BLEND_TAG_INDEX != 2
                if (index == 2) { glFragData2 = value; }
            #endif
            #if {X} > 3 && PREPASS_MESH_BLEND_TAG_INDEX != 3
                if (index == 3) { glFragData3 = value; }
            #endif
            #if {X} > 4 && PREPASS_MESH_BLEND_TAG_INDEX != 4
                if (index == 4) { glFragData4 = value; }
            #endif
            #if {X} > 5 && PREPASS_MESH_BLEND_TAG_INDEX != 5
                if (index == 5) { glFragData5 = value; }
            #endif
            #if {X} > 6 && PREPASS_MESH_BLEND_TAG_INDEX != 6
                if (index == 6) { glFragData6 = value; }
            #endif
            #if {X} > 7 && PREPASS_MESH_BLEND_TAG_INDEX != 7
                if (index == 7) { glFragData7 = value; }
            #endif
        }

        #define WRITE_GEOMETRY_FRAGMENT_OUTPUT(INDEX, VALUE) writeGeometryFragmentOutput(INDEX, VALUE)
    #else
        layout(location = 0) out highp vec4 glFragData[{X}];
        #define WRITE_GEOMETRY_FRAGMENT_OUTPUT(INDEX, VALUE) gl_FragData[INDEX] = VALUE
    #endif
highp vec4 gl_FragColor;
#ifndef PREPASS_CUSTOM_VARYINGS
#ifdef PREPASS_LOCAL_POSITION
    varying highp vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
    varying highp vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
    varying highp float vNormViewDepth;
#endif
#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(PREPASS_VELOCITY_ZERO)
    varying highp vec4 vCurrentPosition;
    varying highp vec4 vPreviousPosition;
#endif
#endif
#ifdef PREPASS_OBJECT_ID
    uniform highp float objectId;
    #include<objectIdFunctions>
#endif
#ifdef PREPASS_MESH_BLEND_TAG
    uniform highp int meshBlendTag;
#endif

#endif
