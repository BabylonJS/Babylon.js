// From: https://www.shadertoy.com/view/4tsBD7
// keeping for reference the general formula for a disk
// fn diskIntersectWithBackFaceCulling(ro: vec3f, rd: vec3f, c: vec3f, n: vec3f, r: f32) -> f32 {
//     var d: f32 = dot(rd, n);
//     if(d > 0.0) { return 1e6; }
//     var o: vec3f = ro - c;
//     var t: f32 = -dot(n, o) / d;
//     var q: vec3f = o + rd * t;
//     return (dot(q, q) < r * r) ? t : 1e6;
// }
// optimized for a disk on the ground facing up
fn diskIntersectWithBackFaceCulling(ro: vec3f, rd: vec3f, c: vec3f, r: f32) -> f32 {
    var d: f32 = rd.y;
    if(d > 0.0) { return 1e6; }
    var o: vec3f = ro - c;
    var t: f32 = -o.y / d;
    var q: vec3f = o + rd * t;
    return select(1e6, t, (dot(q, q) < r * r));
}

// From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
fn sphereIntersect(ro: vec3f, rd: vec3f, ce: vec3f, ra: f32) -> vec2f {
    var oc: vec3f = ro - ce;
    var b: f32 = dot(oc, rd);
    var c: f32 = dot(oc, oc) - ra * ra;
    var h: f32 = b * b - c;

    if(h < 0.0) { return vec2f(-1., -1.); }

    h = sqrt(h);

    return vec2f(-b + h, -b - h);
}

// optimized for a sphere centered at the origin
fn sphereIntersectFromOrigin(ro: vec3f, rd: vec3f, ra: f32) -> vec2f {
    var b: f32 = dot(ro, rd);
    var c: f32 = dot(ro, ro) - ra * ra;
    var h: f32 = b * b - c;

    if(h < 0.0) { return vec2f(-1., -1.); }

    h = sqrt(h);

    return vec2f(-b + h, -b - h);
}