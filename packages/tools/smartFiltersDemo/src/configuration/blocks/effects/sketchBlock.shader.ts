import type { ShaderProgram } from "@babylonjs/smart-filters";

/**
 * The shader program for the block.
 */
export const shaderProgram: ShaderProgram = {
    vertex: undefined,
    fragment: {
        uniform: `
            uniform sampler2D _input_; // main
            uniform vec2 _resolution_;`,
        const: `            const int _AngleNum_ = 3;
            const int _SampNum_ = 16;
            const float _PI2_ = 6.28318530717959;
            const vec4 _C_ = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);`,
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
                name: "_getCol_",
                code: `
                    vec4 _getCol_(vec2 pos) {
                        // take aspect ratio into account
                        vec2 uv=((pos-_resolution_.xy*.5)/_resolution_.y*_resolution_.y)/_resolution_.xy+.5;
                        vec4 c1=texture(_input_,uv);
                        vec4 e=smoothstep(vec4(-0.05),vec4(-0.0),vec4(uv,vec2(1)-uv));
                        c1=mix(vec4(1,1,1,0),c1,e.x*e.y*e.z*e.w);
                        float d=clamp(dot(c1.xyz,vec3(-.5,1.,-.5)),0.0,1.0);
                        vec4 c2=vec4(.7);
                        return min(mix(c1,c2,1.8*d),.7);
                    }
                    
                    `,
            },
            {
                name: "_getColHT_",
                code: `
                    vec4 _getColHT_(vec2 pos) {
                     	return smoothstep(.95,1.05,_getCol_(pos)*.8+.2+_snoise_(pos*.7));
                    }
                    
                    `,
            },
            {
                name: "_getVal_",
                code: `
                    float _getVal_(vec2 pos) {
                        vec4 c=_getCol_(pos);
                     	return pow(dot(c.xyz,vec3(.333)),1.)*1.;
                    }
                    
                    `,
            },
            {
                name: "_getGrad_",
                code: `
                    vec2 _getGrad_(vec2 pos, float eps) {
                       	vec2 d=vec2(eps,0);
                        return vec2(
                            _getVal_(pos+d.xy)-_getVal_(pos-d.xy),
                            _getVal_(pos+d.yx)-_getVal_(pos-d.yx)
                        )/eps/2.;
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        vec2 fragCoord = vUV * _resolution_;
                        vec4 fragColor = vec4(0);
                    
                        vec2 pos = fragCoord+4.0*sin(vec2(1,1.7))*_resolution_.y/400.;
                        vec3 col = vec3(0);
                        vec3 col2 = vec3(0);
                        float sum=0.;
                        for(int i=0;i<_AngleNum_;i++)
                        {
                            float ang=_PI2_/float(_AngleNum_)*(float(i)+.8);
                            vec2 v=vec2(cos(ang),sin(ang));
                            for(int j=0;j<_SampNum_;j++)
                            {
                                vec2 dpos  = v.yx*vec2(1,-1)*float(j)*_resolution_.y/400.;
                                vec2 dpos2 = v.xy*float(j*j)/float(_SampNum_)*.5*_resolution_.y/400.;
                    	        vec2 g;
                                float fact;
                                float fact2;
                    
                                for(float s=-1.;s<=1.;s+=2.)
                                {
                                    vec2 pos2=pos+s*dpos+dpos2;
                                    vec2 pos3=pos+(s*dpos+dpos2).yx*vec2(1,-1)*2.;
                                	g=_getGrad_(pos2,.4);
                                	fact=dot(g,v)-.5*abs(dot(g,v.yx*vec2(1,-1)))/**(1.-_getVal_(pos2))*/;
                                	fact2=dot(normalize(g+vec2(.0001)),v.yx*vec2(1,-1));
                                    
                                    fact=clamp(fact,0.,.05);
                                    fact2=abs(fact2);
                                    
                                    fact*=1.-float(j)/float(_SampNum_);
                                	col += fact;
                                	col2 += fact2*_getColHT_(pos3).xyz;
                                	sum+=fact2;
                                }
                            }
                        }
                        col/=float(_SampNum_*_AngleNum_)*.75/sqrt(_resolution_.y);
                        col2/=sum;
                        col.x*=(.6+.8*_snoise_(pos*.7));
                        col.x=1.-col.x;
                        col.x*=col.x*col.x;
                    
                        float r=length(pos-_resolution_.xy*.5)/_resolution_.x;
                        float vign=1.-r*r*r;
                    	  fragColor = vec4(vec3(col.x*col2*vign),texture(_input_,vUV).a);
                    
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
    resolution: "resolution",
};
