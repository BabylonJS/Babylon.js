import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform float _time_;
            uniform float _aspectRatio_;
            uniform vec3 _tint_;`,
        const: `            const float _eps_ = 0.001;
            const float _inversePi_ = 0.31830988618;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_noise_",
                code: `
                    vec2 _noise_(vec2 p) {
                        return fract(1234.1234 * sin(1234.1234 * (fract(1234.1234 * p) + p.yx)));
                    }
                    
                    `,
            },
            {
                name: "_heart_",
                code: `
                    float _heart_(vec2 p, float s) {
                        p /= s;
                        vec2 q = p;
                        q.x *= 0.5 + .5 * q.y;
                        q.y -= abs(p.x) * .63;
                        return (length(q) - .7) * s;
                    }
                    
                    `,
            },
            {
                name: "_hearts_",
                code: `
                    vec3 _hearts_(vec2 polar, float _time_) {
                        float l = clamp(polar.y, 0., 1.);
                        float tiling = _inversePi_ * 14.;
                        polar.y -= _time_;
                        vec2 polarID = (floor(polar * tiling));
                        
                        polar.x = polar.x + polarID.y * .03;
                        polar.x = mod(polar.x + 3.14159 * 2., 3.14159 * 2.);
                        polarID = floor(polar * tiling);
                        
                        polar = fract(polar * tiling);
                        
                        polar = polar * 2. - 1.;
                        vec2 n = _noise_(polarID + .1) * .75 + .25;
                        vec2 n2 = 2. * _noise_(polarID) - 1.;
                        vec2 offset = (1. - n.y) * n2;
                        float heartDist = _heart_(polar + offset, n.y * .6);
                        float a = smoothstep(.0, .1, n.x*n.x);
                        float heartGlow = (smoothstep(0., -_eps_, heartDist) * .5 * a) + (smoothstep(0.0, -0.4, heartDist) * .75);
                        vec3 finalColor = vec3(smoothstep(0., -.05, heartDist), 0., 0.) * a + heartGlow * _tint_;
                        return finalColor * step(0.45, _noise_(polarID + .4).x); // Return finalColor or vec3(0.) if no _heart_
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        vec4 bgColor = texture2D(_input_, vUV);
                        float dist = length(vUV - vec2(0.5));
                        vUV = vUV * 2.0 - 1.0;
                        vUV.x *= _aspectRatio_;
                        vec2 polar = vec2(atan(vUV.y, vUV.x), log(length(vUV)));
                        vec3 h = max(max(_hearts_(polar, _time_), 
                                         _hearts_(polar, _time_ * 0.3 + 3.)), 
                                     _hearts_(polar, _time_ * .2 + 5.)); // Combine three _heart_ shapes
                        float blend = step(_eps_, length(h)); // 1 if h is not vec3(0.), 0 otherwise
                        vec4 finalColor = mix(bgColor, vec4(h, 1.), blend);
                        finalColor.rgb = mix(finalColor.rgb, _tint_ * 0.6, smoothstep(0.2, 0.8, dist)); // Add vignette
                        return finalColor;
                    }
                    
                    `,
            },
        ],
    },
};

/**
 * The uniform names for this shader, to be used in the shader binding so
 * that the names are always in sync.
 */
export const uniforms = {
    input: "input",
    time: "time",
    aspectRatio: "aspectRatio",
    tint: "tint",
};
