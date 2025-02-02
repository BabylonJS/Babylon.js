// From: https://www.shadertoy.com/view/4tsBD7
// keeping for reference the general formula for a disk
// float diskIntersectWithBackFaceCulling(vec3 ro, vec3 rd, vec3 c, vec3 n, float r) {
//     float d = dot(rd, n);
//     if(d > 0.0) { return 1e6; }
//     vec3 o = ro - c;
//     float t = -dot(n, o) / d;
//     vec3 q = o + rd * t;
//     return (dot(q, q) < r * r) ? t : 1e6;
// }
// optimized for a disk on the ground facing up
float diskIntersectWithBackFaceCulling(vec3 ro, vec3 rd, vec3 c, float r) {
    float d = rd.y;
    if(d > 0.0) { return 1e6; }
    vec3 o = ro - c;
    float t = -o.y / d;
    vec3 q = o + rd * t;
    return (dot(q, q) < r * r) ? t : 1e6;
}

// From: https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
vec2 sphereIntersect(vec3 ro, vec3 rd, vec3 ce, float ra) {
    vec3 oc = ro - ce;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - ra * ra;
    float h = b * b - c;
    if(h < 0.0) { return vec2(-1.0, -1.0); }
    h = sqrt(h);
    return vec2(-b + h, -b - h);
}

// optimized for a sphere centered at the origin
vec2 sphereIntersectFromOrigin(vec3 ro, vec3 rd, float ra) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - ra * ra;
    float h = b * b - c;

    if(h < 0.0) { return vec2(-1.0, -1.0); }

    h = sqrt(h);

    return vec2(-b + h, -b - h);
}