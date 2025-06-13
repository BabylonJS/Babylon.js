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
            uniform vec3 _color1_;
            uniform vec3 _color2_;`,
        const: `            const int _POINT_COUNT_ = 8;
            const float _speed_ = -0.5;
            const float _len_ = 0.25;
            const float _scale_ = 0.012;
            const float _intensity_ = 1.1;
            const float _radius_ = 0.015;`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_sdBezier_",
                code: `
                    float _sdBezier_(vec2 pos, vec2 A, vec2 B, vec2 C){    
                        vec2 a = B - A;
                        vec2 b = A - 2.0*B + C;
                        vec2 c = a * 2.0;
                        vec2 d = A - pos;
                    
                        float kk = 1.0 / dot(b,b);
                        float kx = kk * dot(a,b);
                        float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
                        float kz = kk * dot(d,a);      
                    
                        float res = 0.0;
                    
                        float p = ky - kx*kx;
                        float p3 = p*p*p;
                        float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
                        float h = q*q + 4.0*p3;
                    
                        if(h >= 0.0){ 
                            h = sqrt(h);
                            vec2 x = (vec2(h, -h) - q) / 2.0;
                            vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
                            float t = uv.x + uv.y - kx;
                            t = clamp( t, 0.0, 1.0 );
                    
                            // 1 root
                            vec2 qos = d + (c + b*t)*t;
                            res = length(qos);
                        }else{
                            float z = sqrt(-p);
                            float v = acos( q/(p*z*2.0) ) / 3.0;
                            float m = cos(v);
                            float n = sin(v)*1.732050808;
                            vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
                            t = clamp( t, 0.0, 1.0 );
                    
                            // 3 roots
                            vec2 qos = d + (c + b*t.x)*t.x;
                            float dis = dot(qos,qos);
                            
                            res = dis;
                    
                            qos = d + (c + b*t.y)*t.y;
                            dis = dot(qos,qos);
                            res = min(res,dis);
                    
                            qos = d + (c + b*t.z)*t.z;
                            dis = dot(qos,qos);
                            res = min(res,dis);
                    
                            res = sqrt( res );
                        }
                        
                        return res;
                    }
                    
                    `,
            },
            {
                name: "_getHeartPosition_",
                code: `
                    vec2 _getHeartPosition_(float t){
                        return vec2(16.0 * sin(t) * sin(t) * sin(t),
                                    -(13.0 * cos(t) - 5.0 * cos(2.0*t)
                                    - 2.0 * cos(3.0*t) - cos(4.0*t)));
                    }
                    
                    `,
            },
            {
                name: "_getGlow_",
                code: `
                    float _getGlow_(float dist, float _radius_, float _intensity_){
                        return pow(_radius_/dist, _intensity_);
                    }
                    
                    `,
            },
            {
                name: "_getSegment_",
                code: `
                    float _getSegment_(float t, vec2 pos, float offset){
                        vec2 points[_POINT_COUNT_];
                    	for(int i = 0; i < _POINT_COUNT_; i++){
                            points[i] = _getHeartPosition_(offset + float(i)*_len_ + fract(_speed_ * t) * 6.28);
                        }
                        
                        vec2 c = (points[0] + points[1]) / 2.0;
                        vec2 c_prev;
                    	float dist = 10000.0;
                        
                        for(int i = 0; i < _POINT_COUNT_-1; i++){
                            //https://tinyurl.com/y2htbwkm
                            c_prev = c;
                            c = (points[i] + points[i+1]) / 2.0;
                            dist = min(dist, _sdBezier_(pos, _scale_ * c_prev, _scale_ * points[i], _scale_ * c));
                        }
                        return max(0.0, dist);
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV){ 
                        vec4 origColor = texture2D(_input_, vUV);
                        vec2 centre = vec2(0.5, 0.5);
                        vec2 pos = centre - vUV;
                        pos.y /= _aspectRatio_;
                        
                        //Shift upwards to centre heart
                        pos.y += 0.03;
                    	
                        float t = _time_;
                        
                        //Get first segment
                        float dist = _getSegment_(t, pos, 0.0);
                        float glow = _getGlow_(dist, _radius_, _intensity_);
                        
                        vec3 col = vec3(0.0, 0.0, 0.0);
                        
                        //White core
                        col += 10.0*vec3(smoothstep(0.006, 0.003, dist));
                        //Color1 glow
                        col += glow * _color1_;
                        float blend = glow;
                        
                        //Get second segment
                        dist = _getSegment_(t, pos, 3.4);
                        glow = _getGlow_(dist, _radius_, _intensity_);
                        
                        //White core
                        col += 10.0*vec3(smoothstep(0.006, 0.003, dist));
                        //Color2 glow
                        col += glow * _color2_;
                        blend = max(blend, glow);
                            
                        //Tone mapping
                        col = 1.0 - exp(-col);
                        
                        //Gamma
                        col = pow(col, vec3(0.4545));
                    
                        // Output to screen with blending
                        return mix(origColor, vec4(col, 1.), blend);
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
    color1: "color1",
    color2: "color2",
};
