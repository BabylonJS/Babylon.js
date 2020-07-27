precision highp float;

varying vec3 vPosition;
varying vec2 vUV;
varying vec2 tUV;

uniform float time;
uniform float spriteCount;
uniform sampler2D spriteSheet;
uniform vec2 spriteMapSize;

uniform vec2 outputSize;
uniform vec2 stageSize;

uniform sampler2D frameMap;
uniform sampler2D tileMaps[LAYERS];
uniform sampler2D animationMap;

uniform vec3 colorMul;

float mt;

const float fdStep = 1. / 4.;
const float aFrameSteps = 1. / MAX_ANIMATION_FRAMES;

mat4 getFrameData(float frameID){
    float fX = frameID / spriteCount;
    return mat4(
        texture2D(frameMap, vec2(fX, 0.), 0.),
        texture2D(frameMap, vec2(fX, fdStep * 1.), 0.),
        texture2D(frameMap, vec2(fX, fdStep * 2.), 0.),
        vec4(0.)
    );
}

void main(){
    vec4 color = vec4(0.);
    vec2 tileUV = fract(tUV);
    #ifdef FLIPU
        tileUV.y = 1.0 - tileUV.y;
    #endif

    vec2 tileID = floor(tUV);
    vec2 sheetUnits = 1. / spriteMapSize;
    float spriteUnits = 1. / spriteCount;
    vec2 stageUnits = 1. / stageSize;
    
    for(int i = 0; i < LAYERS; i++) {
        float frameID;
        #define LAYER_ID_SWITCH

        vec4 animationData = texture2D(animationMap, vec2((frameID + 0.5) / spriteCount, 0.), 0.); 
        
        if(animationData.y > 0.) {

            mt = mod(time*animationData.z, 1.0);
            for(float f = 0.; f < MAX_ANIMATION_FRAMES; f++){
                if(animationData.y > mt){
                    frameID = animationData.x;
                    break;
                }
                
                animationData = texture2D(animationMap, vec2((frameID + 0.5) / spriteCount, aFrameSteps * f), 0.); 
            }
        }

        //Get Animation Frame
        mat4 frameData = getFrameData(frameID + 0.5);
        vec2 frameSize = (frameData[0].wz) / spriteMapSize;
        vec2 offset = frameData[0].xy * sheetUnits;
        vec2 ratio = frameData[2].xy / frameData[0].wz;

        //rotated
        if (frameData[2].z == 1.){
            tileUV.xy = tileUV.yx;
        }

        if (i == 0){
            color = texture2D(spriteSheet, tileUV * frameSize+offset);
        } else {
            vec4 nc = texture2D(spriteSheet, tileUV * frameSize+offset);
            float alpha = min(color.a + nc.a, 1.0);
            vec3 mixed = mix(color.xyz, nc.xyz, nc.a);
            color = vec4(mixed, alpha);
        }
    }

    color.xyz *= colorMul;
    
    gl_FragColor = color;
}