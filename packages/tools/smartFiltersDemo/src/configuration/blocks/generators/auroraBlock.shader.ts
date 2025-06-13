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
        const: `            const mat2 _m2_ = mat2(0.95534, 0.29552, -0.29552, 0.95534);`,
        mainInputTexture: "_input_",
        mainFunctionName: "_mainImage_",
        functions: [
            {
                name: "_mm2_",
                code: `
                    mat2 _mm2_(in float a){
                        float c = cos(a);
                        float s = sin(a);
                        return mat2(c,s,-s,c);
                    }
                    
                    `,
            },
            {
                name: "_tri_",
                code: `
                    float _tri_(in float x){
                        return clamp(abs(fract(x)-.5),0.01,0.49);
                    }
                    
                    `,
            },
            {
                name: "_tri2_",
                code: `
                    vec2 _tri2_(in vec2 p){
                        return vec2(_tri_(p.x)+_tri_(p.y),_tri_(p.y+_tri_(p.x)));
                    }
                    
                    `,
            },
            {
                name: "_triNoise2d_",
                code: `
                    float _triNoise2d_(in vec2 p, float spd) {
                        float z=1.8;
                        float z2=2.5;
                    	float rz = 0.;
                        p *= _mm2_(p.x*0.06);
                        vec2 bp = p;
                    	for (float i=0.; i<5.; i++ )
                    	{
                            vec2 dg = _tri2_(bp*1.85)*.75;
                            dg *= _mm2_(_time_*spd);
                            p -= dg/z2;
                    
                            bp *= 1.3;
                            z2 *= .45;
                            z *= .42;
                    		p *= 1.21 + (rz-1.0)*.02;
                            
                            rz += _tri_(p.x+_tri_(p.y))*z;
                            p*= -_m2_;
                    	}
                        return clamp(1./pow(rz*29., 1.3),0.,.55);
                    }
                    
                    `,
            },
            {
                name: "_hash21_",
                code: `
                    float _hash21_(in vec2 n){ 
                        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); 
                    }
                    
                    `,
            },
            {
                name: "_aurora_",
                code: `
                    vec4 _aurora_(vec3 ro, vec3 rd) {
                        vec4 col = vec4(0);
                        vec4 avgCol = vec4(0);
                        
                        for(float i=0.;i<50.;i++)
                        {
                            float of = 0.006*_hash21_(gl_FragCoord.xy)*smoothstep(0.,15., i);
                            float pt = ((.8+pow(i,1.4)*.002)-ro.y)/(rd.y*2.+0.4);
                            pt -= of;
                        	vec3 bpos = ro + pt*rd;
                            vec2 p = bpos.zx;
                            float rzt = _triNoise2d_(p, 0.06);
                            vec4 col2 = vec4(0,0,0, rzt);
                            col2.rgb = (sin(1.-vec3(2.15,-.5, 1.2)+i*0.043)*0.5+0.5)*rzt;
                            avgCol =  mix(avgCol, col2, .5);
                            col += avgCol*exp2(-i*0.065 - 2.5)*smoothstep(0.,5., i);
                            
                        }
                        
                        col *= (clamp(rd.y*15.+.4,0.,1.));
                        
                        
                        //return clamp(pow(col,vec4(1.3))*1.5,0.,1.);
                        //return clamp(pow(col,vec4(1.7))*2.,0.,1.);
                        //return clamp(pow(col,vec4(1.5))*2.5,0.,1.);
                        //return clamp(pow(col,vec4(1.8))*1.5,0.,1.);
                        
                        //return smoothstep(0.,1.1,pow(col,vec4(1.))*1.5);
                        return col*1.8;
                        //return pow(col,vec4(1.))*2.
                    }
                    
                    `,
            },
            {
                name: "_nmzHash33_",
                code: `
                    vec3 _nmzHash33_(vec3 q) {
                        uvec3 p = uvec3(ivec3(q));
                        p = p*uvec3(374761393U, 1103515245U, 668265263U) + p.zxy + p.yzx;
                        p = p.yzx*(p.zxy^(p >> 3U));
                        return vec3(p^(p >> 16U))*(1.0/vec3(0xffffffffU));
                    }
                    
                    `,
            },
            {
                name: "_stars_",
                code: `
                    vec3 _stars_(in vec3 p) {
                        vec3 c = vec3(0.);
                        float res = _resolution_.x*1.;
                        
                    	for (float i=0.;i<4.;i++)
                        {
                            vec3 q = fract(p*(.15*res))-0.5;
                            vec3 id = floor(p*(.15*res));
                            vec2 rn = _nmzHash33_(id).xy;
                            float c2 = 1.-smoothstep(0.,.6,length(q));
                            c2 *= step(rn.x,.0005+i*i*0.001);
                            c += c2*(mix(vec3(1.0,0.49,0.1),vec3(0.75,0.9,1.),rn.y)*0.1+0.9);
                            p *= 1.3;
                        }
                        return c*c*.8;
                    }
                    
                    `,
            },
            {
                name: "_bg_",
                code: `
                    vec3 _bg_(in vec3 rd) {
                        float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd)*0.5+0.5;
                        sd = pow(sd, 5.);
                        vec3 col = mix(vec3(0.05,0.1,0.2), vec3(0.1,0.05,0.2), sd);
                        return col*.63;
                    }
                    
                    `,
            },
            {
                name: "_mainImage_",
                code: `
                    vec4 _mainImage_(vec2 vUV) { 
                        vec4 fragColor = vec4(0.);
                        vec2 fragCoord = vUV * _resolution_;
                    	vec2 q = fragCoord.xy / _resolution_.xy;
                        vec2 p = q - 0.5;
                    	p.x*=_resolution_.x/_resolution_.y;
                        
                        vec3 ro = vec3(0,0,-6.7);
                        vec3 rd = normalize(vec3(p,1.3));
                        vec2 mo = vec2(0,0);
                        mo = (mo==vec2(-.5))?mo=vec2(-0.1,0.1):mo;
                    	mo.x *= _resolution_.x/_resolution_.y;
                        rd.yz *= _mm2_(mo.y);
                        rd.xz *= _mm2_(mo.x);
                        
                        vec3 col = vec3(0.);
                        vec3 brd = rd;
                        float fade = smoothstep(0.,0.01,abs(brd.y))*0.1+0.9;
                        
                        col = _bg_(rd)*fade;
                        
                        if (rd.y > 0.){
                            vec4 aur = smoothstep(0.,1.5,_aurora_(ro,rd))*fade;
                            col += _stars_(rd);
                            col = col*(1.-aur.a) + aur.rgb;
                        }
                        else //Reflections
                        {
                            rd.y = abs(rd.y);
                            col = _bg_(rd)*fade*0.6;
                            vec4 aur = smoothstep(0.0,2.5,_aurora_(ro,rd));
                            col += _stars_(rd)*0.1;
                            col = col*(1.-aur.a) + aur.rgb;
                            vec3 pos = ro + ((0.5-ro.y)/rd.y)*rd;
                            float nz2 = _triNoise2d_(pos.xz*vec2(.5,.7), 0.);
                            col += mix(vec3(0.2,0.25,0.5)*0.08,vec3(0.3,0.3,0.5)*0.7, nz2*0.4);
                        }
                        
                    	fragColor = vec4(col, 1.);
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
