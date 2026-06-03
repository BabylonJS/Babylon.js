// Source: https://www.shadertoy.com/view/4lB3zz

uniform brightness: f32;
uniform persistence: f32;
uniform timeScale: f32;

varying vUV: vec2f;

fn hash22(input: vec2f) -> vec2f {
    var p = vec2f(dot(input, vec2f(127.1, 311.7)), dot(input, vec2f(269.5, 183.3)));
    p = -vec2f(1.0) + 2.0 * fract(sin(p) * 43758.5453123);
    return sin(p * 6.283 + uniforms.timeScale);
}

fn interpolationNoise(p: vec2f) -> f32 {
    let pi = floor(p);
    let pf = p - pi;

    let w = pf * pf * (vec2f(3.0) - 2.0 * pf);

    let f00 = dot(hash22(pi + vec2f(0.0, 0.0)), pf - vec2f(0.0, 0.0));
    let f01 = dot(hash22(pi + vec2f(0.0, 1.0)), pf - vec2f(0.0, 1.0));
    let f10 = dot(hash22(pi + vec2f(1.0, 0.0)), pf - vec2f(1.0, 0.0));
    let f11 = dot(hash22(pi + vec2f(1.0, 1.0)), pf - vec2f(1.0, 1.0));

    let xm1 = mix(f00, f10, w.x);
    let xm2 = mix(f01, f11, w.x);

    return mix(xm1, xm2, w.y);
}

fn perlinNoise2D(x: f32, y: f32) -> f32 {
    var sum = 0.0;
    var frequency = 0.0;
    var amplitude = 0.0;
    for (var i = 0; i < OCTAVES; i++) {
        frequency = pow(2.0, f32(i));
        amplitude = pow(uniforms.persistence, f32(i));
        sum = sum + interpolationNoise(vec2f(x * frequency, y * frequency)) * amplitude;
    }

    return sum;
}

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let x = abs(input.vUV.x);
    let y = abs(input.vUV.y);

    let noise = uniforms.brightness + (1.0 - uniforms.brightness) * perlinNoise2D(x, y);

    fragmentOutputs.color = vec4f(noise, noise, noise, 1.0);
}
