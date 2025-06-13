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
            uniform float _fireworks_;
            uniform float _fireworkSparks_;`,
        const: `            const float _PI_ = 3.141592653589793;
            const float _EXPLOSION_DURATION_ = 20.;
            const float _EXPLOSION_SPEED_ = 5.;
            const float _EXPLOSION_RADIUS_THESHOLD_ = .06;
            const vec3 _MOD3_ = vec3(.1031,.11369,.13787);`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_hash31_",
                code: `
                    vec3 _hash31_(float p) {
                       vec3 p3 = fract(vec3(p) * _MOD3_);
                       p3 += dot(p3, p3.yzx + 19.19);
                       return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x));
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        float t = mod(_time_ + 10., 7200.);
                    	vec4 col = texture2D(_input_, vUV); 
                        vec4 sparkColor = vec4(0.);
                        vec2 origin = vec2(0.);
                    	vUV.x *= _aspectRatio_;
                        
                        for (float j = 0.; j < _fireworks_; ++j)
                        {
                            vec3 oh = _hash31_((j + 800.) * 641.6974);
                            origin = vec2(oh.x, oh.y) * .6 + .2; // .2 - .8 to avoid boundaries
                            origin.x *= _aspectRatio_;
                            // Change t value to randomize the spawning of explosions
                            t += (j + 1.) * 9.6491 * oh.z;
                            for (float i = 0.; i < _fireworkSparks_; ++i)
                        	{
                                vec3 h = _hash31_(j * 963.31 + i + 497.8943);
                                // random angle (0 - 2*_PI_)
                                float a = h.x * _PI_ * 2.;
                                // random radius scale for spawning points anywhere in a circle
                                float rScale = h.y * _EXPLOSION_RADIUS_THESHOLD_;
                                // explosion loop based on _time_
                                if (mod(t * _EXPLOSION_SPEED_, _EXPLOSION_DURATION_) > 2.)
                                {
                                    // random radius 
                                    float r = mod(t * _EXPLOSION_SPEED_, _EXPLOSION_DURATION_) * rScale;
                                    // explosion spark polar coords 
                                    vec2 sparkPos = vec2(r * cos(a), r * sin(a));
                                    // fake-ish gravity
                                    float foo = 0.04;
                                    float bar = (length(sparkPos) - (rScale - foo)) / foo;
                                    sparkPos.y -= pow(bar, 3.0) * 6e-5;
                                    // shiny spark particles
                                    float dist = length(vUV - sparkPos - origin);
                                    float spark = .00015 / pow(dist, 1.65);
                                    // Make the explosion spark shimmer/sparkle
                                    float sd = 2. * length(origin-sparkPos);
                                    float shimmer = max(0., sqrt(sd) * (sin((t + h.y * 2. * _PI_) * 20.)));
                                    float shimmerThreshold = _EXPLOSION_DURATION_ * .32;
                                    // fade the particles towards the end of explosion
                                    float fade = max(0., (_EXPLOSION_DURATION_ - 5.) * rScale - r);
                                    // mix it all together
                                    vec3 contribution = spark * mix(1., shimmer, smoothstep(shimmerThreshold * rScale,
                    					(shimmerThreshold + 1.) * rScale , r)) * fade * oh;
                                    contribution = clamp(contribution, 0., 1.);
                                    sparkColor.rgb += contribution;
                                    sparkColor.a += length(contribution) * 0.57735; // Base alpha off of "colorfulness"
                                }
                        	}
                        }
                        return mix(col, sparkColor, sparkColor.a);
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
    fireworks: "fireworks",
    fireworkSparks: "fireworkSparks",
};
