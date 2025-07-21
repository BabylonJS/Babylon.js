fn AMax3F1(x: f32, y: f32, z: f32) -> f32 {
    return max(x,max(y,z));
}

fn AMax3F3(x: vec3f, y: vec3f, z: vec3f) -> vec3f {
    return max(x,max(y,z));
}

fn AMin3F1(x: f32, y: f32, z: f32) -> f32 {
    return min(x,min(y,z));
}

fn AMin3F3(x: vec3f, y: vec3f, z: vec3f) -> vec3f {
    return min(x,min(y,z));
}

// Float approximations
fn APrxLoRcpF1(a: f32) -> f32 {
    return bitcast<f32>(u32(0x7ef07ebb)-bitcast<u32>(a));
}

fn APrxMedRcpF1(a: f32) -> f32 {
    let b=bitcast<f32>(u32(0x7ef19fff)-bitcast<u32>(a));
    return b*(-b*a+f32(2.0));
}

fn APrxLoRsqF1(a: f32) -> f32 {
    return bitcast<f32>(u32(0x5f347d74)-(bitcast<u32>(a)>>1));
}
