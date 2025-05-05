varying vUV: vec2f;

var textureSampler: texture_2d<f32>;

#if defined(INITIAL)
var sourceTexture: texture_2d<f32>;
uniform texSize: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec2i(fragmentInputs.vUV * (uniforms.texSize - 1.0));

    let f1 = textureLoad(sourceTexture, coord, 0).r;
    let f2 = textureLoad(sourceTexture, coord + vec2i(1, 0), 0).r;
    let f3 = textureLoad(sourceTexture, coord + vec2i(1, 1), 0).r;
    let f4 = textureLoad(sourceTexture, coord + vec2i(0, 1), 0).r;

    let minz = min(min(min(f1, f2), f3), f4);
    #ifdef DEPTH_REDUX
        let maxz = max(max(max(sign(1.0 - f1) * f1, sign(1.0 - f2) * f2), sign(1.0 - f3) * f3), sign(1.0 - f4) * f4);
    #else
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
uniform texSize: vec2f;

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let coord = vec2i(fragmentInputs.vUV * vec2(uniforms.texSize - 1));
    let iTexSize = vec2i(uniforms.texSize);

    let f1 = textureLoad(textureSampler, coord % iTexSize, 0).rg;
    let f2 = textureLoad(textureSampler, (coord + vec2i(1, 0)) % iTexSize, 0).rg;
    let f3 = textureLoad(textureSampler, (coord + vec2i(1, 1)) % iTexSize, 0).rg;
    let f4 = textureLoad(textureSampler, (coord + vec2i(0, 1)) % iTexSize, 0).rg;

    let minz = min(f1.x, f2.x);
    let maxz = max(f1.y, f2.y);

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
