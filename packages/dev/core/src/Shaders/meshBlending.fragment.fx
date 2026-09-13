precision highp float;
precision highp int;

// Behavioral and parameter-model inspiration: https://meshblend.lervik.com/
// Technique background: https://www.jacktollenaar.top/articles/meshblending.html
// Performance considerations: https://www.jacktollenaar.top/articles/meshblending2.html
// OKLab conversion: https://bottosson.github.io/posts/oklab/

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform highp usampler2D meshBlendTagSampler;
uniform sampler2D meshBlendDepthSampler;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
uniform sampler2D meshBlendBaseColorSampler;
#endif
uniform sampler2D meshBlendBlueNoiseSampler;

uniform mat4 projection;
uniform mat4 inverseProjection;
uniform mat4 inverseView;
uniform vec4 blendWorldRadii;
uniform vec4 minimumProjectedRadii;
uniform float meshBlendIsOrthographic;
uniform float slopeFactor;

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
    uint groupId;
    uint radiusClass;
};

struct MeshBlendCandidate {
    uint targetGroupId;
    uint radiusClass;
    vec2 direction;
    float distancePixels;
    float searchRadiusPixels;
    float score;
    bool valid;
};

struct MeshBlendResult {
    MeshBlendCandidate candidate;
    ivec2 targetPixel;
    ivec2 targetFarPixel;
    vec3 currentViewPosition;
    float effectiveRadiusPixels;
    float fade;
    float tinyObjectRadiusRatio;
    int rejectionReason;
    int stageReached;
    bool valid;
    bool continuationFound;
    bool usedFallback;
    bool tinyObjectRadiusReduced;
};

struct MeshBlendTargetColorSamples {
    vec4 fartherColor;
    vec4 boundaryPlusOneColor;
    vec4 boundaryPlusTwoColor;
    vec4 conservativeNearColor;
    vec4 targetColor;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    vec3 fartherBaseColor;
    vec3 conservativeNearBaseColor;
#endif
    bool onePixelEdge;
};

struct MeshBlendColorEvaluation {
    MeshBlendTargetColorSamples samples;
    vec4 currentColor;
    vec4 blendedColor;
    #ifdef MESH_BLEND_DEBUG_WORLD_POSITION
    vec3 worldPosition;
    #endif
    float shadowAttenuation;
    float adjustedFade;
    bool nearSeamCorrected;
};

ivec2 clampPixel(ivec2 pixel, ivec2 renderSize) {
    return clamp(pixel, ivec2(0), renderSize - ivec2(1));
}

vec2 pixelToUv(ivec2 pixel, ivec2 renderSize) {
    return (vec2(clampPixel(pixel, renderSize)) + vec2(0.5)) / vec2(renderSize);
}

MeshBlendTag loadMeshBlendTag(ivec2 pixel, ivec2 renderSize) {
    uint packedTag = texelFetch(meshBlendTagSampler, clampPixel(pixel, renderSize), 0).r;
    MeshBlendTag tag;
    tag.groupId = packedTag & 0x3fu;
    tag.radiusClass = packedTag >> 6u;
    return tag;
}

float loadMeshBlendDepth(ivec2 pixel, ivec2 renderSize) {
    return texelFetch(meshBlendDepthSampler, clampPixel(pixel, renderSize), 0).r;
}

float classValue(vec4 values, uint index) {
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

float meshBlendDepthToNdc(float depth) {
#ifdef MESH_BLEND_DEPTH_SCREEN
    #ifdef IS_NDC_HALF_ZRANGE
        return depth;
    #else
        return depth * 2.0 - 1.0;
    #endif
#else
    vec4 projectedDepth = projection * vec4(0.0, 0.0, depth, 1.0);
    return projectedDepth.z / projectedDepth.w;
#endif
}

vec3 reconstructMeshBlendViewPosition(ivec2 pixel, ivec2 renderSize, float depth) {
    vec2 ndcXY = pixelToUv(pixel, renderSize) * 2.0 - 1.0;
    vec4 viewPosition = inverseProjection * vec4(ndcXY, meshBlendDepthToNdc(depth), 1.0);
    return viewPosition.xyz / viewPosition.w;
}

vec3 reconstructMeshBlendWorldPosition(vec3 viewPosition) {
    return (inverseView * vec4(viewPosition, 1.0)).xyz;
}

bool isValidMeshBlendPosition(vec3 position) {
    return !any(isnan(position)) && !any(isinf(position));
}

float meshBlendProjectionScale(float renderHeight) {
    return max(0.5 * renderHeight * abs(projection[1][1]), MESH_BLEND_EPSILON);
}

float searchRadiusForClass(uint radiusClass, float viewDepth, float renderHeight) {
    float projectionScale = meshBlendProjectionScale(renderHeight);
    float projectedWorldRadius = classValue(blendWorldRadii, radiusClass) * projectionScale;
    if (meshBlendIsOrthographic < 0.5) {
        projectedWorldRadius /= max(viewDepth, MESH_BLEND_EPSILON);
    }

    float scaledRadius = max(projectedWorldRadius, classValue(minimumProjectedRadii, radiusClass)) * MESH_BLEND_RADIUS_SCALE;
    return scaledRadius > 0.0 ? max(1.0, scaledRadius) : 0.0;
}

float worldUnitsPerPixel(float viewDepth, float renderHeight) {
    float unitsPerPixel = 1.0 / meshBlendProjectionScale(renderHeight);
    return meshBlendIsOrthographic > 0.5 ? unitsPerPixel : unitsPerPixel * max(viewDepth, MESH_BLEND_EPSILON);
}

float calculateSlopeScale(float oppositeFacing) {
    if (slopeFactor <= 1.0) {
        return 1.0;
    }

    return MESH_BLEND_MIN_SLOPE_SCALE +
        (1.0 - MESH_BLEND_MIN_SLOPE_SCALE) * pow(clamp(oppositeFacing, 0.0, 1.0), slopeFactor - 1.0);
}

vec2 loadStableBlueNoise(ivec2 pixel) {
    ivec2 noiseSize = textureSize(meshBlendBlueNoiseSampler, 0);
    ivec2 wrappedPixel = ivec2(pixel.x % noiseSize.x, pixel.y % noiseSize.y);
    return texelFetch(meshBlendBlueNoiseSampler, wrappedPixel, 0).rg;
}

vec2 directionAt(int index, float rotation, float sectorAngle, vec2 direction0, vec2 direction1, vec2 direction2) {
#if MESH_BLEND_DIRECTION_COUNT == 3
    if (index == 0) {
        return direction0;
    }
    if (index == 1) {
        return direction1;
    }
    return direction2;
#else
    float angle = rotation + sectorAngle * float(index);
    return vec2(cos(angle), sin(angle));
#endif
}

MeshBlendCandidate invalidCandidate() {
    MeshBlendCandidate candidate;
    candidate.targetGroupId = 0u;
    candidate.radiusClass = 0u;
    candidate.direction = vec2(0.0);
    candidate.distancePixels = 0.0;
    candidate.searchRadiusPixels = 0.0;
    candidate.score = -1.0;
    candidate.valid = false;
    return candidate;
}

MeshBlendResult invalidBlendResult() {
    MeshBlendResult result;
    result.candidate = invalidCandidate();
    result.targetPixel = ivec2(0);
    result.targetFarPixel = ivec2(0);
    result.currentViewPosition = vec3(0.0);
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

MeshBlendCandidate findInitialCandidate(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    float currentSearchRadius,
    float viewDepth,
    uint ignoredGroupId,
    vec2 randomValues,
    float rotation,
    float sectorAngle,
    vec2 direction0,
    vec2 direction1,
    vec2 direction2
) {
    MeshBlendCandidate best = invalidCandidate();
    float radialJitter = mix(0.5, randomValues.y, MESH_BLEND_JITTER_FACTOR);

    for (int radialIndex = 0; radialIndex < MESH_BLEND_RADIAL_SAMPLE_COUNT; ++radialIndex) {
        float normalizedDistance = (float(radialIndex) + radialJitter) / float(MESH_BLEND_RADIAL_SAMPLE_COUNT);
        float distancePixels = max(1.0, ceil(normalizedDistance * normalizedDistance * normalizedDistance * currentSearchRadius));

        for (int directionIndex = 0; directionIndex < MESH_BLEND_DIRECTION_COUNT; ++directionIndex) {
            vec2 direction = directionAt(directionIndex, rotation, sectorAngle, direction0, direction1, direction2);
            ivec2 samplePixel = pixel + ivec2(round(direction * distancePixels));
            MeshBlendTag candidateTag = loadMeshBlendTag(samplePixel, renderSize);

            if (candidateTag.groupId == 0u || candidateTag.groupId == currentTag.groupId || candidateTag.groupId == ignoredGroupId) {
                continue;
            }

            uint seamRadiusClass = min(currentTag.radiusClass, candidateTag.radiusClass);
            float candidateSearchRadius = searchRadiusForClass(seamRadiusClass, viewDepth, float(renderSize.y));
            if (distancePixels > candidateSearchRadius) {
                continue;
            }

            float score = 1.0 - clamp(distancePixels / max(candidateSearchRadius, MESH_BLEND_EPSILON), 0.0, 1.0);
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

MeshBlendCandidate refineCandidateDirection(ivec2 pixel, ivec2 renderSize, MeshBlendCandidate candidate, vec2 randomValues) {
    if (candidate.distancePixels <= 2.0) {
        return candidate;
    }

    float centerAngle = atan(candidate.direction.y, candidate.direction.x);
    float angularHalfWidth = (MESH_BLEND_TWO_PI / float(MESH_BLEND_DIRECTION_COUNT)) * MESH_BLEND_DIRECTION_REFINEMENT_SECTOR_SCALE;
    float stepSize = max(1.0, candidate.distancePixels / float(MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT + 1));

    for (int sampleIndex = 0; sampleIndex < MESH_BLEND_DIRECTION_REFINEMENT_SAMPLE_COUNT; ++sampleIndex) {
        float sampleRandom = fract(randomValues.y + randomValues.x * 0.754877666 + float(sampleIndex) * 0.618033989);
        float angle = centerAngle + mix(-angularHalfWidth, angularHalfWidth, sampleRandom);
        vec2 direction = vec2(cos(angle), sin(angle));
        float testDistance = candidate.distancePixels - stepSize;

        for (int stepIndex = 0; stepIndex < MESH_BLEND_DIRECTION_REFINEMENT_STEP_COUNT; ++stepIndex) {
            if (testDistance <= 0.0) {
                break;
            }

            ivec2 samplePixel = pixel + ivec2(round(direction * testDistance));
            MeshBlendTag sampleTag = loadMeshBlendTag(samplePixel, renderSize);
            if (sampleTag.groupId != candidate.targetGroupId) {
                break;
            }

            candidate.direction = direction;
            candidate.distancePixels = testDistance;
            testDistance -= stepSize;
        }
    }

    return candidate;
}

MeshBlendCandidate refineExactBoundary(ivec2 pixel, ivec2 renderSize, MeshBlendCandidate candidate) {
    float distancePixels = candidate.distancePixels;

    for (int sampleIndex = 0; sampleIndex < MESH_BLEND_EXACT_EDGE_SAMPLE_COUNT; ++sampleIndex) {
        distancePixels -= 1.0;
        if (distancePixels <= 0.0) {
            break;
        }

        ivec2 samplePixel = pixel + ivec2(round(candidate.direction * distancePixels));
        MeshBlendTag sampleTag = loadMeshBlendTag(samplePixel, renderSize);
        if (sampleTag.groupId != candidate.targetGroupId) {
            break;
        }

        candidate.distancePixels = distancePixels;
    }

    return candidate;
}

bool hasTargetContinuation(ivec2 pixel, ivec2 renderSize, MeshBlendCandidate candidate, out ivec2 continuationPixel) {
    float continuationDistance = max(candidate.distancePixels * 2.0, candidate.distancePixels + 1.0);
    continuationPixel = clampPixel(pixel + ivec2(round(candidate.direction * continuationDistance)), renderSize);
    return loadMeshBlendTag(continuationPixel, renderSize).groupId == candidate.targetGroupId;
}

#ifdef MESH_BLEND_FOUR_NEIGHBOR_FALLBACK
MeshBlendCandidate findImmediateNeighborCandidate(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    float viewDepth,
    uint ignoredGroupId,
    uint preferredGroupId
) {
    MeshBlendCandidate best = invalidCandidate();

    for (int neighborIndex = 0; neighborIndex < 4; ++neighborIndex) {
        ivec2 offset;
        if (neighborIndex == 0) {
            offset = ivec2(1, 0);
        } else if (neighborIndex == 1) {
            offset = ivec2(-1, 0);
        } else if (neighborIndex == 2) {
            offset = ivec2(0, 1);
        } else {
            offset = ivec2(0, -1);
        }

        MeshBlendTag neighborTag = loadMeshBlendTag(pixel + offset, renderSize);
        if (neighborTag.groupId == 0u || neighborTag.groupId == currentTag.groupId || neighborTag.groupId == ignoredGroupId) {
            continue;
        }

        uint seamRadiusClass = min(currentTag.radiusClass, neighborTag.radiusClass);
        float candidateSearchRadius = searchRadiusForClass(seamRadiusClass, viewDepth, float(renderSize.y));
        if (candidateSearchRadius < 1.0) {
            continue;
        }

        float score = 1.0 - 1.0 / max(candidateSearchRadius, 1.0);
        if (neighborTag.groupId == preferredGroupId) {
            score += 1.0;
        }
        if (score > best.score) {
            best.targetGroupId = neighborTag.groupId;
            best.radiusClass = seamRadiusClass;
            best.direction = vec2(offset);
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
float reduceRadiusForTinyObject(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    MeshBlendCandidate candidate,
    out bool radiusReduced
) {
    float measuredThickness = candidate.searchRadiusPixels;
    bool foundOppositeBoundary = false;

    for (int probeIndex = 1; probeIndex <= MESH_BLEND_TINY_OBJECT_PROBE_COUNT; ++probeIndex) {
        float probeDistance = max(1.0, candidate.searchRadiusPixels * float(probeIndex) / float(MESH_BLEND_TINY_OBJECT_PROBE_COUNT));
        MeshBlendTag oppositeTag = loadMeshBlendTag(pixel - ivec2(round(candidate.direction * probeDistance)), renderSize);
        if (oppositeTag.groupId != currentTag.groupId) {
            measuredThickness = probeDistance;
            foundOppositeBoundary = true;
            break;
        }
    }

    int outsideDirectionCount = 0;
    for (int neighborIndex = 0; neighborIndex < 4; ++neighborIndex) {
        vec2 direction;
        if (neighborIndex == 0) {
            direction = vec2(1.0, 0.0);
        } else if (neighborIndex == 1) {
            direction = vec2(-1.0, 0.0);
        } else if (neighborIndex == 2) {
            direction = vec2(0.0, 1.0);
        } else {
            direction = vec2(0.0, -1.0);
        }

        MeshBlendTag radiusTag = loadMeshBlendTag(pixel + ivec2(round(direction * candidate.searchRadiusPixels)), renderSize);
        if (radiusTag.groupId != currentTag.groupId) {
            outsideDirectionCount++;
        }
    }

    radiusReduced = foundOppositeBoundary && outsideDirectionCount >= 3;
    if (!radiusReduced) {
        return candidate.searchRadiusPixels;
    }

    float thicknessRadius = max(1.0, measuredThickness * 1.25);
    return max(candidate.distancePixels, min(candidate.searchRadiusPixels, thicknessRadius));
}
#endif

int validateMeshBlendContact(
    ivec2 pixelA,
    ivec2 pixelE,
    ivec2 pixelB,
    ivec2 pixelC,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    MeshBlendCandidate candidate,
    bool allowMissingContinuation,
    out float narrowedSearchRadius,
    out vec3 currentViewPosition
) {
    currentViewPosition = vec3(0.0);
    MeshBlendTag tagE = loadMeshBlendTag(pixelE, renderSize);
    MeshBlendTag tagB = loadMeshBlendTag(pixelB, renderSize);
    MeshBlendTag tagC = loadMeshBlendTag(pixelC, renderSize);
    if (
        tagE.groupId != currentTag.groupId ||
        tagB.groupId != candidate.targetGroupId ||
        (!allowMissingContinuation && tagC.groupId != candidate.targetGroupId)
    ) {
        return MESH_BLEND_REJECTION_NO_CONTINUATION;
    }

    float depthA = loadMeshBlendDepth(pixelA, renderSize);
    float depthE = loadMeshBlendDepth(pixelE, renderSize);
    float depthB = loadMeshBlendDepth(pixelB, renderSize);
    float depthC = loadMeshBlendDepth(pixelC, renderSize);
    vec3 positionA = reconstructMeshBlendViewPosition(pixelA, renderSize, depthA);
    vec3 positionE = reconstructMeshBlendViewPosition(pixelE, renderSize, depthE);
    vec3 positionB = reconstructMeshBlendViewPosition(pixelB, renderSize, depthB);
    vec3 positionC = reconstructMeshBlendViewPosition(pixelC, renderSize, depthC);
    if (!isValidMeshBlendPosition(positionA) || !isValidMeshBlendPosition(positionE) || !isValidMeshBlendPosition(positionB) || !isValidMeshBlendPosition(positionC)) {
        return MESH_BLEND_REJECTION_INVALID_DEPTH;
    }
    currentViewPosition = positionA;

    float viewDepth = abs(positionA.z);
    float unitsPerPixel = worldUnitsPerPixel(viewDepth, float(renderSize.y));
    float effectiveWorldRadius = candidate.searchRadiusPixels * unitsPerPixel;
    float pixelTolerance = unitsPerPixel * MESH_BLEND_BOUNDARY_PIXEL_TOLERANCE;
    vec3 boundarySpan = positionB - positionE;
    float boundarySeparation = length(boundarySpan);
    if (boundarySeparation > effectiveWorldRadius * MESH_BLEND_BOUNDARY_SEPARATION_FACTOR + pixelTolerance) {
        return MESH_BLEND_REJECTION_DEPTH_SEPARATION;
    }

    float boundaryDepthDelta = abs(abs(positionB.z) - abs(positionE.z));
    float boundaryLateralSpan = length(boundarySpan.xy);
    if (
        boundaryDepthDelta > max(effectiveWorldRadius * MESH_BLEND_FOREGROUND_DEPTH_FACTOR, pixelTolerance) &&
        boundaryDepthDelta > boundaryLateralSpan * MESH_BLEND_FOREGROUND_LATERAL_FACTOR
    ) {
        return MESH_BLEND_REJECTION_FOREGROUND_BACKGROUND;
    }

    float targetSpan = distance(positionB, positionC);
    float totalSpan = distance(positionA, positionC);
    if (
        targetSpan > effectiveWorldRadius * MESH_BLEND_TARGET_SPAN_FACTOR + pixelTolerance ||
        totalSpan > effectiveWorldRadius * MESH_BLEND_TOTAL_SPAN_FACTOR + pixelTolerance
    ) {
        return MESH_BLEND_REJECTION_PHYSICAL_SPAN;
    }

    vec3 currentDirection = positionA - positionB;
    vec3 targetDirection = positionC - positionB;
    float currentLength = length(currentDirection);
    float targetLength = length(targetDirection);
    float oppositeFacing = 1.0;
    if (currentLength > MESH_BLEND_EPSILON && targetLength > MESH_BLEND_EPSILON) {
        oppositeFacing = -dot(currentDirection / currentLength, targetDirection / targetLength);
    }

    narrowedSearchRadius = candidate.searchRadiusPixels * calculateSlopeScale(oppositeFacing);
    if (candidate.distancePixels > narrowedSearchRadius) {
        return MESH_BLEND_REJECTION_CONTACT_ANGLE;
    }

    return MESH_BLEND_REJECTION_NONE;
}

float calculateMeshBlendFade(float distancePixels, float searchRadiusPixels) {
    float boundaryDistance = max(distancePixels - 0.5, 0.0);
    float normalizedDistance = clamp(boundaryDistance / max(searchRadiusPixels, MESH_BLEND_EPSILON), 0.0, 1.0);
    float inverseDistance = 1.0 - normalizedDistance;
    float fade = mix(inverseDistance * inverseDistance, inverseDistance, clamp(inverseDistance - 0.75, 0.0, 1.0));
    return fade * 0.5;
}

MeshBlendResult evaluateMeshBlend(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    float currentSearchRadius,
    float viewDepth,
    uint ignoredGroupId,
    vec2 randomValues,
    float rotation,
    float sectorAngle,
    vec2 direction0,
    vec2 direction1,
    vec2 direction2
) {
    MeshBlendResult result = invalidBlendResult();
    MeshBlendCandidate candidate = findInitialCandidate(
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

    ivec2 continuationPixel;
    bool continuationFound = hasTargetContinuation(pixel, renderSize, candidate, continuationPixel);
    if (!continuationFound) {
#ifdef MESH_BLEND_FOUR_NEIGHBOR_FALLBACK
        MeshBlendCandidate fallbackCandidate = findImmediateNeighborCandidate(
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
        continuationFound = hasTargetContinuation(pixel, renderSize, candidate, continuationPixel);
#else
        result.rejectionReason = MESH_BLEND_REJECTION_NO_CONTINUATION;
        return result;
#endif
    }

    result.continuationFound = continuationFound;
    result.stageReached = 4;
    float originalSearchRadius = candidate.searchRadiusPixels;

#ifdef MESH_BLEND_TINY_OBJECT_SAFEGUARD
    candidate.searchRadiusPixels = reduceRadiusForTinyObject(pixel, renderSize, currentTag, candidate, result.tinyObjectRadiusReduced);
    result.stageReached = 5;
#endif

    result.candidate = candidate;
    result.effectiveRadiusPixels = candidate.searchRadiusPixels;
    result.tinyObjectRadiusRatio = candidate.searchRadiusPixels / max(originalSearchRadius, MESH_BLEND_EPSILON);
    ivec2 pixelB = clampPixel(pixel + ivec2(round(candidate.direction * candidate.distancePixels)), renderSize);
    ivec2 pixelE = clampPixel(pixel + ivec2(round(candidate.direction * max(candidate.distancePixels - 2.0, 0.0))), renderSize);
    ivec2 pixelC = continuationFound ? continuationPixel : pixelB;
    float narrowedSearchRadius = candidate.searchRadiusPixels;
    result.rejectionReason = validateMeshBlendContact(
        pixel,
        pixelE,
        pixelB,
        pixelC,
        renderSize,
        currentTag,
        candidate,
        result.usedFallback && !continuationFound,
        narrowedSearchRadius,
        result.currentViewPosition
    );
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
    result.targetFarPixel = continuationFound ? continuationPixel : pixelB;
    result.stageReached = 7;
    result.valid = true;
    return result;
}

float meshBlendLinearToSrgbChannel(float value) {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * pow(value, 1.0 / 2.4) - 0.055;
}

float meshBlendSrgbToLinearChannel(float value) {
    return value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4);
}

vec3 meshBlendLinearToSrgb(vec3 color) {
    return vec3(
        meshBlendLinearToSrgbChannel(color.r),
        meshBlendLinearToSrgbChannel(color.g),
        meshBlendLinearToSrgbChannel(color.b)
    );
}

vec3 meshBlendSrgbToLinear(vec3 color) {
    return vec3(
        meshBlendSrgbToLinearChannel(color.r),
        meshBlendSrgbToLinearChannel(color.g),
        meshBlendSrgbToLinearChannel(color.b)
    );
}

float meshBlendSignedCubeRoot(float value) {
    return sign(value) * pow(abs(value), 1.0 / 3.0);
}

vec3 meshBlendLinearSrgbToOklab(vec3 color) {
    float longResponse = 0.4122214708 * color.r + 0.5363325363 * color.g + 0.0514459929 * color.b;
    float mediumResponse = 0.2119034982 * color.r + 0.6806995451 * color.g + 0.1073969566 * color.b;
    float shortResponse = 0.0883024619 * color.r + 0.2817188376 * color.g + 0.6299787005 * color.b;
    float longRoot = meshBlendSignedCubeRoot(longResponse);
    float mediumRoot = meshBlendSignedCubeRoot(mediumResponse);
    float shortRoot = meshBlendSignedCubeRoot(shortResponse);

    return vec3(
        0.2104542553 * longRoot + 0.7936177850 * mediumRoot - 0.0040720468 * shortRoot,
        1.9779984951 * longRoot - 2.4285922050 * mediumRoot + 0.4505937099 * shortRoot,
        0.0259040371 * longRoot + 0.7827717662 * mediumRoot - 0.8086757660 * shortRoot
    );
}

vec3 meshBlendOklabToLinearSrgb(vec3 color) {
    float longRoot = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
    float mediumRoot = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
    float shortRoot = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
    float longResponse = longRoot * longRoot * longRoot;
    float mediumResponse = mediumRoot * mediumRoot * mediumRoot;
    float shortResponse = shortRoot * shortRoot * shortRoot;

    return vec3(
        4.0767416621 * longResponse - 3.3077115913 * mediumResponse + 0.2309699292 * shortResponse,
        -1.2684380046 * longResponse + 2.6097574011 * mediumResponse - 0.3413193965 * shortResponse,
        -0.0041960863 * longResponse - 0.7034186147 * mediumResponse + 1.7076147010 * shortResponse
    );
}

vec3 interpolateMeshBlendColor(vec3 currentColor, vec3 targetColor, float factor) {
#ifdef MESH_BLEND_COLOR_INTERPOLATION_SRGB
    return meshBlendSrgbToLinear(mix(meshBlendLinearToSrgb(currentColor), meshBlendLinearToSrgb(targetColor), factor));
#else
    return meshBlendOklabToLinearSrgb(mix(meshBlendLinearSrgbToOklab(currentColor), meshBlendLinearSrgbToOklab(targetColor), factor));
#endif
}

float meshBlendLuminance(vec3 srgbColor) {
    return dot(srgbColor, vec3(0.2126, 0.7152, 0.0722));
}

MeshBlendTargetColorSamples constructMeshBlendTargetColorSamples(ivec2 renderSize, MeshBlendResult result) {
    MeshBlendTargetColorSamples samples;
    ivec2 boundaryPlusOnePixel = clampPixel(result.targetPixel + ivec2(round(result.candidate.direction)), renderSize);
    ivec2 boundaryPlusTwoPixel = clampPixel(result.targetPixel + ivec2(round(result.candidate.direction * 2.0)), renderSize);
    MeshBlendTag boundaryPlusOneTag = loadMeshBlendTag(boundaryPlusOnePixel, renderSize);
    MeshBlendTag boundaryPlusTwoTag = loadMeshBlendTag(boundaryPlusTwoPixel, renderSize);

    samples.fartherColor = texelFetch(textureSampler, result.targetFarPixel, 0);
    samples.boundaryPlusOneColor = texelFetch(textureSampler, boundaryPlusOnePixel, 0);
    samples.boundaryPlusTwoColor = texelFetch(textureSampler, boundaryPlusTwoPixel, 0);
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    samples.fartherBaseColor = texelFetch(meshBlendBaseColorSampler, result.targetFarPixel, 0).rgb;
    vec3 boundaryPlusOneBaseColor = texelFetch(meshBlendBaseColorSampler, boundaryPlusOnePixel, 0).rgb;
    vec3 boundaryPlusTwoBaseColor = texelFetch(meshBlendBaseColorSampler, boundaryPlusTwoPixel, 0).rgb;
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

    bool secondNearSampleIsTarget = boundaryPlusTwoTag.groupId == result.candidate.targetGroupId;
    float firstNearLuminance = meshBlendLuminance(meshBlendLinearToSrgb(samples.boundaryPlusOneColor.rgb));
    float secondNearLuminance = meshBlendLuminance(meshBlendLinearToSrgb(samples.boundaryPlusTwoColor.rgb));
    bool useSecondNearSample = secondNearSampleIsTarget && secondNearLuminance < firstNearLuminance;
    samples.conservativeNearColor = useSecondNearSample ? samples.boundaryPlusTwoColor : samples.boundaryPlusOneColor;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    samples.conservativeNearBaseColor = useSecondNearSample ? boundaryPlusTwoBaseColor : boundaryPlusOneBaseColor;
#endif
    samples.targetColor = mix(samples.fartherColor, samples.conservativeNearColor, MESH_BLEND_NEAR_EDGE_TARGET_WEIGHT);
    return samples;
}

vec4 applyMeshBlendNearSeamCorrection(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    MeshBlendResult result,
    MeshBlendTargetColorSamples samples,
    vec4 currentColor,
    out bool corrected
) {
    corrected = false;
    if (!samples.onePixelEdge || result.candidate.distancePixels > MESH_BLEND_NEAR_SEAM_MAX_DISTANCE) {
        return currentColor;
    }

    ivec2 oppositePixel = clampPixel(pixel - ivec2(round(result.candidate.direction)), renderSize);
    MeshBlendTag oppositeTag = loadMeshBlendTag(oppositePixel, renderSize);
    if (oppositeTag.groupId != currentTag.groupId) {
        return currentColor;
    }

    vec4 oppositeColor = texelFetch(textureSampler, oppositePixel, 0);
    float currentTargetDistance = distance(currentColor.rgb, samples.targetColor.rgb);
    float oppositeTargetDistance = distance(oppositeColor.rgb, samples.targetColor.rgb);
    if (currentTargetDistance + MESH_BLEND_NEAR_SEAM_COLOR_DELTA >= oppositeTargetDistance) {
        return currentColor;
    }

    corrected = true;
    return oppositeColor;
}

#ifdef MESH_BLEND_SHADOW_ESTIMATION
float estimateMeshBlendShadow(vec3 renderedLinear, vec3 baseColorLinear) {
    float renderedLuminance = meshBlendLuminance(meshBlendLinearToSrgb(renderedLinear));
    float baseLuminance = meshBlendLuminance(meshBlendLinearToSrgb(baseColorLinear));
    if (baseLuminance <= MESH_BLEND_BASE_LUMINANCE_EPSILON) {
        return 1.0;
    }
    return renderedLuminance / baseLuminance;
}

float calculateMeshBlendShadowAttenuation(vec3 currentColor, MeshBlendTargetColorSamples samples) {
    float fartherShadow = estimateMeshBlendShadow(samples.fartherColor.rgb, samples.fartherBaseColor);
    float nearShadow = estimateMeshBlendShadow(samples.conservativeNearColor.rgb, samples.conservativeNearBaseColor);
    float shadowDifference = abs(fartherShadow - nearShadow);
    float shadowMismatch = smoothstep(MESH_BLEND_SHADOW_DIFFERENCE_LOW, MESH_BLEND_SHADOW_DIFFERENCE_HIGH, shadowDifference);
    float currentLuminance = meshBlendLuminance(meshBlendLinearToSrgb(currentColor));
    float targetLuminance = meshBlendLuminance(meshBlendLinearToSrgb(samples.targetColor.rgb));
    float targetToCurrentRatio = targetLuminance / max(currentLuminance, MESH_BLEND_BASE_LUMINANCE_EPSILON);
    float targetIsNotDark = smoothstep(MESH_BLEND_TARGET_DARKER_RATIO, MESH_BLEND_TARGET_NON_DARK_RATIO, targetToCurrentRatio);
    return mix(1.0, MESH_BLEND_SHADOW_MIN_ATTENUATION, shadowMismatch * targetIsNotDark);
}
#endif

MeshBlendColorEvaluation evaluateMeshBlendColor(
    ivec2 pixel,
    ivec2 renderSize,
    MeshBlendTag currentTag,
    MeshBlendResult result
) {
    MeshBlendColorEvaluation evaluation;
    evaluation.samples = constructMeshBlendTargetColorSamples(renderSize, result);
    #ifdef MESH_BLEND_DEBUG_WORLD_POSITION
    evaluation.worldPosition = reconstructMeshBlendWorldPosition(result.currentViewPosition);
    #endif
    vec4 currentSceneColor = texelFetch(textureSampler, pixel, 0);
    evaluation.currentColor = applyMeshBlendNearSeamCorrection(
        pixel,
        renderSize,
        currentTag,
        result,
        evaluation.samples,
        currentSceneColor,
        evaluation.nearSeamCorrected
    );
    evaluation.shadowAttenuation = 1.0;
#ifdef MESH_BLEND_SHADOW_ESTIMATION
    evaluation.shadowAttenuation = calculateMeshBlendShadowAttenuation(evaluation.currentColor.rgb, evaluation.samples);
#endif
    evaluation.adjustedFade = result.fade * evaluation.shadowAttenuation;
    evaluation.blendedColor = vec4(
        interpolateMeshBlendColor(evaluation.currentColor.rgb, evaluation.samples.targetColor.rgb, evaluation.adjustedFade),
        mix(evaluation.currentColor.a, evaluation.samples.targetColor.a, evaluation.adjustedFade)
    );
    return evaluation;
}

vec3 radiusClassDebugColor(uint radiusClass) {
    if (radiusClass == 0u) {
        return vec3(0.15, 0.55, 1.0);
    }
    if (radiusClass == 1u) {
        return vec3(0.15, 0.9, 0.35);
    }
    if (radiusClass == 2u) {
        return vec3(1.0, 0.65, 0.1);
    }
    return vec3(0.95, 0.2, 0.65);
}

vec3 validationDebugColor(int rejectionReason, float narrowedRadiusRatio) {
    if (rejectionReason == MESH_BLEND_REJECTION_NONE) {
        return mix(vec3(0.1, 0.55, 1.0), vec3(0.2, 1.0, 0.25), narrowedRadiusRatio);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_NO_CANDIDATE) {
        return vec3(0.12);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_NO_CONTINUATION) {
        return vec3(0.75, 0.1, 0.85);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_INVALID_DEPTH) {
        return vec3(1.0, 0.0, 1.0);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_DEPTH_SEPARATION) {
        return vec3(1.0, 0.1, 0.1);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_FOREGROUND_BACKGROUND) {
        return vec3(1.0, 0.4, 0.05);
    }
    if (rejectionReason == MESH_BLEND_REJECTION_PHYSICAL_SPAN) {
        return vec3(1.0, 0.9, 0.05);
    }
    return vec3(0.05, 0.8, 1.0);
}

vec3 processingStageDebugColor(int stageReached) {
    if (stageReached <= 0) {
        return vec3(0.03);
    }
    if (stageReached == 1) {
        return vec3(0.1, 0.15, 0.45);
    }
    if (stageReached == 2) {
        return vec3(0.1, 0.35, 0.7);
    }
    if (stageReached == 3) {
        return vec3(0.05, 0.65, 0.8);
    }
    if (stageReached == 4) {
        return vec3(0.1, 0.8, 0.55);
    }
    if (stageReached == 5) {
        return vec3(0.45, 0.9, 0.25);
    }
    if (stageReached == 6) {
        return vec3(0.95, 0.75, 0.1);
    }
    return vec3(0.15, 1.0, 0.25);
}

vec3 candidateDebugColor(MeshBlendResult result) {
    if (!result.candidate.valid) {
        return vec3(0.04);
    }

    float normalizedDistance = clamp(
        result.candidate.distancePixels / max(result.candidate.searchRadiusPixels, MESH_BLEND_EPSILON),
        0.0,
        1.0
    );
    return vec3(result.candidate.direction * 0.5 + 0.5, 1.0 - normalizedDistance);
}

#define CUSTOM_FRAGMENT_DEFINITIONS

void main(void) {
    ivec2 renderSize = textureSize(meshBlendDepthSampler, 0);
    ivec2 pixel = clampPixel(ivec2(floor(vUV * vec2(renderSize))), renderSize);
    MeshBlendTag currentTag = loadMeshBlendTag(pixel, renderSize);

#ifdef MESH_BLEND_DEBUG_PACKED_TAG
    float groupVariation = 0.45 + 0.55 * fract(float(currentTag.groupId) * 0.61803398875);
    vec3 tagColor = radiusClassDebugColor(currentTag.radiusClass) * groupVariation;
    gl_FragColor = currentTag.groupId == 0u ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(tagColor, 1.0);
    return;
#endif

    if (currentTag.groupId == 0u) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
#else
        gl_FragColor = texelFetch(textureSampler, pixel, 0);
#endif
        return;
    }

    float sizingDepth = loadMeshBlendDepth(pixel, renderSize);
    vec3 sizingPosition = reconstructMeshBlendViewPosition(pixel, renderSize, sizingDepth);
    if (!isValidMeshBlendPosition(sizingPosition)) {
#ifdef MESH_BLEND_DEBUG_REJECTION_REASON
        gl_FragColor = vec4(validationDebugColor(MESH_BLEND_REJECTION_INVALID_DEPTH, 0.0), 1.0);
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
        gl_FragColor = vec4(0.45, 0.1, 0.1, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        gl_FragColor = vec4(0.4, 0.05, 0.4, 1.0);
#else
        gl_FragColor = texelFetch(textureSampler, pixel, 0);
#endif
        return;
    }

    float currentViewDepth = abs(sizingPosition.z);
    float currentSearchRadius = searchRadiusForClass(currentTag.radiusClass, currentViewDepth, float(renderSize.y));
    if (currentSearchRadius < 1.0) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        gl_FragColor = vec4(radiusClassDebugColor(currentTag.radiusClass) * 0.25, 1.0);
#elif defined(MESH_BLEND_DEBUG_REJECTION_REASON)
        gl_FragColor = vec4(validationDebugColor(MESH_BLEND_REJECTION_PHYSICAL_SPAN, 0.0), 1.0);
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
        gl_FragColor = vec4(0.2, 0.2, 0.65, 1.0);
#elif defined(MESH_BLEND_DEBUG_ENABLED)
        gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
#else
        gl_FragColor = texelFetch(textureSampler, pixel, 0);
#endif
        return;
    }

    vec2 randomValues = loadStableBlueNoise(pixel);
    float sectorAngle = MESH_BLEND_TWO_PI / float(MESH_BLEND_DIRECTION_COUNT);
        float rotation;
#ifdef MESH_BLEND_FULL_RANDOM_ROTATION
        rotation = randomValues.x * sectorAngle;
#else
        rotation = floor(randomValues.x * 8.0) * 0.125 * sectorAngle;
#endif
        vec2 direction0 = vec2(cos(rotation), sin(rotation));
        vec2 direction1 = vec2(cos(rotation + sectorAngle), sin(rotation + sectorAngle));
        vec2 direction2 = vec2(cos(rotation + sectorAngle * 2.0), sin(rotation + sectorAngle * 2.0));

        MeshBlendResult primaryResult = evaluateMeshBlend(
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

        MeshBlendResult secondaryResult = invalidBlendResult();
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
        gl_FragColor = vec4(candidateDebugColor(primaryResult), 1.0);
        return;
#elif defined(MESH_BLEND_DEBUG_CONTINUATION)
        if (!primaryResult.candidate.valid) {
            gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
        } else if (primaryResult.rejectionReason == MESH_BLEND_REJECTION_NO_CONTINUATION) {
            gl_FragColor = vec4(0.85, 0.05, 0.7, 1.0);
        } else if (primaryResult.usedFallback) {
            gl_FragColor = vec4(1.0, 0.75, 0.05, 1.0);
        } else {
            gl_FragColor = vec4(0.1, 0.9, 0.25, 1.0);
        }
        return;
#elif defined(MESH_BLEND_DEBUG_TINY_OBJECT)
        #ifdef MESH_BLEND_TINY_OBJECT_SAFEGUARD
            if (!primaryResult.candidate.valid) {
                gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
            } else {
                vec3 radiusColor = mix(vec3(1.0, 0.1, 0.05), vec3(0.1, 0.65, 1.0), primaryResult.tinyObjectRadiusRatio);
                gl_FragColor = vec4(primaryResult.tinyObjectRadiusReduced ? radiusColor : radiusColor * 0.45, 1.0);
            }
        #else
            gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
        #endif
        return;
#elif defined(MESH_BLEND_DEBUG_MULTI_TARGET)
        #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
            if (secondaryResult.valid) {
                gl_FragColor = vec4(0.95, 0.95, 1.0, 1.0);
            } else if (secondaryResult.candidate.valid) {
                gl_FragColor = vec4(0.8, 0.15, 0.75, 1.0);
            } else if (primaryResult.valid) {
                gl_FragColor = vec4(0.1, 0.45, 0.95, 1.0);
            } else {
                gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
            }
        #else
            gl_FragColor = primaryResult.valid ? vec4(0.1, 0.45, 0.95, 1.0) : vec4(0.04, 0.04, 0.04, 1.0);
        #endif
        return;
#elif defined(MESH_BLEND_DEBUG_REJECTION_REASON)
        float narrowedRadiusRatio = primaryResult.candidate.valid
            ? primaryResult.effectiveRadiusPixels / max(primaryResult.candidate.searchRadiusPixels, MESH_BLEND_EPSILON)
            : 0.0;
        gl_FragColor = vec4(validationDebugColor(primaryResult.rejectionReason, narrowedRadiusRatio), 1.0);
        return;
#elif defined(MESH_BLEND_DEBUG_STAGE_WORK)
        int stageReached = primaryResult.stageReached;
        #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
            stageReached = max(stageReached, secondaryResult.stageReached);
        #endif
        gl_FragColor = vec4(processingStageDebugColor(stageReached), 1.0);
        return;
#endif

        if (!primaryResult.valid) {
#ifdef MESH_BLEND_DEBUG_SEAM_FADE
            uint debugRadiusClass = primaryResult.candidate.valid ? primaryResult.candidate.radiusClass : currentTag.radiusClass;
            gl_FragColor = vec4(radiusClassDebugColor(debugRadiusClass) * 0.25, 1.0);
#elif defined(MESH_BLEND_DEBUG_TARGET_COLOR) || defined(MESH_BLEND_DEBUG_SHADOW_ATTENUATION) || defined(MESH_BLEND_DEBUG_COLOR_INTERPOLATION) || defined(MESH_BLEND_DEBUG_WORLD_POSITION)
            gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0);
#else
            gl_FragColor = texelFetch(textureSampler, pixel, 0);
#endif
            return;
        }

#ifdef MESH_BLEND_DEBUG_SEAM_FADE
        float debugFade = primaryResult.fade;
        #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
            if (secondaryResult.valid) {
                debugFade = min(0.5, primaryResult.fade + secondaryResult.fade);
            }
        #endif
        vec3 classColor = radiusClassDebugColor(primaryResult.candidate.radiusClass) * 0.25;
        gl_FragColor = vec4(mix(classColor, vec3(1.0), clamp(debugFade * 2.0, 0.0, 1.0)), 1.0);
        return;
#else
        MeshBlendColorEvaluation primaryColorEvaluation = evaluateMeshBlendColor(pixel, renderSize, currentTag, primaryResult);

#ifdef MESH_BLEND_DEBUG_WORLD_POSITION
        gl_FragColor = vec4(fract(primaryColorEvaluation.worldPosition * 0.1), 1.0);
        return;
#elif defined(MESH_BLEND_DEBUG_TARGET_COLOR)
        int targetSampleIndex = (pixel.x / 4) % 4;
        if (targetSampleIndex == 0) {
            gl_FragColor = primaryColorEvaluation.samples.fartherColor;
        } else if (targetSampleIndex == 1) {
            gl_FragColor = primaryColorEvaluation.samples.boundaryPlusOneColor;
        } else if (targetSampleIndex == 2) {
            gl_FragColor = primaryColorEvaluation.samples.boundaryPlusTwoColor;
        } else {
            gl_FragColor = primaryColorEvaluation.samples.targetColor;
        }
        return;
#elif defined(MESH_BLEND_DEBUG_SHADOW_ATTENUATION)
        gl_FragColor = vec4(
            1.0 - primaryColorEvaluation.shadowAttenuation,
            primaryColorEvaluation.shadowAttenuation,
            primaryColorEvaluation.nearSeamCorrected ? 1.0 : 0.0,
            1.0
        );
        return;
#elif defined(MESH_BLEND_DEBUG_COLOR_INTERPOLATION)
        #ifdef MESH_BLEND_COLOR_INTERPOLATION_SRGB
            vec3 interpolationModeColor = vec3(1.0, 0.4, 0.05);
        #else
            vec3 interpolationModeColor = vec3(0.1, 0.75, 1.0);
        #endif
        float interpolationStage = mix(0.35, 1.0, clamp(primaryColorEvaluation.adjustedFade * 2.0, 0.0, 1.0));
        gl_FragColor = vec4(interpolationModeColor * interpolationStage, 1.0);
        return;
#else
        #ifdef MESH_BLEND_MULTI_TARGET_SECONDARY_BLEND
            if (secondaryResult.valid) {
                MeshBlendColorEvaluation secondaryColorEvaluation = evaluateMeshBlendColor(pixel, renderSize, currentTag, secondaryResult);
                float totalBoundaryDistance = max(
                    primaryResult.candidate.distancePixels + secondaryResult.candidate.distancePixels,
                    MESH_BLEND_EPSILON
                );
                float primaryRelativeProximity = secondaryResult.candidate.distancePixels / totalBoundaryDistance;
                float secondaryRelativeProximity = primaryResult.candidate.distancePixels / totalBoundaryDistance;
                float primaryWeight = primaryColorEvaluation.adjustedFade * primaryRelativeProximity;
                float secondaryWeight = secondaryColorEvaluation.adjustedFade * secondaryRelativeProximity;
                float combinedWeight = primaryWeight + secondaryWeight;
                if (combinedWeight <= MESH_BLEND_EPSILON) {
                    gl_FragColor = texelFetch(textureSampler, pixel, 0);
                    return;
                }
                gl_FragColor = (primaryColorEvaluation.blendedColor * primaryWeight + secondaryColorEvaluation.blendedColor * secondaryWeight) / combinedWeight;
                return;
            }
        #endif

        gl_FragColor = primaryColorEvaluation.blendedColor;
#endif
#endif
}
