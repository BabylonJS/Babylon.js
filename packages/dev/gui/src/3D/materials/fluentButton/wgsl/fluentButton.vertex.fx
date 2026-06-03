uniform world: mat4x4f;
uniform viewProjection: mat4x4f;
uniform cameraPosition: vec3f;

attribute position: vec3f;
attribute normal: vec3f;
attribute uv: vec2f;
attribute tangent: vec3f;
attribute color: vec4f;

uniform _Edge_Width_: f32;
uniform _Proximity_Far_Distance_: f32;
uniform _Proximity_Near_Radius_: f32;
uniform _Proximity_Anisotropy_: f32;
uniform _Selection_Fuzz_: f32;
uniform _Selected_: f32;
uniform _Selection_Fade_: f32;
uniform _Selection_Fade_Size_: f32;
uniform _Selected_Distance_: f32;
uniform _Selected_Fade_Length_: f32;
uniform _Blob_Enable_: f32;
uniform _Blob_Position_: vec3f;
uniform _Blob_Intensity_: f32;
uniform _Blob_Near_Size_: f32;
uniform _Blob_Far_Size_: f32;
uniform _Blob_Near_Distance_: f32;
uniform _Blob_Far_Distance_: f32;
uniform _Blob_Fade_Length_: f32;
uniform _Blob_Inner_Fade_: f32;
uniform _Blob_Pulse_: f32;
uniform _Blob_Fade_: f32;
uniform _Blob_Enable_2_: f32;
uniform _Blob_Position_2_: vec3f;
uniform _Blob_Near_Size_2_: f32;
uniform _Blob_Inner_Fade_2_: f32;
uniform _Blob_Pulse_2_: f32;
uniform _Blob_Fade_2_: f32;
uniform _Active_Face_Dir_: vec3f;
uniform _Active_Face_Up_: vec3f;
uniform _Smooth_Active_Face_: f32;

uniform Use_Global_Left_Index: f32;
uniform Use_Global_Right_Index: f32;
uniform Global_Left_Index_Tip_Position: vec4f;
uniform Global_Right_Index_Tip_Position: vec4f;

varying vPosition: vec3f;
varying vNormal: vec3f;
varying vUV: vec2f;
varying vTangent: vec3f;
varying vBinormal: vec3f;
varying vColor: vec4f;
varying vExtra1: vec4f;

fn ramp2(start: vec2f, end: vec2f, x: vec2f) -> vec2f {
    return clamp((x - start) / (end - start), vec2f(0.0), vec2f(1.0));
}

fn computeSelection(
    blobPosition: vec3f,
    normal: vec3f,
    tangentDir: vec3f,
    bitangent: vec3f,
    faceCenter: vec3f,
    faceSize: vec2f,
    selectionFuzz: f32,
    farDistance: f32,
    fadeLength: f32
) -> f32 {
    let delta: vec3f = blobPosition - faceCenter;
    let absD: f32 = abs(dot(delta, normal));
    let fadeIn: f32 = 1.0 - clamp((absD - farDistance) / fadeLength, 0.0, 1.0);
    let blobCenterXY: vec2f = vec2f(dot(delta, tangentDir), dot(delta, bitangent));
    let innerFace: vec2f = faceSize * (1.0 - selectionFuzz) * 0.5;
    let selectPulse: vec2f = ramp2(-faceSize * 0.5, -innerFace, blobCenterXY) - ramp2(innerFace, faceSize * 0.5, blobCenterXY);
    return selectPulse.x * selectPulse.y * fadeIn;
}

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let blobPositionLeft: vec3f = mix(uniforms._Blob_Position_, uniforms.Global_Left_Index_Tip_Position.xyz, step(0.5, uniforms.Use_Global_Left_Index));
    let blobPositionRight: vec3f = mix(uniforms._Blob_Position_2_, uniforms.Global_Right_Index_Tip_Position.xyz, step(0.5, uniforms.Use_Global_Right_Index));
    let activeFaceCenter: vec3f = (uniforms.world * vec4f(uniforms._Active_Face_Dir_ * 0.5, 1.0)).xyz;
    let activeFaceDir: vec3f = normalize((uniforms.world * vec4f(uniforms._Active_Face_Dir_, 0.0)).xyz);

#ifdef RELATIVE_WIDTH
    let relativeScale: f32 = length((uniforms.world * vec4f(vec3f(0.0, 1.0, 0.0), 0.0)).xyz);
#else
    let relativeScale: f32 = 1.0;
#endif

    let tangentWorld: vec3f = (uniforms.world * vec4f(vertexInputs.tangent, 0.0)).xyz;
    let binormalObject: vec3f = cross(vertexInputs.normal, vertexInputs.tangent);
    let binormalWorld: vec3f = (uniforms.world * vec4f(binormalObject, 0.0)).xyz;
    let normalWorld: vec3f = (uniforms.world * vec4f(vertexInputs.normal, 0.0)).xyz;
    let normalWorldN: vec3f = normalize(normalWorld);
    let tangentWorldN: vec3f = normalize(tangentWorld);
    let binormalWorldN: vec3f = normalize(binormalWorld);
    let faceCenter: vec3f = (uniforms.world * vec4f(0.5 * vertexInputs.normal, 1.0)).xyz;
    let faceSize: vec2f = vec2f(length(tangentWorld), length(binormalWorld));

    let chosenBlobPosition: vec3f = mix(blobPositionLeft, blobPositionRight, vertexInputs.color.g);
    let chosenBlobEnable: f32 = mix(uniforms._Blob_Enable_, uniforms._Blob_Enable_2_, vertexInputs.color.g);
    let chosenBlobPulse: f32 = mix(uniforms._Blob_Pulse_, uniforms._Blob_Pulse_2_, vertexInputs.color.g);
    let chosenBlobFade: f32 = mix(uniforms._Blob_Fade_, uniforms._Blob_Fade_2_, vertexInputs.color.g);
    let chosenBlobNearSize: f32 = mix(uniforms._Blob_Near_Size_, uniforms._Blob_Near_Size_2_, vertexInputs.color.g);
    let chosenBlobInnerFade: f32 = mix(uniforms._Blob_Inner_Fade_, uniforms._Blob_Inner_Fade_2_, vertexInputs.color.g);

    let selectLeft: f32 = computeSelection(blobPositionLeft, normalWorldN, tangentWorldN, binormalWorldN, faceCenter, faceSize, uniforms._Selection_Fuzz_, uniforms._Selected_Distance_, uniforms._Selected_Fade_Length_);
    let selectRight: f32 = computeSelection(blobPositionRight, normalWorldN, tangentWorldN, binormalWorldN, faceCenter, faceSize, uniforms._Selection_Fuzz_, uniforms._Selected_Distance_, uniforms._Selected_Fade_Length_);
    let activeFaceAmount: f32 = max(0.0, dot(activeFaceDir, normalWorldN));
    let showSelection: f32 = mix(max(selectLeft, selectRight), 1.0, uniforms._Selected_) * activeFaceAmount;

    let upWorld: vec3f = normalize((uniforms.world * vec4f(uniforms._Active_Face_Up_, 0.0)).xyz);
    let edgeWidth: f32 = uniforms._Edge_Width_ * relativeScale;

    let boxEdges: vec3f = (uniforms.world * vec4f(vec3f(0.5), 0.0)).xyz;
    let boxMaxSize: f32 = length(boxEdges);
    let d1: f32 = dot(blobPositionLeft - activeFaceCenter, activeFaceDir);
    let d2: f32 = dot(blobPositionRight - activeFaceCenter, activeFaceDir);
    let projectedBlobLeft: vec3f = blobPositionLeft - d1 * activeFaceDir;
    let projectedBlobRight: vec3f = blobPositionRight - d2 * activeFaceDir;
    let nearestProxDist: f32 = sqrt(min(dot(projectedBlobLeft - activeFaceCenter, projectedBlobLeft - activeFaceCenter), dot(projectedBlobRight - activeFaceCenter, projectedBlobRight - activeFaceCenter)));
    let visibleWidth: f32 = edgeWidth * (1.0 - step(boxMaxSize + uniforms._Proximity_Near_Radius_, nearestProxDist)) * (1.0 - step(uniforms._Proximity_Far_Distance_, min(d1, d2)) * (1.0 - step(0.0001, showSelection)));

    let widths: vec2f = visibleWidth / faceSize;
    let px: f32 = dot(vertexInputs.position, vertexInputs.tangent);
    let py: f32 = dot(vertexInputs.position, binormalObject);
    let dx: f32 = 0.5 - abs(px);
    let dy: f32 = 0.5 - abs(py);
    let newX: f32 = (0.5 - dx * widths.x * 2.0) * sign(px);
    let newY: f32 = (0.5 - dy * widths.y * 2.0) * sign(py);
    let wirePosObject: vec3f = vertexInputs.normal * 0.5 + newX * vertexInputs.tangent + newY * binormalObject;
    let wireUV: vec2f = vec2f(dot(wirePosObject, vertexInputs.tangent) + 0.5, dot(wirePosObject, binormalObject) + 0.5);
    let wireWorldPos: vec3f = (uniforms.world * vec4f(wirePosObject, 1.0)).xyz;

    let hitDistance: f32 = dot(chosenBlobPosition - faceCenter, normalWorldN);
    let hitPosition: vec3f = chosenBlobPosition - hitDistance * normalWorldN;
    let absHitDistance: f32 = abs(hitDistance);
    let blobLerp: f32 = clamp((absHitDistance - uniforms._Blob_Near_Distance_) / (uniforms._Blob_Far_Distance_ - uniforms._Blob_Near_Distance_), 0.0, 1.0);
    let fadeIn: f32 = 1.0 - clamp((absHitDistance - uniforms._Blob_Far_Distance_) / uniforms._Blob_Fade_Length_, 0.0, 1.0);
    let innerFade: f32 = 1.0 - clamp(-hitDistance / chosenBlobInnerFade, 0.0, 1.0);
    let farClip: f32 = clamp(1.0 - step(uniforms._Blob_Far_Distance_ + uniforms._Blob_Fade_Length_, absHitDistance), 0.0, 1.0);
    let blobSize: f32 = mix(mix(chosenBlobNearSize, uniforms._Blob_Far_Size_, blobLerp) * farClip, uniforms._Selection_Fade_Size_, uniforms._Selection_Fade_) * innerFade * chosenBlobEnable;
    var blobInfo: vec3f = vec3f(blobLerp * 0.5 + 0.5, fadeIn * uniforms._Blob_Intensity_ * (1.0 - uniforms._Selection_Fade_) * chosenBlobFade, 0.0);
    blobInfo.x *= 1.0 - chosenBlobPulse;

    let blobDelta: vec3f = hitPosition - faceCenter;
    let blobCenterXY: vec2f = vec2f(dot(blobDelta, tangentWorldN), dot(blobDelta, binormalWorldN));
    let quadUV: vec2f = 2.0 * vertexInputs.uv - vec2f(1.0);
    let blobXY: vec2f = blobCenterXY + quadUV * blobSize;
    let blobClipped: vec2f = clamp(blobXY, -faceSize * 0.5, faceSize * 0.5);
    let blobUV: vec2f = (blobClipped - blobCenterXY) / max(blobSize, 0.0001) * 2.0;
    let blobWorldPos: vec3f = faceCenter + blobClipped.x * tangentWorldN + blobClipped.y * binormalWorldN;
    let outWorldPos: vec3f = mix(wireWorldPos, blobWorldPos, vertexInputs.color.r);
    let outUV: vec2f = mix(wireUV, blobUV, vertexInputs.color.r);

    let incident: vec3f = normalize(wireWorldPos - uniforms.cameraPosition);
    let ndotI: f32 = dot(incident, normalWorldN);
    let uvFlip: vec2f = vertexInputs.uv - vec2f(0.5);
    let uDot: f32 = dot(incident, tangentWorld) * uvFlip.x * ndotI;
    let vDot: f32 = -dot(incident, binormalWorld) * uvFlip.y * ndotI;
    let smoothAndActive: f32 = step(1.0, step(0.5, uniforms._Smooth_Active_Face_) * step(0.0001, activeFaceAmount));
    let uVal: f32 = mix(1.0 - step(0.0, uDot), max(1.0, 1.0 - step(0.0, uDot)), smoothAndActive);
    let vVal: f32 = mix(1.0 - step(0.0, vDot), max(1.0, 1.0 - step(0.0, vDot)), smoothAndActive);
    let holoEdges: vec4f = vec4f(1.0) - vec4f(uVal * vertexInputs.uv.x, uVal * (1.0 - vertexInputs.uv.x), vVal * vertexInputs.uv.y, vVal * (1.0 - vertexInputs.uv.y));

    let xDir: vec3f = normalize(cross(activeFaceDir, upWorld)) * uniforms._Proximity_Anisotropy_;
    let yDir: vec3f = cross(activeFaceDir, normalize(cross(activeFaceDir, upWorld)));
    let deltaLeft: vec3f = blobPositionLeft - wireWorldPos;
    let deltaRight: vec3f = blobPositionRight - wireWorldPos;
    let distLeft: f32 = abs(dot(deltaLeft, activeFaceDir));
    let distRight: f32 = abs(dot(deltaRight, activeFaceDir));
    let extra1: vec4f = vec4f(dot(deltaLeft, xDir), dot(deltaLeft, yDir), dot(deltaRight, xDir), dot(deltaRight, yDir)) / relativeScale;
    let distanceToFace: f32 = dot(activeFaceDir, wireWorldPos - activeFaceCenter);
    let intensity: f32 = 1.0 - clamp(min(distLeft, distRight) / uniforms._Proximity_Far_Distance_, 0.0, 1.0);

    vertexOutputs.position = uniforms.viewProjection * vec4f(outWorldPos, 1.0);
    vertexOutputs.vPosition = outWorldPos;
    vertexOutputs.vNormal = vec3f(widths.x, widths.y, vertexInputs.color.r);
    vertexOutputs.vUV = outUV;
    vertexOutputs.vTangent = blobInfo;
    vertexOutputs.vBinormal = vec3f(showSelection, distanceToFace, intensity);
    vertexOutputs.vColor = holoEdges;
    vertexOutputs.vExtra1 = extra1;
}
