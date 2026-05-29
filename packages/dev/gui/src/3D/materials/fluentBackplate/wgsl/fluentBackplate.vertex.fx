uniform world: mat4x4f;
uniform viewProjection: mat4x4f;
uniform cameraPosition: vec3f;

attribute position: vec3f;
attribute normal: vec3f;
#ifdef TANGENT
attribute tangent: vec3f;
#endif

uniform _Radius_: f32;
uniform _Line_Width_: f32;
uniform _Absolute_Sizes_: f32;
uniform _Filter_Width_: f32;
uniform _Radius_Top_Left_: f32;
uniform _Radius_Top_Right_: f32;
uniform _Radius_Bottom_Left_: f32;
uniform _Radius_Bottom_Right_: f32;
uniform _Blob_Position_: vec3f;
uniform _Blob_Intensity_: f32;
uniform _Blob_Near_Size_: f32;
uniform _Blob_Far_Size_: f32;
uniform _Blob_Near_Distance_: f32;
uniform _Blob_Far_Distance_: f32;
uniform _Blob_Fade_Length_: f32;
uniform _Blob_Pulse_: f32;
uniform _Blob_Fade_: f32;
uniform _Blob_Position_2_: vec3f;
uniform _Blob_Near_Size_2_: f32;
uniform _Blob_Pulse_2_: f32;
uniform _Blob_Fade_2_: f32;
uniform _Rate_: f32;
uniform _Highlight_Transform_: vec4f;
uniform _Angle_: f32;
uniform _Use_Global_Left_Index_: f32;
uniform _Use_Global_Right_Index_: f32;
uniform Global_Left_Index_Tip_Position: vec4f;
uniform Global_Right_Index_Tip_Position: vec4f;

varying vPosition: vec3f;
varying vNormal: vec3f;
varying vUV: vec2f;
varying vTangent: vec3f;
varying vBinormal: vec3f;
varying vColor: vec4f;
varying vExtra1: vec4f;
varying vExtra2: vec4f;
varying vExtra3: vec4f;

fn pickDir(degrees: f32, dirX: vec3f, dirY: vec3f) -> vec3f {
    let angle: f32 = degrees * 3.14159 / 180.0;
    return cos(angle) * dirX + sin(angle) * dirY;
}

fn moveVerts(anisotropy: f32, p: vec3f, radius: f32) -> array<vec4f, 2> {
    let uv: vec2f = p.xy * 2.0 + vec2f(0.5);
    let center: vec2f = clamp(uv, vec2f(0.0), vec2f(1.0));
    let delta: vec2f = uv - center;
    let r2: vec2f = 2.0 * vec2f(radius / anisotropy, radius);
    let newUV: vec2f = center + r2 * (uv - 2.0 * center + vec2f(0.5));
    let newP: vec3f = vec3f(newUV - vec2f(0.5), p.z);
    let radialGradient: f32 = 1.0 - length(delta) * 2.0;
    let radialDir: vec3f = vec3f(delta * r2, 0.0);
    return array<vec4f, 2>(vec4f(newP, radialGradient), vec4f(newUV, radialDir.xy));
}

fn relativeOrAbsoluteDetail(nominalRadius: f32, nominalLineWidth: f32, absoluteMeasurements: f32, height: f32) -> vec2f {
    var scale: f32 = 1.0;
    if (absoluteMeasurements > 0.5) {
        scale = 1.0 / height;
    }

    return vec2f(nominalRadius * scale, nominalLineWidth * scale);
}

fn edgeAAVertex(
    positionWorld: vec3f,
    positionObject: vec3f,
    normalObject: vec3f,
    eye: vec3f,
    radialGradient: f32,
    tangentObject: vec3f
) -> vec2f {
    let incident: vec3f = eye - positionWorld;
    let tangentWorld: vec3f = (uniforms.world * vec4f(tangentObject, 0.0)).xyz;
    var g: f32 = 1.0;
    if (dot(tangentWorld, incident) < 0.0) {
        g = 0.0;
    }

    if (normalObject.z == 0.0) {
        if (positionObject.z > 0.0) {
            return vec2f(g, 1.0);
        }

        return vec2f(1.0, g);
    }

    return vec2f(g + (1.0 - g) * radialGradient, 1.0);
}

fn pickRadius(radius: f32, topLeft: f32, topRight: f32, bottomLeft: f32, bottomRight: f32, positionObject: vec3f) -> f32 {
    var result: f32;
    if (positionObject.x < 0.0) {
        if (positionObject.y > 0.0) {
            result = topLeft;
        } else {
            result = bottomLeft;
        }
    } else {
        if (positionObject.y > 0.0) {
            result = topRight;
        } else {
            result = bottomRight;
        }
    }

    return result * radius;
}

fn blobVertex(
    positionWorld: vec3f,
    normalWorld: vec3f,
    tangentWorld: vec3f,
    binormalWorld: vec3f,
    blobPosition: vec3f,
    intensity: f32,
    blobNearSize: f32,
    blobFarSize: f32,
    blobNearDistance: f32,
    blobFarDistance: f32,
    blobFadeLength: f32,
    blobPulse: f32,
    blobFade: f32
) -> vec4f {
    let delta: vec3f = blobPosition - positionWorld;
    let dist: f32 = dot(normalWorld, delta);
    let lerpValue: f32 = clamp((abs(dist) - blobNearDistance) / (blobFarDistance - blobNearDistance), 0.0, 1.0);
    let fadeValue: f32 = 1.0 - clamp((abs(dist) - blobFarDistance) / blobFadeLength, 0.0, 1.0);
    let size: f32 = blobNearSize + (blobFarSize - blobNearSize) * lerpValue;
    let blobXY: vec2f = vec2f(dot(delta, tangentWorld), dot(delta, binormalWorld)) / (0.0001 + size);
    let fade: f32 = fadeValue * intensity * blobFade;
    let distance: f32 = (lerpValue * 0.5 + 0.5) * (1.0 - blobPulse);
    return vec4f(blobXY.x, blobXY.y, distance, fade);
}

fn roundRectVertex(uv: vec2f, radius: f32, margin: f32, anisotropy: f32, gradient1: f32, gradient2: f32) -> array<vec4f, 2> {
    let scaleXY: vec2f = vec2f(anisotropy, 1.0);
    let lineUV: vec2f = uv - vec2f(0.5);
    let rectUV: vec2f = lineUV * scaleXY;
    let rectParms: vec4f = vec4f(scaleXY * 0.5 - vec2f(radius) - vec2f(margin), gradient1, gradient2);
    return array<vec4f, 2>(vec4f(rectUV, lineUV), rectParms);
}

fn lineVertex(uv: vec2f, time: f32, rate: f32, highlightTransform: vec4f) -> vec3f {
    let angle2: f32 = (rate * time) * 2.0 * 3.1416;
    let sinAngle2: f32 = sin(angle2);
    let cosAngle2: f32 = cos(angle2);
    let xformUV: vec2f = uv * highlightTransform.xy + highlightTransform.zw;
    return vec3f(0.0, cosAngle2 * xformUV.x - sinAngle2 * xformUV.y, 0.0);
}

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let normalWorld: vec3f = normalize((uniforms.world * vec4f(vertexInputs.normal, 0.0)).xyz);
    let tangentWorld: vec3f = (uniforms.world * vec4f(vec3f(1.0, 0.0, 0.0), 0.0)).xyz;
    let tangentLength: f32 = length(tangentWorld);
    let tangentWorldN: vec3f = tangentWorld / tangentLength;
    let binormalWorld: vec3f = (uniforms.world * vec4f(vec3f(0.0, 1.0, 0.0), 0.0)).xyz;
    let binormalLength: f32 = length(binormalWorld);
    let binormalWorldN: vec3f = binormalWorld / binormalLength;
    let anisotropy: f32 = tangentLength / binormalLength;
    let blobPositionLeft: vec3f = mix(uniforms._Blob_Position_, uniforms.Global_Left_Index_Tip_Position.xyz, step(0.5, uniforms._Use_Global_Left_Index_));
    let blobPositionRight: vec3f = mix(uniforms._Blob_Position_2_, uniforms.Global_Right_Index_Tip_Position.xyz, step(0.5, uniforms._Use_Global_Right_Index_));
    let radiusMultiplier: f32 = pickRadius(uniforms._Radius_, uniforms._Radius_Top_Left_, uniforms._Radius_Top_Right_, uniforms._Radius_Bottom_Left_, uniforms._Radius_Bottom_Right_, vertexInputs.position);
    let normalDir: vec3f = pickDir(uniforms._Angle_, tangentWorldN, binormalWorldN);
    let detail: vec2f = relativeOrAbsoluteDetail(radiusMultiplier, uniforms._Line_Width_, uniforms._Absolute_Sizes_, binormalLength);
    let radius: f32 = detail.x;
    let lineWidth: f32 = detail.y;
    let moved: array<vec4f, 2> = moveVerts(anisotropy, vertexInputs.position, radius);
    let newP: vec3f = moved[0].xyz;
    let radialGradient: f32 = moved[0].w;
    let newUV: vec2f = moved[1].xy;
    let positionWorld: vec3f = (uniforms.world * vec4f(newP, 1.0)).xyz;

#ifdef BLOB_ENABLE
    let blobInfoLeft: vec4f = blobVertex(positionWorld, normalWorld, tangentWorldN, binormalWorldN, blobPositionLeft, uniforms._Blob_Intensity_, uniforms._Blob_Near_Size_, uniforms._Blob_Far_Size_, uniforms._Blob_Near_Distance_, uniforms._Blob_Far_Distance_, uniforms._Blob_Fade_Length_, uniforms._Blob_Pulse_, uniforms._Blob_Fade_);
#else
    let blobInfoLeft: vec4f = vec4f(0.0);
#endif

#ifdef BLOB_ENABLE_2
    let blobInfoRight: vec4f = blobVertex(positionWorld, normalWorld, tangentWorldN, binormalWorldN, blobPositionRight, uniforms._Blob_Intensity_, uniforms._Blob_Near_Size_2_, uniforms._Blob_Far_Size_, uniforms._Blob_Near_Distance_, uniforms._Blob_Far_Distance_, uniforms._Blob_Fade_Length_, uniforms._Blob_Pulse_2_, uniforms._Blob_Fade_2_);
#else
    let blobInfoRight: vec4f = vec4f(0.0);
#endif

#ifdef TANGENT
    let tangentObject: vec3f = vertexInputs.tangent;
#else
    let tangentObject: vec3f = vec3f(0.0);
#endif

#ifdef SMOOTH_EDGES
    let edgeGradient: vec2f = edgeAAVertex(positionWorld, vertexInputs.position, vertexInputs.normal, uniforms.cameraPosition, radialGradient, tangentObject);
#else
    let edgeGradient: vec2f = vec2f(1.0);
#endif

    let rectData: array<vec4f, 2> = roundRectVertex(newUV, radius, 0.0, anisotropy, edgeGradient.x, edgeGradient.y);
    let lineVx: vec3f = lineVertex(rectData[0].zw, 0.0, uniforms._Rate_, uniforms._Highlight_Transform_);

    vertexOutputs.position = uniforms.viewProjection * vec4f(positionWorld, 1.0);
    vertexOutputs.vPosition = positionWorld;
    vertexOutputs.vNormal = normalDir;
    vertexOutputs.vUV = rectData[0].xy;
    vertexOutputs.vTangent = lineVx;
    vertexOutputs.vBinormal = normalWorld;
    vertexOutputs.vColor = vec4f(radius, lineWidth, 0.0, 1.0);
    vertexOutputs.vExtra1 = rectData[1];
    vertexOutputs.vExtra2 = blobInfoLeft;
    vertexOutputs.vExtra3 = blobInfoRight;
}
