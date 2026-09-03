fn encodeObjectId(objectId: f32) -> vec4f {
#ifdef PREPASS_OBJECT_ID_R8
    return vec4f(objectId / 255.0, 0.0, 0.0, 1.0);
#else
    let id = i32(objectId + 0.5);
    let encodedId = vec3f(
        f32((id >> 16) & 0xFF),
        f32((id >> 8) & 0xFF),
        f32(id & 0xFF)
    ) / 255.0;

    return vec4f(encodedId, select(0.0, 1.0, id > 0));
#endif
}
