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
        const: `            const float _pi_ = acos(.1);
            const float _tau_ = 2.*_pi_;
            const float _planeDist_ = .5;
            const float _furthest_  = 16.;
            const float _fadeFrom_  = 8.;
            const vec2 _pathA_ = vec2(.31, .41);
            const vec2 _pathB_ = vec2(1.0, sqrt(0.5));
            const vec2 _k1_ = vec2(0.809016994375, -0.587785252292);
            const vec2 _k2_ = vec2(-_k1_.x, _k1_.y);
            const float _colp_ = _pi_*100.;
            const vec4 _U_ = vec4(0, 1, 2, 3);
            const mat3 _ACESInputMat_ = mat3(vec3(0.59719, 0.07600, 0.02840),vec3(0.35458, 0.90834, 0.13383),vec3(0.04823, 0.01566, 0.83777));
            const mat3 _ACESOutputMat_ = mat3(vec3( 1.60475, -0.10208, -0.00327),vec3(-0.53108,  1.10813, -0.07276),vec3(-0.07367, -0.00605,  1.07602));`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_RRTAndODTFit_",
                code: `
                    vec3 _RRTAndODTFit_(vec3 v) {
                        vec3 a = v * (v + 0.0245786) - 0.000090537;
                        vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
                        return a / b;
                    }
                    
                    `,
            },
            {
                name: "_ACESFitted_",
                code: `
                    vec3 _ACESFitted_(vec3 _color_) {
                        _color_ = _ACESInputMat_ * _color_;
                    
                        // Apply RRT and ODT
                        _color_ = _RRTAndODTFit_(_color_);
                    
                        _color_ = _ACESOutputMat_ * _color_;
                    
                        // Clamp to [0, 1]
                        _color_ = clamp(_color_, 0.0, 1.0);
                    
                        return _color_;
                    }
                    
                    `,
            },
            {
                name: "_rot_",
                code: `
                    mat2 _rot_(float a) {
                        return mat2(cos(a), sin(a), -sin(a), cos(a));
                    }
                    
                    `,
            },
            {
                name: "_offset_",
                code: `
                    vec3 _offset_(float z) {
                        return vec3(_pathB_*sin(_pathA_*z), z);
                    }
                    
                    `,
            },
            {
                name: "_doffset_",
                code: `
                    vec3 _doffset_(float z) {
                        return vec3(_pathA_*_pathB_*cos(_pathA_*z), 1.0);
                    }
                    
                    `,
            },
            {
                name: "_ddoffset_",
                code: `
                    vec3 _ddoffset_(float z) {
                        return vec3(-_pathA_*_pathA_*_pathB_*sin(_pathA_*z), 0.0);
                    }
                    
                    `,
            },
            {
                name: "_alphaBlend_",
                code: `
                    vec4 _alphaBlend_(vec4 back, vec4 front) {
                        // Based on: https://en.wikipedia.org/wiki/Alpha_compositing
                        float w = front.w + back.w*(1.0-front.w);
                        vec3 xyz = (front.xyz*front.w + back.xyz*back.w*(1.0-front.w))/w;
                        return w > 0.0 ? vec4(xyz, w) : vec4(0.0);
                    }
                    
                    `,
            },
            {
                name: "_pmin_",
                code: `
                    float _pmin_(float a, float b, float k) {
                        float h = clamp(0.5+0.5*(b-a)/k, 0.0, 1.0);
                        return mix(b, a, h) - k*h*(1.0-h);
                    }
                    
                    `,
            },
            {
                name: "_pmax_",
                code: `
                    float _pmax_(float a, float b, float k) {
                        return -_pmin_(-a, -b, k);
                    }
                    
                    `,
            },
            {
                name: "_pabs_",
                code: `
                    float _pabs_(float a, float k) {
                        return -_pmin_(a, -a, k);
                    }
                    
                    `,
            },
            {
                name: "_star5_",
                code: `
                    float _star5_(vec2 p, float r, float rf, float sm) {
                        p = -p;
                        p.x = abs(p.x);
                        p -= 2.0*max(dot(_k1_,p),0.0)*_k1_;
                        p -= 2.0*max(dot(_k2_,p),0.0)*_k2_;
                        p.x = _pabs_(p.x, sm);
                        p.y -= r;
                        vec2 ba = rf*vec2(-_k1_.y,_k1_.x) - vec2(0,1);
                        float h = clamp( dot(p,ba)/dot(ba,ba), 0.0, r );
                        return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y);
                    }
                    
                    `,
            },
            {
                name: "_palette_",
                code: `
                    vec3 _palette_(float n) {
                        return 0.5+0.5*sin(vec3(0.,1.,2.)+n);
                    }
                    
                    `,
            },
            {
                name: "_plane_",
                code: `
                    vec4 _plane_(vec3 ro, vec3 rd, vec3 pp, vec3 npp, float pd, vec3 cp, vec3 off, float n) {
                        float aa = 3.*pd*distance(pp.xy, npp.xy);
                        vec4 col = vec4(0.);
                        vec2 p2 = pp.xy;
                        p2 -= _offset_(pp.z).xy;
                        vec2 doff   = _ddoffset_(pp.z).xz;
                        vec2 ddoff  = _doffset_(pp.z).xz;
                        float dd = dot(doff, ddoff);
                        p2 *= _rot_(dd*_pi_*5.);
                    
                        float d0 = _star5_(p2, 0.45, 1.6,0.2)-0.02;
                        float d1 = d0-0.01;
                        float d2 = length(p2);
                        float colaa = aa*200.;
                    
                        col.xyz = _palette_(0.5*n+2.*d2)*mix(0.5/(d2*d2), 1., smoothstep(-0.5+colaa, 0.5+colaa, sin(d2*_colp_)))/max(3.*d2*d2, 1E-1);
                        col.xyz = mix(col.xyz, vec3(2.), smoothstep(aa, -aa, d1)); 
                        col.w = smoothstep(aa, -aa, -d0);
                        return col;
                    }
                    
                    `,
            },
            {
                name: "_color_",
                code: `
                    vec3 _color_(vec3 ww, vec3 uu, vec3 vv, vec3 ro, vec2 p) {
                        float lp = length(p);
                        vec2 np = p + 1./_resolution_.xy;
                        float rdd = 2.0-0.25;
                    
                        vec3 rd = normalize(p.x*uu + p.y*vv + rdd*ww);
                        vec3 nrd = normalize(np.x*uu + np.y*vv + rdd*ww);
                    
                        float nz = floor(ro.z / _planeDist_);
                    
                        vec4 acol = vec4(0.0);
                    
                        vec3 aro = ro;
                        float apd = 0.0;
                    
                        for (float i = 1.; i <= _furthest_; ++i) {
                        if ( acol.w > 0.95) {
                            // Debug col to see when exiting
                            // acol.xyz = _palette_(i); 
                            break;
                        }
                        float pz = _planeDist_*nz + _planeDist_*i;
                    
                        float lpd = (pz - aro.z)/rd.z;
                        float npd = (pz - aro.z)/nrd.z;
                        float cpd = (pz - aro.z)/ww.z;
                    
                        {
                            vec3 pp = aro + rd*lpd;
                            vec3 npp= aro + nrd*npd;
                            vec3 cp = aro+ww*cpd;
                    
                            apd += lpd;
                    
                            vec3 off = _offset_(pp.z);
                    
                            float dz = pp.z-ro.z;
                            float fadeIn = smoothstep(_planeDist_*_furthest_, _planeDist_*_fadeFrom_, dz);
                            float fadeOut = smoothstep(0., _planeDist_*.1, dz);
                            float fadeOutRI = smoothstep(0., _planeDist_*1.0, dz);
                    
                            float ri = mix(1.0, 0.9, fadeOutRI*fadeIn);
                    
                            vec4 pcol = _plane_(ro, rd, pp, npp, apd, cp, off, nz+i);
                    
                            pcol.w *= fadeOut*fadeIn;
                            acol = _alphaBlend_(pcol, acol);
                            aro = pp;
                        }
                    
                        }
                    
                        return acol.xyz*acol.w;
                    
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        vec2 pp = -1.0+2.0*vUV;
                        vec2 p = pp;
                        p.x *= _resolution_.x/_resolution_.y; // aspect ratio
                    
                        float tm  = _planeDist_*_time_;
                    
                        vec3 ro   = _offset_(tm);
                        vec3 dro  = _doffset_(tm);
                        vec3 ddro = _ddoffset_(tm);
                    
                        vec3 ww = normalize(dro);
                        vec3 uu = normalize(cross(_U_.xyx+ddro, ww));
                        vec3 vv = cross(ww, uu);
                    
                        vec3 col = _color_(ww, uu, vv, ro, p);
                        col = _ACESFitted_(col);
                        col = sqrt(col);
                        return vec4(col, 1);
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
