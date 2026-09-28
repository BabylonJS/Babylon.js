#define DISABLE_UNIFORMITY_ANALYSIS

// Behavioral and parameter-model inspiration: https://meshblend.lervik.com/
// Technique background: https://www.jacktollenaar.top/articles/meshblending.html
// Performance considerations: https://www.jacktollenaar.top/articles/meshblending2.html
// OKLab conversion: https://bottosson.github.io/posts/oklab/

varying vUV: vec2f;

var textureSampler: texture_2d<f32>;
var meshBlendTagSampler: texture_2d<u32>;
var meshBlendDepthSampler: texture_2d<f32>;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
var meshBlendBaseColorSampler: texture_2d<f32>;
#endif
var meshBlendBlueNoiseSampler: texture_2d<f32>;

uniform projection: mat4x4f;
uniform inverseProjection: mat4x4f;
uniform inverseView: mat4x4f;
uniform blendWorldRadii: vec4f;
uniform minimumProjectedRadii: vec4f;
uniform meshBlendIsOrthographic: f32;
uniform slopeFactor: f32;

#ifndef MESH_BLEND_DIRECTION_COUNT
    #define MESH_BLEND_DIRECTION_COUNT 3
    #define MESH_BLEND_RADIAL_SAMPLE_COUNT 3
    #define MESH_BLEND_DIRECTION_REFINEMENT_SAMPLE_COUNT 2
    #define MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT 4
    #define MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT 8
    #define MESH_BLEND_RADIUS_SCALE 0.9
    #define MESH_BLEND_JITTER_FACTOR 0.5
    #define MESH_BLEND_COLOR_INTERPOLATION_OKLAB
#endif

#define MESH_BLEND_TWO_PI 6.283185307179586
#define MESH_BLEND_EPSILON 0.00001
#define MESH_BLEND_DIRECTION_REFINEMENT_SECTOR_SCALE 0.2
#define MESH_BLEND_TINY_OBJECT_PROBE_COUNT 8
#define MESH_BLEND_MIN_SLOPE_SCALE 0.25
#define MESH_BLEND_BOUNDARY_SEPARATION_FACTOR 0.75
#define MESH_BLEND_BOUNDARY_PIXEL_TOLERANCE 3.0
#define MESH_BLEND_FOREGROUND_DEPTH_FACTOR 0.35
#define MESH_BLEND_FOREGROUND_LATERAL_FACTOR 2.0
#define MESH_BLEND_TARGET_SPAN_FACTOR 1.5
#define MESH_BLEND_TOTAL_SPAN_FACTOR 2.5
#define MESH_BLEND_NEAR_EDGE_TARGET_WEIGHT 0.35
#define MESH_BLEND_NEAR_SEAM_MAX_DISTANCE 1.25
#define MESH_BLEND_NEAR_SEAM_COLOR_DELTA 0.02
#define MESH_BLEND_BASE_LUMINANCE_EPSILON 0.00001
#define MESH_BLEND_TARGET_DARKER_RATIO 0.65
#define MESH_BLEND_TARGET_NON_DARK_RATIO 0.9
#define MESH_BLEND_SHADOW_DIFFERENCE_LOW 0.15
#define MESH_BLEND_SHADOW_DIFFERENCE_HIGH 0.5
#define MESH_BLEND_SHADOW_MIN_ATTENUATION 0.25

#define MESH_BLEND_REJECTION_NONE 0
#define MESH_BLEND_REJECTION_NO_CANDIDATE 1
#define MESH_BLEND_REJECTION_NO_CONTINUATION 2
#define MESH_BLEND_REJECTION_INVALID_DEPTH 3
#define MESH_BLEND_REJECTION_DEPTH_SEPARATION 4
#define MESH_BLEND_REJECTION_FOREGROUND_BACKGROUND 5
#define MESH_BLEND_REJECTION_PHYSICAL_SPAN 6
#define MESH_BLEND_REJECTION_CONTACT_ANGLE 7

struct MeshBlendTag {
    groupId: u32,
    radiusClass: u32,
};

struct MeshBlendCandidate {
    targetGroupId: u32,
    radiusClass: u32,
    direction: vec2f,
    distancePixels: f32,
    searchRadiusPixels: f32,
    score: f32,
    valid: bool,
};

struct MeshBlendResult {
    candidate: MeshBlendCandidate,
    targetPixel: vec2i,
    targetFarPixel: vec2i,
    currentViewPosition: vec3f,
    effectiveRadiusPixels: f32,
    fade: f32,
    tinyObjectRadiusRatio: f32,
    rejectionReason: i32,
    stageReached: i32,
    valid: bool,
    continuationFound: bool,
    usedFallback: bool,
    tinyObjectRadiusReduced: bool,
};

struct MeshBlendTargetColorSamples {
    fartherColor: vec4f,
    boundaryPlusOneColor: vec4f,
    boundaryPlusTwoColor: vec4f,
    conservativeNearColor: vec4f,
    targetColor: vec4f,
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    fartherBaseColor: vec3f,
    conservativeNearBaseColor: vec3f,
#endif
    onePixelEdge: bool,
};

struct MeshBlendColorEvaluation {
    samples: MeshBlendTargetColorSamples,
    currentColor: vec4f,
    blendedColor: vec4f,
    #ifdef MESH_BLEND_DEBUG_WORLD_POSITION
    worldPosition: vec3f,
    #endif
    shadowAttenuation: f32,
    adjustedFade: f32,
    nearSeamCorrected: bool,
};

fn clampPixel(pixel: vec2i, renderSize: vec2i) -> vec2i {
    return clamp(pixel, vec2i(0), renderSize - vec2i(1));
}

fn isPixelInBounds(pixel: vec2i, renderSize: vec2i) -> bool {
    return pixel.x >= 0 && pixel.y >= 0 && pixel.x < renderSize.x && pixel.y < renderSize.y;
}

fn pixelToUv(pixel: vec2i, renderSize: vec2i) -> vec2f {
    return (vec2f(clampPixel(pixel, renderSize)) + vec2f(0.5)) / vec2f(renderSize);
}

fn loadMeshBlendTag(pixel: vec2i, renderSize: vec2i) -> MeshBlendTag {
    let packedTag: u32 = textureLoad(meshBlendTagSampler, clampPixel(pixel, renderSize), 0).r;
    var tag: MeshBlendTag;
    tag.groupId = packedTag & 0x3fu;
    tag.radiusClass = packedTag >> 6u;
    return tag;
}

fn loadMeshBlendDepth(pixel: vec2i, renderSize: vec2i) -> f32 {
    return textureLoad(meshBlendDepthSampler, clampPixel(pixel, renderSize), 0).r;
}

fn classValue(values: vec4f, index: u32) -> f32 {
    if (index == 0u) {
        return values.x;
    }
    if (index == 1u) {
        return values.y;
    }
    if (index == 2u) {
        return values.z;
    }
    return values.w;
}

fn meshBlendDepthToNdc(depth: f32) -> f32 {
#ifdef MESH_BLEND_DEPTH_SCREEN
    #ifdef IS_NDC_HALF_ZRANGE
        return depth;
    #else
        return depth * 2.0 - 1.0;
    #endif
#else
    let projectedDepth: vec4f = uniforms.projection * vec4f(0.0, 0.0, depth, 1.0);
    return projectedDepth.z / projectedDepth.w;
#endif
}

fn reconstructMeshBlendViewPosition(pixel: vec2i, renderSize: vec2i, depth: f32) -> vec3f {
    let ndcXY: vec2f = pixelToUv(pixel, renderSize) * 2.0 - 1.0;
    let viewPosition: vec4f = uniforms.inverseProjection * vec4f(ndcXY, meshBlendDepthToNdc(depth), 1.0);
    return viewPosition.xyz / viewPosition.w;
}

fn reconstructMeshBlendWorldPosition(viewPosition: vec3f) -> vec3f {
    return (uniforms.inverseView * vec4f(viewPosition, 1.0)).xyz;
}

fn isFiniteMeshBlendValue(value: f32) -> bool {
    return (bitcast<u32>(value) & 0x7f800000u) != 0x7f800000u;
}

fn isValidMeshBlendPosition(position: vec3f) -> bool {
    return isFiniteMeshBlendValue(position.x) && isFiniteMeshBlendValue(position.y) && isFiniteMeshBlendValue(position.z);
}

fn meshBlendProjectionScale(renderHeight: f32) -> f32 {
    return max(0.5 * renderHeight * abs(uniforms.projection[1][1]), MESH_BLEND_EPSILON);
}

fn searchRadiusForClass(radiusClass: u32, viewDepth: f32, renderHeight: f32) -> f32 {
    let projectionScale: f32 = meshBlendProjectionScale(renderHeight);
    var projectedWorldRadius: f32 = classValue(uniforms.blendWorldRadii, radiusClass) * projectionScale;
    if (uniforms.meshBlendIsOrthographic < 0.5) {
        projectedWorldRadius /= max(viewDepth, MESH_BLEND_EPSILON);
    }

    let scaledRadius: f32 = max(projectedWorldRadius, classValue(uniforms.minimumProjectedRadii, radiusClass)) * MESH_BLEND_RADIUS_SCALE;
    return select(0.0, max(1.0, scaledRadius), scaledRadius > 0.0);
}

fn worldUnitsPerPixel(viewDepth: f32, renderHeight: f32) -> f32 {
    let unitsPerPixel: f32 = 1.0 / meshBlendProjectionScale(renderHeight);
    if (uniforms.meshBlendIsOrthographic > 0.5) {
        return unitsPerPixel;
    }
    return unitsPerPixel * max(viewDepth, MESH_BLEND_EPSILON);
}

fn calculateSlopeScale(oppositeFacing: f32) -> f32 {
    if (uniforms.slopeFactor <= 1.0) {
        return 1.0;
    }

    return MESH_BLEND_MIN_SLOPE_SCALE +
        (1.0 - MESH_BLEND_MIN_SLOPE_SCALE) * pow(clamp(oppositeFacing, 0.0, 1.0), uniforms.slopeFactor - 1.0);
}

fn loadStableBlueNoise(pixel: vec2i) -> vec2f {
    let noiseSize: vec2i = vec2i(textureDimensions(meshBlendBlueNoiseSampler, 0));
    let wrappedPixel: vec2i = vec2i(pixel.x % noiseSize.x, pixel.y % noiseSize.y);
    return textureLoad(meshBlendBlueNoiseSampler, wrappedPixel, 0).rg;
}

fn directionAt(index: i32, rotation: f32, sectorAngle: f32, direction0: vec2f, direction1: vec2f, direction2: vec2f) -> vec2f {
#if MESH_BLEND_DIRECTION_COUNT == 3
    if (index == 0) {
        return direction0;
    }
    if (index == 1) {
        return direction1;
    }
    return direction2;
#else
    let angle: f32 = rotation + sectorAngle * f32(index);
    return vec2f(cos(angle), sin(angle));
#endif
}

fn invalidCandidate() -> MeshBlendCandidate {
    var candidate: MeshBlendCandidate;
    candidate.targetGroupId = 0u;
    candidate.radiusClass = 0u;
    candidate.direction = vec2f(0.0);
    candidate.distancePixels = 0.0;
    candidate.searchRadiusPixels = 0.0;
    candidate.score = -1.0;
    candidate.valid = false;
    return candidate;
}

fn invalidBlendResult() -> MeshBlendResult {
    var result: MeshBlendResult;
    result.candidate = invalidCandidate();
    result.targetPixel = vec2i(0);
    result.targetFarPixel = vec2i(0);
    result.currentViewPosition = vec3f(0.0);
    result.effectiveRadiusPixels = 0.0;
    result.fade = 0.0;
    result.tinyObjectRadiusRatio = 1.0;
    result.rejectionReason = MESH_BLEND_REJECTION_NO_CANDIDATE;
    result.stageReached = 1;
    result.valid = false;
    result.continuationFound = false;
    result.usedFallback = false;
    result.tinyObjectRadiusReduced = false;
    return result;
}

fn findInitialCandidate(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    currentSearchRadius: f32,
    viewDepth: f32,
    ignoredGroupId: u32,
    randomValues: vec2f,
    rotation: f32,
    sectorAngle: f32,
    direction0: vec2f,
    direction1: vec2f,
    direction2: vec2f
) -> MeshBlendCandidate {
    var best: MeshBlendCandidate = invalidCandidate();
    let radialJitter: f32 = mix(0.5, randomValues.y, MESH_BLEND_JITTER_FACTOR);

    for (var radialIndex: i32 = 0; radialIndex < MESH_BLEND_RADIAL_SAMPLE_COUNT; radialIndex++) {
        let normalizedDistance: f32 = (f32(radialIndex) + radialJitter) / f32(MESH_BLEND_RADIAL_SAMPLE_COUNT);
        let distancePixels: f32 = max(1.0, ceil(normalizedDistance * normalizedDistance * normalizedDistance * currentSearchRadius));

        for (var directionIndex: i32 = 0; directionIndex < MESH_BLEND_DIRECTION_COUNT; directionIndex++) {
            let direction: vec2f = directionAt(directionIndex, rotation, sectorAngle, direction0, direction1, direction2);
            let samplePixel: vec2i = pixel + vec2i(round(direction * distancePixels));
            let candidateTag: MeshBlendTag = loadMeshBlendTag(samplePixel, renderSize);

            if (candidateTag.groupId == 0u || candidateTag.groupId == currentTag.groupId || candidateTag.groupId == ignoredGroupId) {
                continue;
            }

            let seamRadiusClass: u32 = min(currentTag.radiusClass, candidateTag.radiusClass);
            let candidateSearchRadius: f32 = searchRadiusForClass(seamRadiusClass, viewDepth, f32(renderSize.y));
            if (distancePixels > candidateSearchRadius) {
                continue;
            }

            let score: f32 = 1.0 - clamp(distancePixels / max(candidateSearchRadius, MESH_BLEND_EPSILON), 0.0, 1.0);
            if (score > best.score) {
                best.targetGroupId = candidateTag.groupId;
                best.radiusClass = seamRadiusClass;
                best.direction = direction;
                best.distancePixels = distancePixels;
                best.searchRadiusPixels = candidateSearchRadius;
                best.score = score;
                best.valid = true;
            }
        }

        if (best.valid) {
            break;
        }
    }

    return best;
}

fn refineCandidateDirection(pixel: vec2i, renderSize: vec2i, candidate: MeshBlendCandidate, randomValues: vec2f) -> MeshBlendCandidate {
    var refinedCandidate: MeshBlendCandidate = candidate;
    if (refinedCandidate.distancePixels <= 2.0) {
        return refinedCandidate;
    }

    let centerAngle: f32 = atan2(refinedCandidate.direction.y, refinedCandidate.direction.x);
    let angularHalfWidth: f32 = (MESH_BLEND_TWO_PI / f32(MESH_BLEND_DIRECTION_COUNT)) * MESH_BLEND_DIRECTION_REFINEMENT_SECTOR_SCALE;
    let stepSize: f32 = max(1.0, refinedCandidate.distancePixels / f32(MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT + 1));

    for (var sampleIndex: i32 = 0; sampleIndex < MESH_BLEND_DIRECTION_REFINEMENT_SAMPLE_COUNT; sampleIndex++) {
        let sampleRandom: f32 = fract(randomValues.y + randomValues.x * 0.754877666 + f32(sampleIndex) * 0.618033989);
        let angle: f32 = centerAngle + mix(-angularHalfWidth, angularHalfWidth, sampleRandom);
        let direction: vec2f = vec2f(cos(angle), sin(angle));
        var testDistance: f32 = refinedCandidate.distancePixels - stepSize;

        for (var stepIndex: i32 = 0; stepIndex < MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT; stepIndex++) {
            if (testDistance <= 0.0) {
                break;
            }

            let samplePixel: vec2i = pixel + vec2i(round(direction * testDistance));
            let sampleTag: MeshBlendTag = loadMeshBlendTag(samplePixel, renderSize);
            if (sampleTag.groupId != refinedCandidate.targetGroupId) {
                break;
            }

            refinedCandidate.direction = direction;
            refinedCandidate.distancePixels = testDistance;
            testDistance -= stepSize;
        }
    }

    return refinedCandidate;
}

fn refineExactBoundary(pixel: vec2i, renderSize: vec2i, candidate: MeshBlendCandidate) -> MeshBlendCandidate {
    var refinedCandidate: MeshBlendCandidate = candidate;
    var distancePixels: f32 = refinedCandidate.distancePixels;

    for (var sampleIndex: i32 = 0; sampleIndex < MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT; sampleIndex++) {
        distancePixels -= 1.0;
        if (distancePixels <= 0.0) {
            break;
        }

        let samplePixel: vec2i = pixel + vec2i(round(refinedCandidate.direction * distancePixels));
        let sampleTag: MeshBlendTag = loadMeshBlendTag(samplePixel, renderSize);
        if (sampleTag.groupId != refinedCandidate.targetGroupId) {
            break;
        }

        refinedCandidate.distancePixels = distancePixels;
    }

    return refinedCandidate;
}

fn hasTargetContinuation(
    pixel: vec2i,
    renderSize: vec2i,
    candidate: MeshBlendCandidate,
    continuationPixel: ptr<function, vec2i>
) -> bool {
    let continuationDistance: f32 = max(candidate.distancePixels * 2.0, candidate.distancePixels + 1.0);
    *continuationPixel = pixel + vec2i(round(candidate.direction * continuationDistance));
    if (!isPixelInBounds(*continuationPixel, renderSize)) {
        return false;
    }
    return loadMeshBlendTag(*continuationPixel, renderSize).groupId == candidate.targetGroupId;
}

fn applyTargetRadiusClass(
    targetPixel: vec2i,
    renderSize: vec2i,
    viewDepth: f32,
    candidate: ptr<function, MeshBlendCandidate>
) -> bool {
    let targetTag: MeshBlendTag = loadMeshBlendTag(targetPixel, renderSize);
    (*candidate).radiusClass = min((*candidate).radiusClass, targetTag.radiusClass);
    (*candidate).searchRadiusPixels = min(
        (*candidate).searchRadiusPixels,
        searchRadiusForClass((*candidate).radiusClass, viewDepth, f32(renderSize.y))
    );
    return (*candidate).distancePixels <= (*candidate).searchRadiusPixels;
}

#ifdef MESH_BLEND_FOUR_NEIGHBOR_FALLBACK
fn findImmediateNeighborCandidate(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    viewDepth: f32,
    ignoredGroupId: u32,
    preferredGroupId: u32
) -> MeshBlendCandidate {
    var best: MeshBlendCandidate = invalidCandidate();

    for (var neighborIndex: i32 = 0; neighborIndex < 4; neighborIndex++) {
        var offset: vec2i;
        if (neighborIndex == 0) {
            offset = vec2i(1, 0);
        } else if (neighborIndex == 1) {
            offset = vec2i(-1, 0);
        } else if (neighborIndex == 2) {
            offset = vec2i(0, 1);
        } else {
            offset = vec2i(0, -1);
        }

        let neighborTag: MeshBlendTag = loadMeshBlendTag(pixel + offset, renderSize);
        if (neighborTag.groupId == 0u || neighborTag.groupId == currentTag.groupId || neighborTag.groupId == ignoredGroupId) {
            continue;
        }

        let seamRadiusClass: u32 = min(currentTag.radiusClass, neighborTag.radiusClass);
        let candidateSearchRadius: f32 = searchRadiusForClass(seamRadiusClass, viewDepth, f32(renderSize.y));
        if (candidateSearchRadius < 1.0) {
            continue;
        }

        var score: f32 = 1.0 - 1.0 / max(candidateSearchRadius, 1.0);
        if (neighborTag.groupId == preferredGroupId) {
            score += 1.0;
        }
        if (score > best.score) {
            best.targetGroupId = neighborTag.groupId;
            best.radiusClass = seamRadiusClass;
            best.direction = vec2f(offset);
            best.distancePixels = 1.0;
            best.searchRadiusPixels = candidateSearchRadius;
            best.score = score;
            best.valid = true;
        }
    }

    return best;
}
#endif

#ifdef MESH_BLEND_TINY_OBJECT_SAFEGUARD
fn reduceRadiusForTinyObject(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    candidate: MeshBlendCandidate,
    radiusReduced: ptr<function, bool>
) -> f32 {
    var measuredThickness: f32 = candidate.searchRadiusPixels;
    var foundOppositeBoundary: bool = false;

    for (var probeIndex: i32 = 1; probeIndex <= MESH_BLEND_TINY_OBJECT_PROBE_COUNT; probeIndex++) {
        let probeDistance: f32 = max(1.0, candidate.searchRadiusPixels * f32(probeIndex) / f32(MESH_BLEND_TINY_OBJECT_PROBE_COUNT));
        let oppositeTag: MeshBlendTag = loadMeshBlendTag(pixel - vec2i(round(candidate.direction * probeDistance)), renderSize);
        if (oppositeTag.groupId != currentTag.groupId) {
            measuredThickness = probeDistance;
            foundOppositeBoundary = true;
            break;
        }
    }

    var outsideDirectionCount: i32 = 0;
    for (var neighborIndex: i32 = 0; neighborIndex < 4; neighborIndex++) {
        var direction: vec2f;
        if (neighborIndex == 0) {
            direction = vec2f(1.0, 0.0);
        } else if (neighborIndex == 1) {
            direction = vec2f(-1.0, 0.0);
        } else if (neighborIndex == 2) {
            direction = vec2f(0.0, 1.0);
        } else {
            direction = vec2f(0.0, -1.0);
        }

        let radiusTag: MeshBlendTag = loadMeshBlendTag(pixel + vec2i(round(direction * candidate.searchRadiusPixels)), renderSize);
        if (radiusTag.groupId != currentTag.groupId) {
            outsideDirectionCount++;
        }
    }

    *radiusReduced = foundOppositeBoundary && outsideDirectionCount >= 3;
    if (!*radiusReduced) {
        return candidate.searchRadiusPixels;
    }

    let thicknessRadius: f32 = max(1.0, measuredThickness * 1.25);
    return max(candidate.distancePixels, min(candidate.searchRadiusPixels, thicknessRadius));
}
#endif

fn validateMeshBlendContact(
    pixelA: vec2i,
    pixelE: vec2i,
    pixelB: vec2i,
    pixelC: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    candidate: MeshBlendCandidate,
    allowMissingContinuation: bool,
    narrowedSearchRadius: ptr<function, f32>,
    currentViewPosition: ptr<function, vec3f>
) -> i32 {
    *currentViewPosition = vec3f(0.0);
    let tagE: MeshBlendTag = loadMeshBlendTag(pixelE, renderSize);
    let tagB: MeshBlendTag = loadMeshBlendTag(pixelB, renderSize);
    let tagC: MeshBlendTag = loadMeshBlendTag(pixelC, renderSize);
    if (
        tagE.groupId != currentTag.groupId ||
        tagB.groupId != candidate.targetGroupId ||
        (!allowMissingContinuation && tagC.groupId != candidate.targetGroupId)
    ) {
        return MESH_BLEND_REJECTION_NO_CONTINUATION;
    }

    let depthA: f32 = loadMeshBlendDepth(pixelA, renderSize);
    let depthE: f32 = loadMeshBlendDepth(pixelE, renderSize);
    let depthB: f32 = loadMeshBlendDepth(pixelB, renderSize);
    let depthC: f32 = loadMeshBlendDepth(pixelC, renderSize);
    let positionA: vec3f = reconstructMeshBlendViewPosition(pixelA, renderSize, depthA);
    let positionE: vec3f = reconstructMeshBlendViewPosition(pixelE, renderSize, depthE);
    let positionB: vec3f = reconstructMeshBlendViewPosition(pixelB, renderSize, depthB);
    let positionC: vec3f = reconstructMeshBlendViewPosition(pixelC, renderSize, depthC);
    if (!isValidMeshBlendPosition(positionA) || !isValidMeshBlendPosition(positionE) || !isValidMeshBlendPosition(positionB) || !isValidMeshBlendPosition(positionC)) {
        return MESH_BLEND_REJECTION_INVALID_DEPTH;
    }
    *currentViewPosition = positionA;

    let viewDepth: f32 = abs(positionA.z);
    let unitsPerPixel: f32 = worldUnitsPerPixel(viewDepth, f32(renderSize.y));
    let effectiveWorldRadius: f32 = candidate.searchRadiusPixels * unitsPerPixel;
    let pixelTolerance: f32 = unitsPerPixel * MESH_BLEND_BOUNDARY_PIXEL_TOLERANCE;
    let boundarySpan: vec3f = positionB - positionE;
    let boundarySeparation: f32 = length(boundarySpan);
    if (boundarySeparation > effectiveWorldRadius * MESH_BLEND_BOUNDARY_SEPARATION_FACTOR + pixelTolerance) {
        return MESH_BLEND_REJECTION_DEPTH_SEPARATION;
    }

    let boundaryDepthDelta: f32 = abs(abs(positionB.z) - abs(positionE.z));
    let boundaryLateralSpan: f32 = length(boundarySpan.xy);
    if (
        boundaryDepthDelta > max(effectiveWorldRadius * MESH_BLEND_FOREGROUND_DEPTH_FACTOR, pixelTolerance) &&
        boundaryDepthDelta > boundaryLateralSpan * MESH_BLEND_FOREGROUND_LATERAL_FACTOR
    ) {
        return MESH_BLEND_REJECTION_FOREGROUND_BACKGROUND;
    }

    let targetSpan: f32 = distance(positionB, positionC);
    let totalSpan: f32 = distance(positionA, positionC);
    if (
        targetSpan > effectiveWorldRadius * MESH_BLEND_TARGET_SPAN_FACTOR + pixelTolerance ||
        totalSpan > effectiveWorldRadius * MESH_BLEND_TOTAL_SPAN_FACTOR + pixelTolerance
    ) {
        return MESH_BLEND_REJECTION_PHYSICAL_SPAN;
    }

    let currentDirection: vec3f = positionA - positionB;
    let targetDirection: vec3f = positionC - positionB;
    let currentLength: f32 = length(currentDirection);
    let targetLength: f32 = length(targetDirection);
    var oppositeFacing: f32 = 1.0;
    if (currentLength > MESH_BLEND_EPSILON && targetLength > MESH_BLEND_EPSILON) {
        oppositeFacing = -dot(currentDirection / currentLength, targetDirection / targetLength);
    }

    *narrowedSearchRadius = candidate.searchRadiusPixels * calculateSlopeScale(oppositeFacing);
    if (candidate.distancePixels > *narrowedSearchRadius) {
        return MESH_BLEND_REJECTION_CONTACT_ANGLE;
    }

    return MESH_BLEND_REJECTION_NONE;
}

fn calculateMeshBlendFade(distancePixels: f32, searchRadiusPixels: f32) -> f32 {
    let boundaryDistance: f32 = max(distancePixels - 0.5, 0.0);
    let normalizedDistance: f32 = clamp(boundaryDistance / max(searchRadiusPixels, MESH_BLEND_EPSILON), 0.0, 1.0);
    let inverseDistance: f32 = 1.0 - normalizedDistance;
    let fade: f32 = mix(inverseDistance * inverseDistance, inverseDistance, clamp(inverseDistance - 0.75, 0.0, 1.0));
    return fade * 0.5;
}

fn evaluateMeshBlend(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    currentSearchRadius: f32,
    viewDepth: f32,
    ignoredGroupId: u32,
    randomValues: vec2f,
    rotation: f32,
    sectorAngle: f32,
    direction0: vec2f,
    direction1: vec2f,
    direction2: vec2f
) -> MeshBlendResult {
    var result: MeshBlendResult = invalidBlendResult();
    var candidate: MeshBlendCandidate = findInitialCandidate(
        pixel,
        renderSize,
        currentTag,
        currentSearchRadius,
        viewDepth,
        ignoredGroupId,
        randomValues,
        rotation,
        sectorAngle,
        direction0,
        direction1,
        direction2
    );
    result.candidate = candidate;
    if (!candidate.valid) {
        return result;
    }

    result.stageReached = 2;
    candidate = refineCandidateDirection(pixel, renderSize, candidate, randomValues);
    candidate = refineExactBoundary(pixel, renderSize, candidate);
    result.candidate = candidate;
    result.stageReached = 3;
    let refinedTargetPixel: vec2i = clampPixel(pixel + vec2i(round(candidate.direction * candidate.distancePixels)), renderSize);
    if (!applyTargetRadiusClass(refinedTargetPixel, renderSize, viewDepth, &candidate)) {
        result.candidate = candidate;
        result.rejectionReason = MESH_BLEND_REJECTION_PHYSICAL_SPAN;
        return result;
    }
    result.candidate = candidate;

    var continuationPixel: vec2i;
    var continuationFound: bool = hasTargetContinuation(pixel, renderSize, candidate, &continuationPixel);
    if (!continuationFound) {
#ifdef MESH_BLEND_FOUR_NEIGHBOR_FALLBACK
        let fallbackCandidate: MeshBlendCandidate = findImmediateNeighborCandidate(
            pixel,
            renderSize,
            currentTag,
            viewDepth,
            ignoredGroupId,
            candidate.targetGroupId
        );
        if (!fallbackCandidate.valid) {
            result.rejectionReason = MESH_BLEND_REJECTION_NO_CONTINUATION;
            return result;
        }

        candidate = fallbackCandidate;
        result.candidate = candidate;
        result.usedFallback = true;
        continuationFound = hasTargetContinuation(pixel, renderSize, candidate, &continuationPixel);
#else
        result.rejectionReason = MESH_BLEND_REJECTION_NO_CONTINUATION;
        return result;
#endif
    }

    result.continuationFound = continuationFound;
    result.stageReached = 4;
    if (continuationFound && !applyTargetRadiusClass(continuationPixel, renderSize, viewDepth, &candidate)) {
        result.candidate = candidate;
        result.rejectionReason = MESH_BLEND_REJECTION_PHYSICAL_SPAN;
        return result;
    }
    result.candidate = candidate;
    let originalSearchRadius: f32 = candidate.searchRadiusPixels;

#ifdef MESH_BLEND_TINY_OBJECT_SAFEGUARD
    var tinyObjectRadiusReduced: bool = false;
    candidate.searchRadiusPixels = reduceRadiusForTinyObject(pixel, renderSize, currentTag, candidate, &tinyObjectRadiusReduced);
    result.tinyObjectRadiusReduced = tinyObjectRadiusReduced;
    result.stageReached = 5;
#endif

    result.candidate = candidate;
    result.effectiveRadiusPixels = candidate.searchRadiusPixels;
    result.tinyObjectRadiusRatio = candidate.searchRadiusPixels / max(originalSearchRadius, MESH_BLEND_EPSILON);
    let pixelB: vec2i = clampPixel(pixel + vec2i(round(candidate.direction * candidate.distancePixels)), renderSize);
    let pixelE: vec2i = clampPixel(pixel + vec2i(round(candidate.direction * max(candidate.distancePixels - 2.0, 0.0))), renderSize);
    var pixelC: vec2i = pixelB;
    if (continuationFound) {
        pixelC = continuationPixel;
    }
    var narrowedSearchRadius: f32 = candidate.searchRadiusPixels;
    var currentViewPosition: vec3f = vec3f(0.0);
    result.rejectionReason = validateMeshBlendContact(
        pixel,
        pixelE,
        pixelB,
        pixelC,
        renderSize,
        currentTag,
        candidate,
        result.usedFallback && !continuationFound,
        &narrowedSearchRadius,
        &currentViewPosition
    );
    result.currentViewPosition = currentViewPosition;
    result.stageReached = 6;
    result.effectiveRadiusPixels = narrowedSearchRadius;
    if (result.rejectionReason != MESH_BLEND_REJECTION_NONE) {
        return result;
    }

    result.fade = calculateMeshBlendFade(candidate.distancePixels, narrowedSearchRadius);
    if (result.fade <= 0.0) {
        result.rejectionReason = MESH_BLEND_REJECTION_PHYSICAL_SPAN;
        return result;
    }

    result.targetPixel = pixelB;
    result.targetFarPixel = pixelB;
    if (continuationFound) {
        result.targetFarPixel = continuationPixel;
    }
    result.stageReached = 7;
    result.valid = true;
    return result;
}

fn meshBlendLinearToSrgbChannel(value: f32) -> f32 {
    if (value <= 0.0031308) {
        return value * 12.92;
    }
    return 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

fn meshBlendSrgbToLinearChannel(value: f32) -> f32 {
    if (value <= 0.04045) {
        return value / 12.92;
    }
    return pow((value + 0.055) / 1.055, 2.4);
}

fn meshBlendLinearToSrgb(color: vec3f) -> vec3f {
    return vec3f(
        meshBlendLinearToSrgbChannel(color.r),
        meshBlendLinearToSrgbChannel(color.g),
        meshBlendLinearToSrgbChannel(color.b)
    );
}

fn meshBlendSrgbToLinear(color: vec3f) -> vec3f {
    return vec3f(
        meshBlendSrgbToLinearChannel(color.r),
        meshBlendSrgbToLinearChannel(color.g),
        meshBlendSrgbToLinearChannel(color.b)
    );
}

fn meshBlendSignedCubeRoot(value: f32) -> f32 {
    return sign(value) * pow(abs(value), 1.0 / 3.0);
}

fn meshBlendLinearSrgbToOklab(color: vec3f) -> vec3f {
    let longResponse: f32 = 0.4122214708 * color.r + 0.5363325363 * color.g + 0.0514459929 * color.b;
    let mediumResponse: f32 = 0.2119034982 * color.r + 0.6806995451 * color.g + 0.1073969566 * color.b;
    let shortResponse: f32 = 0.0883024619 * color.r + 0.2817188376 * color.g + 0.6299787005 * color.b;
    let longRoot: f32 = meshBlendSignedCubeRoot(longResponse);
    let mediumRoot: f32 = meshBlendSignedCubeRoot(mediumResponse);
    let shortRoot: f32 = meshBlendSignedCubeRoot(shortResponse);

    return vec3f(
        0.2104542553 * longRoot + 0.7936177850 * mediumRoot - 0.0040720468 * shortRoot,
        1.9779984951 * longRoot - 2.4285922050 * mediumRoot + 0.4505937099 * shortRoot,
        0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.8086757660 * shortRoot
    );
}

fn meshBlendOklabToLinearSrgb(color: vec3f) -> vec3f {
    let longRoot: f32 = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
    let mediumRoot: f32 = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
    let shortRoot: f32 = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
    let longResponse: f32 = longRoot * longRoot * longRoot;
    let mediumResponse: f32 = mediumRoot * mediumRoot * mediumRoot;
    let shortResponse: f32 = shortRoot * shortRoot * shortRoot;

    return vec3f(
        4.0767416621 * longResponse - 3.3077115913 * mediumResponse + 0.2309699292 * shortResponse,
        -1.2684380046 * longResponse + 2.6097574011 * mediumResponse - 0.3413193965 * shortResponse,
        -0.0041960863 * longResponse - 0.7034186147 * mediumResponse + 1.7076147010 * shortResponse
    );
}

fn interpolateMeshBlendColor(currentColor: vec3f, targetColor: vec3f, factor: f32) -> vec3f {
#ifdef MESH_BLEND_COLOR_INTERPOLATION_SRGB
    return meshBlendSrgbToLinear(mix(meshBlendLinearToSrgb(currentColor), meshBlendLinearToSrgb(targetColor), factor));
#else
    return meshBlendOklabToLinearSrgb(mix(meshBlendLinearSrgbToOklab(currentColor), meshBlendLinearSrgbToOklab(targetColor), factor));
#endif
}

fn meshBlendLuminance(srgbColor: vec3f) -> f32 {
    return dot(srgbColor, vec3f(0.2126, 0.7152, 0.0722));
}

fn constructMeshBlendTargetColorSamples(renderSize: vec2i, result: MeshBlendResult) -> MeshBlendTargetColorSamples {
    var samples: MeshBlendTargetColorSamples;
    let boundaryPlusOnePixel: vec2i = clampPixel(result.targetPixel + vec2i(round(result.candidate.direction)), renderSize);
    let boundaryPlusTwoPixel: vec2i = clampPixel(result.targetPixel + vec2i(round(result.candidate.direction * 2.0)), renderSize);
    let boundaryPlusOneTag: MeshBlendTag = loadMeshBlendTag(boundaryPlusOnePixel, renderSize);
    let boundaryPlusTwoTag: MeshBlendTag = loadMeshBlendTag(boundaryPlusTwoPixel, renderSize);

    samples.fartherColor = textureLoad(textureSampler, result.targetFarPixel, 0);
    samples.boundaryPlusOneColor = textureLoad(textureSampler, boundaryPlusOnePixel, 0);
    samples.boundaryPlusTwoColor = textureLoad(textureSampler, boundaryPlusTwoPixel, 0);
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    samples.fartherBaseColor = textureLoad(meshBlendBaseColorSampler, result.targetFarPixel, 0).rgb;
    let boundaryPlusOneBaseColor: vec3f = textureLoad(meshBlendBaseColorSampler, boundaryPlusOnePixel, 0).rgb;
    let boundaryPlusTwoBaseColor: vec3f = textureLoad(meshBlendBaseColorSampler, boundaryPlusTwoPixel, 0).rgb;
#endif
    samples.onePixelEdge = boundaryPlusOneTag.groupId != result.candidate.targetGroupId;

    if (samples.onePixelEdge) {
        samples.conservativeNearColor = samples.fartherColor;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
        samples.conservativeNearBaseColor = samples.fartherBaseColor;
#endif
        samples.targetColor = samples.fartherColor;
        return samples;
    }

    let secondNearSampleIsTarget: bool = boundaryPlusTwoTag.groupId == result.candidate.targetGroupId;
    let firstNearLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(samples.boundaryPlusOneColor.rgb));
    let secondNearLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(samples.boundaryPlusTwoColor.rgb));
    let useSecondNearSample: bool = secondNearSampleIsTarget && secondNearLuminance < firstNearLuminance;
    if (useSecondNearSample) {
        samples.conservativeNearColor = samples.boundaryPlusTwoColor;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
        samples.conservativeNearBaseColor = boundaryPlusTwoBaseColor;
#endif
    } else {
        samples.conservativeNearColor = samples.boundaryPlusOneColor;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
        samples.conservativeNearBaseColor = boundaryPlusOneBaseColor;
#endif
    }
    samples.targetColor = mix(samples.fartherColor, samples.conservativeNearColor, MESH_BLEND_NEAR_EDGE_TARGET_WEIGHT);
    return samples;
}

fn applyMeshBlendNearSeamCorrection(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    result: MeshBlendResult,
    samples: MeshBlendTargetColorSamples,
    currentColor: vec4f,
    corrected: ptr<function, bool>
) -> vec4f {
    *corrected = false;
    if (!samples.onePixelEdge || result.candidate.distancePixels > MESH_BLEND_NEAR_SEAM_MAX_DISTANCE) {
        return currentColor;
    }

    let oppositePixel: vec2i = clampPixel(pixel - vec2i(round(result.candidate.direction)), renderSize);
    let oppositeTag: MeshBlendTag = loadMeshBlendTag(oppositePixel, renderSize);
    if (oppositeTag.groupId != currentTag.groupId) {
        return currentColor;
    }

    let oppositeColor: vec4f = textureLoad(textureSampler, oppositePixel, 0);
    let currentTargetDistance: f32 = distance(currentColor.rgb, samples.targetColor.rgb);
    let oppositeTargetDistance: f32 = distance(oppositeColor.rgb, samples.targetColor.rgb);
    if (currentTargetDistance + MESH_BLEND_NEAR_SEAM_COLOR_DELTA >= oppositeTargetDistance) {
        return currentColor;
    }

    *corrected = true;
    return oppositeColor;
}

#ifdef MESH_BLEND_SHADOW_ESTIMATION
fn estimateMeshBlendShadow(renderedLinear: vec3f, baseColorLinear: vec3f) -> f32 {
    let renderedLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(renderedLinear));
    let baseLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(baseColorLinear));
    if (baseLuminance <= MESH_BLEND_BASE_LUMINANCE_EPSILON) {
        return 1.0;
    }
    return renderedLuminance / baseLuminance;
}

fn calculateMeshBlendShadowAttenuation(currentColor: vec3f, samples: MeshBlendTargetColorSamples) -> f32 {
    let fartherShadow: f32 = estimateMeshBlendShadow(samples.fartherColor.rgb, samples.fartherBaseColor);
    let nearShadow: f32 = estimateMeshBlendShadow(samples.conservativeNearColor.rgb, samples.conservativeNearBaseColor);
    let shadowDifference: f32 = abs(fartherShadow - nearShadow);
    let shadowMismatch: f32 = smoothstep(MESH_BLEND_SHADOW_DIFFERENCE_LOW, MESH_BLEND_SHADOW_DIFFERENCE_HIGH, shadowDifference);
    let currentLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(currentColor));
    let targetLuminance: f32 = meshBlendLuminance(meshBlendLinearToSrgb(samples.targetColor.rgb));
    let targetToCurrentRatio: f32 = targetLuminance / max(currentLuminance, MESH_BLEND_BASE_LUMINANCE_EPSILON);
    let targetIsNotDark: f32 = smoothstep(MESH_BLEND_TARGET_DARKER_RATIO, MESH_BLEND_TARGET_NON_DARK_RATIO, targetToCurrentRatio);
    return mix(1.0, MESH_BLEND_SHADOW_MIN_ATTENUATION, shadowMismatch * targetIsNotDark);
}
#endif

fn evaluateMeshBlendColor(
    pixel: vec2i,
    renderSize: vec2i,
    currentTag: MeshBlendTag,
    result: MeshBlendResult
) -> MeshBlendColorEvaluation {
    var evaluation: MeshBlendColorEvaluation;
    evaluation.samples = constructMeshBlendTargetColorSamples(renderSize, result);
    #ifdef MESH_BLEND_DEBUG_WORLD_POSITION
    evaluation.worldPosition = reconstructMeshBlendWorldPosition(result.currentViewPosition);
    #endif
    let currentSceneColor: vec4f = textureLoad(textureSampler, pixel, 0);
    var nearSeamCorrected: bool = false;
    evaluation.currentColor = applyMeshBlendNearSeamCorrection(
        pixel,
        renderSize,
        currentTag,
        result,
        evaluation.samples,
        currentSceneColor,
        &nearSeamCorrected
    );
    evaluation.nearSeamCorrected = nearSeamCorrected;
    evaluation.shadowAttenuation = 1.0;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    evaluation.shadowAttenuation = calculateMeshBlendShadowAttenuation(evaluation.currentColor.rgb, evaluation.samples);
#endif
    evaluation.adjustedFade = result.fade * evaluation.shadowAttenuation;
    evaluation.blendedColor = vec4f(
        interpolateMeshBlendColor(evaluation.currentColor.rgb, evaluation.samples.targetColor.rgb, evaluation.adjustedFade),
        mix(evaluation.currentColor.a, evaluation.samples.targetColor.a, evaluation.adjustedFade)
    );
    return evaluation;
}

fn radiusClassDebugColor(radiusClass: u32) -> vec3f {
    if (radiusClass == 0u) {
        return vec3f(0.15, 0.55, 1.0);
    }
    if (radiusClass == 1u) {
        return vec3f(0.15, 0.9, 0.35);
    }
    if (radiusClass == 2u) {
        return vec3f(1.0, 0.65, 0.1);
    }
    return vec3f(0.95, 0.2, 0.65);
}

fn validationDebugColor(rejectionReason: i32, narrowedRadiusRatio: f32) -> vec3f {
    if (rejectionReason == MESH_BLEND_REJECTION_NONE) {
        return mix(vec3f(0.1, 0.55, 1.0), vec3f(0.2, 1.0, 0.25), narrowedRadiusRatio);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_NO_CANDIDATE) {
        return vec3f(0.12);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_NO_CONTINUATION) {
        return vec3f(0.75, 0.1, 0.85);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_INVALID_DEPTH) {
        return vec3f(1.0, 0.0, 1.0);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_DEPTH_SEPARATION) {
        return vec3f(1.0, 0.1, 0.1);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_FOREGROUND_BACKGROUND) {
        return vec3f(1.0, 0.4, 0.05);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_PHYSICAL_SPAN) {
        return vec3f(1.0, 0.9, 0.05);
    }
    return vec3f(0.05, 0.8, 1.0);
}

fn processingStageDebugColor(stageReached: i32) -> vec3f {
    if (stageReached <= 0) {
        return vec3f(0.03);
    }
    if (stageReached == 1) {
        return vec3f(0.1, 0.15, 0.45);
    }
    if (stageReached == 2) {
        return vec3f(0.1, 0.35, 0.7);
    }
    if (stageReached == 3) {
        return vec3f(0.05, 0.65, 0.8);
    }
    if (stageReached == 4) {
        return vec3f(0.1, 0.8, 0.55);
    }
    if (stageReached == 5) {
        return vec3f(0.45, 0.9, 0.25);
    }
    if (stageReached == 6) {
        return vec3f(0.95, 0.75, 0.1);
    }
    return vec3f(0.15, 1.0, 0.25);
}

fn candidateDebugColor(result: MeshBlendResult) -> vec3f {
    if (!result.candidate.valid) {
        return vec3f(0.04);
    }

    let normalizedDistance: f32 = clamp(
        result.candidate.distancePixels / max(result.candidate.searchRadiusPixels, MESH_BLEND_EPSILON),
        0.0,
        1.0
    );
    return vec3f(result.candidate.direction * 0.5 + 0.5, 1.0 - normalizedDistance);
}

#define CUSTOM_FRAGMENT_DEFINITIONS

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    let renderSize: vec2i = vec2i(textureDimensions(meshBlendDepthSampler, 0));
    let pixel: vec2i = clampPixel(vec2i(floor(input.vUV * vec2f(renderSize))), renderSize);
    let currentTag: MeshBlendTag = loadMeshBlendTag(pixel, renderSize);

#ifdef MESH_BLEND_DEBUG_PACKED_TAG
    let groupVariation: f32 = 0.45 + 0.55 * fract(f32(currentTag.groupId) * 0.61803398875);
    let tagColor: vec3f = radiusClassDebugColor(currentTag.radiusClass) * groupVariation;
    if (currentTag.groupId == 0u) {
        fragmentOutputs.color = vec4f(0.0, 0.0, 0.0, 1.0);
    } else {
        fragmentOutputs.color = vec4f(tagColor, 1.0);
    }
    return fragmentOutputs;
#endif

    if (currentTag.groupId == 0u) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        fragmentOutputs.color = vec4f(0.0, 0.0, 0.0, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
#else
        fragmentOutputs.color = textureLoad(textureSampler, pixel, 0);
#endif
        return fragmentOutputs;
    }

    let sizingDepth: f32 = loadMeshBlendDepth(pixel, renderSize);
    let sizingPosition: vec3f = reconstructMeshBlendViewPosition(pixel, renderSize, sizingDepth);
    if (!isValidMeshBlendPosition(sizingPosition)) {
#ifdef MESH_BLEND_DEBUG_REJECTION_REASON
        fragmentOutputs.color = vec4f(validationDebugColor(MESH_BLEND_REJECTION_INVALID_DEPTH, 0.0), 1.0);
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
        fragmentOutputs.color = vec4f(0.45, 0.1, 0.1, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        fragmentOutputs.color = vec4f(0.4, 0.05, 0.4, 1.0);
#else
        fragmentOutputs.color = textureLoad(textureSampler, pixel, 0);
#endif
        return fragmentOutputs;
    }

    let currentViewDepth: f32 = abs(sizingPosition.z);
    let currentSearchRadius: f32 = searchRadiusForClass(currentTag.radiusClass, currentViewDepth, f32(renderSize.y));
    if (currentSearchRadius < 1.0) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        fragmentOutputs.color = vec4f(radiusClassDebugColor(currentTag.radiusClass) * 0.25, 1.0);
#elif defined(MESH_BLEND_DEBUG_REJECTION_REASON)
        fragmentOutputs.color = vec4f(validationDebugColor(MESH_BLEND_REJECTION_PHYSICAL_SPAN, 0.0), 1.0);
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
        fragmentOutputs.color = vec4f(0.2, 0.2, 0.65, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
#else
        fragmentOutputs.color = textureLoad(textureSampler, pixel, 0);
#endif
        return fragmentOutputs;
    }

    let randomValues: vec2f = loadStableBlueNoise(pixel);
    let sectorAngle: f32 = MESH_BLEND_TWO_PI / f32(MESH_BLEND_DIRECTION_COUNT);
    var rotation: f32;
#ifdef MESH_BLEND_FULL_RANDOM_ROTATION
    rotation = randomValues.x * sectorAngle;
#else
    rotation = floor(randomValues.x * 8.0) * 0.125 * sectorAngle;
#endif
    let direction0: vec2f = vec2f(cos(rotation), sin(rotation));
    let direction1: vec2f = vec2f(cos(rotation + sectorAngle), sin(rotation + sectorAngle));
    let direction2: vec2f = vec2f(cos(rotation + sectorAngle * 2.0), sin(rotation + sectorAngle * 2.0));

    let primaryResult: MeshBlendResult = evaluateMeshBlend(
        pixel,
        renderSize,
        currentTag,
        currentSearchRadius,
        currentViewDepth,
        0u,
        randomValues,
        rotation,
        sectorAngle,
        direction0,
        direction1,
        direction2
    );

    var secondaryResult: MeshBlendResult = invalidBlendResult();
#ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
    if (primaryResult.valid) {
        secondaryResult = evaluateMeshBlend(
            pixel,
            renderSize,
            currentTag,
            currentSearchRadius,
            currentViewDepth,
            primaryResult.candidate.targetGroupId,
            randomValues,
            rotation,
            sectorAngle,
            direction0,
            direction1,
            direction2
        );
    }
#endif

#ifdef MESH_BLEND_DEBUG_CANDIDATE_DIRECTION_DISTANCE
    fragmentOutputs.color = vec4f(candidateDebugColor(primaryResult), 1.0);
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_CONTINUATION)
    if (!primaryResult.candidate.valid) {
        fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
    } else if (primaryResult.rejectionReason == MESH_BLEND_REJECTION_NO_CONTINUATION) {
        fragmentOutputs.color = vec4f(0.85, 0.05, 0.7, 1.0);
    } else if (primaryResult.usedFallback) {
        fragmentOutputs.color = vec4f(1.0, 0.75, 0.05, 1.0);
    } else {
        fragmentOutputs.color = vec4f(0.1, 0.9, 0.25, 1.0);
    }
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_TINY_OBJECT)
    #ifdef MESH_BLEND_TINY_OBJECT_SAFEGUARD
        if (!primaryResult.candidate.valid) {
            fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
        } else {
            let radiusColor: vec3f = mix(vec3f(1.0, 0.1, 0.05), vec3f(0.1, 0.65, 1.0), primaryResult.tinyObjectRadiusRatio);
            if (primaryResult.tinyObjectRadiusReduced) {
                fragmentOutputs.color = vec4f(radiusColor, 1.0);
            } else {
                fragmentOutputs.color = vec4f(radiusColor * 0.45, 1.0);
            }
        }
    #else
        fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
    #endif
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_MULTI_TARGET)
    #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
        if (secondaryResult.valid) {
            fragmentOutputs.color = vec4f(0.95, 0.95, 1.0, 1.0);
        } else if (secondaryResult.candidate.valid) {
            fragmentOutputs.color = vec4f(0.8, 0.15, 0.75, 1.0);
        } else if (primaryResult.valid) {
            fragmentOutputs.color = vec4f(0.1, 0.45, 0.95, 1.0);
        } else {
            fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
        }
    #else
        if (primaryResult.valid) {
            fragmentOutputs.color = vec4f(0.1, 0.45, 0.95, 1.0);
        } else {
            fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
        }
    #endif
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_REJECTION_REASON)
    var narrowedRadiusRatio: f32 = 0.0;
    if (primaryResult.candidate.valid) {
        narrowedRadiusRatio = primaryResult.effectiveRadiusPixels / max(primaryResult.candidate.searchRadiusPixels, MESH_BLEND_EPSILON);
    }
    fragmentOutputs.color = vec4f(validationDebugColor(primaryResult.rejectionReason, narrowedRadiusRatio), 1.0);
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
    var stageReached: i32 = primaryResult.stageReached;
    #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
        stageReached = max(stageReached, secondaryResult.stageReached);
    #endif
    fragmentOutputs.color = vec4f(processingStageDebugColor(stageReached), 1.0);
    return fragmentOutputs;
#endif

    if (!primaryResult.valid) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        var debugRadiusClass: u32 = currentTag.radiusClass;
        if (primaryResult.candidate.valid) {
            debugRadiusClass = primaryResult.candidate.radiusClass;
        }
        fragmentOutputs.color = vec4f(radiusClassDebugColor(debugRadiusClass) * 0.25, 1.0);
#elif defined(MESH_BLEND_DEBUG_TARGET_COLOR) || defined(MESH_BLEND_DEBUG_SHADOW_ATTENUATION) || defined(MESH_BLEND_DEBUG_COLOR_INTERPOLATION) || defined(MESH_BLEND_DEBUG_WORLD_POSITION)
        fragmentOutputs.color = vec4f(0.04, 0.04, 0.04, 1.0);
#else
        fragmentOutputs.color = textureLoad(textureSampler, pixel, 0);
#endif
        return fragmentOutputs;
    }

#ifdef MESH_BLEND_DEBUG_SEAM_FADE
    var debugFade: f32 = primaryResult.fade;
    #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
        if (secondaryResult.valid) {
            debugFade = min(0.5, primaryResult.fade + secondaryResult.fade);
        }
    #endif
    let classColor: vec3f = radiusClassDebugColor(primaryResult.candidate.radiusClass) * 0.25;
    fragmentOutputs.color = vec4f(mix(classColor, vec3f(1.0), clamp(debugFade * 2.0, 0.0, 1.0)), 1.0);
    return fragmentOutputs;
#else
    let primaryColorEvaluation: MeshBlendColorEvaluation = evaluateMeshBlendColor(pixel, renderSize, currentTag, primaryResult);

#ifdef MESH_BLEND_DEBUG_WORLD_POSITION
    fragmentOutputs.color = vec4f(fract(primaryColorEvaluation.worldPosition * 0.1), 1.0);
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_TARGET_COLOR)
    let targetSampleIndex: i32 = (pixel.x / 4) % 4;
    if (targetSampleIndex == 0) {
        fragmentOutputs.color = primaryColorEvaluation.samples.fartherColor;
    } else if (targetSampleIndex == 1) {
        fragmentOutputs.color = primaryColorEvaluation.samples.boundaryPlusOneColor;
    } else if (targetSampleIndex == 2) {
        fragmentOutputs.color = primaryColorEvaluation.samples.boundaryPlusTwoColor;
    } else {
        fragmentOutputs.color = primaryColorEvaluation.samples.targetColor;
    }
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_SHADOW_ATTENUATION)
    var nearSeamCorrectionDebug: f32 = 0.0;
    if (primaryColorEvaluation.nearSeamCorrected) {
        nearSeamCorrectionDebug = 1.0;
    }
    fragmentOutputs.color = vec4f(
        1.0 - primaryColorEvaluation.shadowAttenuation,
        primaryColorEvaluation.shadowAttenuation,
        nearSeamCorrectionDebug,
        1.0
    );
    return fragmentOutputs;
#elif defined(MESH_BLEND_DEBUG_COLOR_INTERPOLATION)
    #ifdef MESH_BLEND_COLOR_INTERPOLATION_SRGB
        let interpolationModeColor: vec3f = vec3f(1.0, 0.4, 0.05);
    #else
        let interpolationModeColor: vec3f = vec3f(0.1, 0.75, 1.0);
    #endif
    let interpolationStage: f32 = mix(0.35, 1.0, clamp(primaryColorEvaluation.adjustedFade * 2.0, 0.0, 1.0));
    fragmentOutputs.color = vec4f(interpolationModeColor * interpolationStage, 1.0);
    return fragmentOutputs;
#else
    #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
        if (secondaryResult.valid) {
            let secondaryColorEvaluation: MeshBlendColorEvaluation = evaluateMeshBlendColor(pixel, renderSize, currentTag, secondaryResult);
            let totalBoundaryDistance: f32 = max(
                primaryResult.candidate.distancePixels + secondaryResult.candidate.distancePixels,
                MESH_BLEND_EPSILON
            );
            let primaryRelativeProximity: f32 = secondaryResult.candidate.distancePixels / totalBoundaryDistance;
            let secondaryRelativeProximity: f32 = primaryResult.candidate.distancePixels / totalBoundaryDistance;
            let primaryWeight: f32 = primaryColorEvaluation.adjustedFade * primaryRelativeProximity;
            let secondaryWeight: f32 = secondaryColorEvaluation.adjustedFade * secondaryRelativeProximity;
            let combinedWeight: f32 = primaryWeight + secondaryWeight;
            if (combinedWeight <= MESH_BLEND_EPSILON) {
                fragmentOutputs.color = textureLoad(textureSampler, pixel, 0);
                return fragmentOutputs;
            }
            fragmentOutputs.color =
                (primaryColorEvaluation.blendedColor * primaryWeight + secondaryColorEvaluation.blendedColor * secondaryWeight) / combinedWeight;
            return fragmentOutputs;
        }
    #endif

    fragmentOutputs.color = primaryColorEvaluation.blendedColor;
#endif
#endif
}
