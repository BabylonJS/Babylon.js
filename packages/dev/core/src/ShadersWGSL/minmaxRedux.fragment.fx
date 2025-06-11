varying vUV: vec2f;

var textureSampler: texture_2d<f32>;

#if defined(INITIAL)
uniform texSize: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec2i(fragmentInputs.vUV * (uniforms.texSize - 1.0));

    let f1 = textureLoad(textureSampler, coord, 0).r;
    let f2 = textureLoad(textureSampler, coord + vec2i(1, 0), 0).r;
    let f3 = textureLoad(textureSampler, coord + vec2i(1, 1), 0).r;
    let f4 = textureLoad(textureSampler, coord + vec2i(0, 1), 0).r;

     #ifdef DEPTH_REDUX
        #ifdef VIEW_DEPTH
            // depth is camera view depth, ranging from near to far clip planes.
            // 0 is the clear depth value, so we must not consider it when calculating min depth.
            var minz = 3.4e38;

            if (f1 != 0.0) { minz = f1; }
            if (f2 != 0.0) { minz = min(minz, f2); }
            if (f3 != 0.0) { minz = min(minz, f3); }
            if (f4 != 0.0) { minz = min(minz, f4); }

            let maxz = max(max(max(f1, f2), f3), f4);
        #else
            // depth is either normalized view depth or screen space depth, ranging from 0 to 1
            let minz = min(min(min(f1, f2), f3), f4);

            // 1 is the clear depth value, so we must not consider it, hence sign(1.0 - f) * f which will result in 0 if f is 1.0
            let maxz = max(max(max(sign(1.0 - f1) * f1, sign(1.0 - f2) * f2), sign(1.0 - f3) * f3), sign(1.0 - f4) * f4);
        #endif
    #else
        let minz = min(min(min(f1, f2), f3), f4);
        let maxz = max(max(max(f1, f2), f3), f4);
    #endif

    fragmentOutputs.color = vec4f(minz, maxz, 0., 0.);
}

#elif defined(MAIN)
uniform texSize: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec2i(fragmentInputs.vUV * (uniforms.texSize - 1.0));

    let f1 = textureLoad(textureSampler, coord, 0).rg;
    let f2 = textureLoad(textureSampler, coord + vec2i(1, 0), 0).rg;
    let f3 = textureLoad(textureSampler, coord + vec2i(1, 1), 0).rg;
    let f4 = textureLoad(textureSampler, coord + vec2i(0, 1), 0).rg;

    let minz = min(min(min(f1.x, f2.x), f3.x), f4.x);
    let maxz = max(max(max(f1.y, f2.y), f3.y), f4.y);

    fragmentOutputs.color = vec4(minz, maxz, 0., 0.);
}

#elif defined(ONEBEFORELAST)
uniform texSize: vec2i;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec2i(fragmentInputs.vUV * vec2f(uniforms.texSize - 1));

    let f1 = textureLoad(textureSampler, coord % uniforms.texSize, 0).rg;
    let f2 = textureLoad(textureSampler, (coord + vec2i(1, 0)) % uniforms.texSize, 0).rg;
    let f3 = textureLoad(textureSampler, (coord + vec2i(1, 1)) % uniforms.texSize, 0).rg;
    let f4 = textureLoad(textureSampler, (coord + vec2i(0, 1)) % uniforms.texSize, 0).rg;

    let minz = min(min(min(f1.x, f2.x), f3.x), f4.x);
    let maxz = max(max(max(f1.y, f2.y), f3.y), f4.y);

    fragmentOutputs.color = vec4(minz, maxz, 0., 0.);
}

#elif defined(LAST)
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    fragmentOutputs.color = vec4f(0.);
    if (true) { // do not remove, else you will get a "warning: code is unreachable" error!
        discard;
    }
}
#endif
