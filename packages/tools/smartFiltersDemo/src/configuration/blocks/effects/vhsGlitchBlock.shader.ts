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
            uniform vec2 _resolution_;`,
        const: `            const vec4 _C_ = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_mod289_",
                code: `
                    vec3 _mod289_(vec3 x) {
                      return x - floor(x * (1.0 / 289.0)) * 289.0;
                    }
                    
                    `,
            },
            {
                name: "_mod289_",
                code: `
                    vec2 _mod289_(vec2 x) {
                      return x - floor(x * (1.0 / 289.0)) * 289.0;
                    }
                    
                    `,
            },
            {
                name: "_permute_",
                code: `
                    vec3 _permute_(vec3 x) {
                      return _mod289_(((x*34.0)+1.0)*x);
                    }
                    
                    `,
            },
            {
                name: "_snoise_",
                code: `
                    float _snoise_(vec2 v) {
                      // First corner
                      vec2 i  = floor(v + dot(v, _C_.yy) );
                      vec2 x0 = v -   i + dot(i, _C_.xx);
                    
                      // Other corners
                      vec2 i1;
                      //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
                      //i1.y = 1.0 - i1.x;
                      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                      // x0 = x0 - 0.0 + 0.0 * _C_.xx ;
                      // x1 = x0 - i1 + 1.0 * _C_.xx ;
                      // x2 = x0 - 1.0 + 2.0 * _C_.xx ;
                      vec4 x12 = x0.xyxy + _C_.xxzz;
                      x12.xy -= i1;
                    
                      // Permutations
                      i = _mod289_(i); // Avoid truncation effects in permutation
                      vec3 p = _permute_( _permute_( i.y + vec3(0.0, i1.y, 1.0 ))
                        + i.x + vec3(0.0, i1.x, 1.0 ));
                    
                      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                      m = m*m ;
                      m = m*m ;
                    
                      // Gradients: 41 points uniformly over a line, mapped onto a diamond.
                      // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
                    
                      vec3 x = 2.0 * fract(p * _C_.www) - 1.0;
                      vec3 h = abs(x) - 0.5;
                      vec3 ox = floor(x + 0.5);
                      vec3 a0 = x - ox;
                    
                      // Normalise gradients implicitly by scaling m
                      // Approximation of: m *= inversesqrt( a0*a0 + h*h );
                      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    
                      // Compute final noise value at P
                      vec3 g;
                      g.x  = a0.x  * x0.x  + h.x  * x0.y;
                      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                      return 130.0 * dot(m, g);
                    }
                    
                    `,
            },
            {
                name: "_rand_",
                code: `
                    float _rand_(vec2 co) {
                      return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                      vec2 uv = vUV;  
                      vec2 fragCoord = uv * _resolution_.xy;
                    
                      // Create large, incidental noise waves
                      float noise = max(0.0, _snoise_(vec2(_time_, uv.y * 0.3)) - 0.3) * (1.0 / 0.7);
                    
                      // Offset by smaller, constant noise waves
                      noise = noise + (_snoise_(vec2(_time_*10.0, uv.y * 2.4)) - 0.5) * 0.15;
                    
                      // Apply the noise as x displacement for every line
                      float xpos = uv.x - noise * noise * 0.25;
                      vec4 fragColor = texture(_input_, vec2(xpos, uv.y));
                    
                      // Mix in some random interference for lines
                      fragColor.rgb = mix(fragColor.rgb, vec3(_rand_(vec2(uv.y * _time_))), noise * 0.3).rgb;
                    
                      // Apply a line pattern every 4 pixels
                      if (floor(mod(fragCoord.y * 0.25, 2.0)) == 0.0)
                      {
                        fragColor.rgb *= 1.0 - (0.15 * noise);
                      }
                    
                      // Shift green/blue channels (using the red channel)
                      fragColor.g = mix(fragColor.r, texture(_input_, vec2(xpos + noise * 0.05, uv.y)).g, 0.25);
                      fragColor.b = mix(fragColor.r, texture(_input_, vec2(xpos - noise * 0.05, uv.y)).b, 0.25);
                    
                      return fragColor;
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
    resolution: "resolution",
};
