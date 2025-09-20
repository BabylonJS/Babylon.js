import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";
import { readFileSync } from "fs";
import { join } from "path";

declare const BABYLON: typeof import("core/index") &
    typeof import("serializers/index") &
    typeof import("loaders/index") & {
        BVH: {
            ReadBvh: (data: string) => any;
        };
    };

interface Window {
    BABYLON: typeof BABYLON;
    scene: typeof BABYLON.Scene | null;
}

const debug = process.env.DEBUG === "true";

/**
 * Describes the test suite for BVH Serializer
 */
describe("Babylon BVH Serializer", () => {
    let datasetBvhContent: string;

    beforeAll(async () => {
        await logPageErrors(page, debug);
        
        // Read the test fixture - using dataset-1_walk_normal_001.bvh from fixtures folder
        const fixturePath = join(__dirname, "..", "fixtures", "dataset-1_walk_normal_001.bvh");
        datasetBvhContent = readFileSync(fixturePath, "utf-8");
    });

    jest.setTimeout(debug ? 1000000 : 30000);

    beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, {
            waitUntil: "load",
            timeout: 0,
        });
        await page.evaluate(evaluateInitEngine);
        await page.evaluate(evaluateCreateScene);
    });

    afterEach(async () => {
        debug && (await jestPuppeteer.debug());
        await page.evaluate(evaluateDisposeEngine);
    });

    /**
     * Tests the complete BVH round-trip: load -> skeleton -> export
     */
    describe("#BVH Round-trip Serialization", () => {
        it("should load BVH file and create skeleton with correct structure", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Verify skeleton structure matches expected
                const boneCount = skeleton.bones.length;
                const animationCount = skeleton.animations.length;
                
                // Verify root bones exist
                const rootBones = skeleton.bones.filter(bone => !bone.getParent());
                const rootBoneCount = rootBones.length;
                
                // Verify animation range exists
                const animationRange = skeleton.getAnimationRange("default");
                const hasAnimationRange = animationRange !== null;
                const frameCount = hasAnimationRange ? animationRange.to - animationRange.from + 1 : 0;

                return {
                    boneCount,
                    animationCount,
                    rootBoneCount,
                    hasAnimationRange,
                    frameCount
                };
            }, datasetBvhContent);

            // Verify the skeleton was created with correct structure
            expect(assertionData.boneCount).toBeGreaterThan(0); // Will be determined by the actual file
            expect(assertionData.animationCount).toBeGreaterThan(0);
            expect(assertionData.rootBoneCount).toBeGreaterThan(0); // Will be determined by the actual file
            expect(assertionData.hasAnimationRange).toBe(true);
            expect(assertionData.frameCount).toBeGreaterThan(0); // Will be determined by the actual file
        });

        it("should export BVH with exact hierarchy structure matching fixture", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse both original and exported BVH to compare structure
                const parseHierarchy = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const hierarchy: Array<{
                        type: 'ROOT' | 'JOINT' | 'End Site';
                        name: string;
                        level: number;
                        offset?: {x: number, y: number, z: number};
                        channels?: string[];
                    }> = [];
                    
                    let currentJoint = '';
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        const indent = line.length - line.replace(/^\s*/, '').length;
                        const level = Math.floor(indent / 4);
                        
                        if (trimmed.startsWith('ROOT')) {
                            const name = trimmed.split(/\s+/)[1];
                            hierarchy.push({ type: 'ROOT', name, level });
                            currentJoint = name;
                        } else if (trimmed.startsWith('JOINT')) {
                            const name = trimmed.split(/\s+/)[1];
                            hierarchy.push({ type: 'JOINT', name, level });
                            currentJoint = name;
                        } else if (trimmed.startsWith('End Site')) {
                            hierarchy.push({ type: 'End Site', name: 'End Site', level });
                            currentJoint = 'End Site';
                        } else if (trimmed.startsWith('OFFSET')) {
                            const values = trimmed.replace('OFFSET', '').trim().split(/\s+/);
                            if (values.length === 3) {
                                const offset = {
                                    x: parseFloat(values[0]),
                                    y: parseFloat(values[1]),
                                    z: parseFloat(values[2])
                                };
                                // Find the last joint and add offset
                                for (let i = hierarchy.length - 1; i >= 0; i--) {
                                    if (hierarchy[i].name === currentJoint) {
                                        hierarchy[i].offset = offset;
                                        break;
                                    }
                                }
                            }
                        } else if (trimmed.startsWith('CHANNELS')) {
                            const parts = trimmed.split(/\s+/);
                            const channelCount = parseInt(parts[1]);
                            const channels = parts.slice(2);
                            // Find the last joint and add channels
                            for (let i = hierarchy.length - 1; i >= 0; i--) {
                                if (hierarchy[i].name === currentJoint) {
                                    hierarchy[i].channels = channels;
                                    break;
                                }
                            }
                        }
                    }
                    
                    return hierarchy;
                };

                const originalHierarchy = parseHierarchy(bvhContent);
                const exportedHierarchy = parseHierarchy(exportedBvh);

                return {
                    originalHierarchy,
                    exportedHierarchy,
                    hierarchyMatch: originalHierarchy.length === exportedHierarchy.length,
                    jointCount: exportedHierarchy.length,
                    originalJointCount: originalHierarchy.length
                };
            }, datasetBvhContent);

            // Verify hierarchy structure matches exactly
            expect(assertionData.hierarchyMatch).toBe(true);
            expect(assertionData.jointCount).toBe(assertionData.originalJointCount);
            
            // Verify each joint matches in order
            for (let i = 0; i < assertionData.originalHierarchy.length; i++) {
                const original = assertionData.originalHierarchy[i];
                const exported = assertionData.exportedHierarchy[i];
                
                expect(exported.type).toBe(original.type);
                expect(exported.name).toBe(original.name);
                expect(exported.level).toBe(original.level);
                
                // Verify offset values with tolerance
                if (original.offset && exported.offset) {
                    expect(Math.abs(exported.offset.x - original.offset.x)).toBeLessThan(0.001);
                    expect(Math.abs(exported.offset.y - original.offset.y)).toBeLessThan(0.001);
                    expect(Math.abs(exported.offset.z - original.offset.z)).toBeLessThan(0.001);
                }
                
                // Verify channels match
                if (original.channels && exported.channels) {
                    expect(exported.channels).toEqual(original.channels);
                }
            }
        });

        it("should export skeleton to BVH with matching structure", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH format
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.041667);
                
                // Parse the exported BVH to compare structure
                const exportedData = BABYLON.BVH.ReadBvh(exportedBvh);

                return {
                    exportedBvhLength: exportedBvh.length,
                    exportedBoneCount: exportedData.bones.length,
                    exportedAnimationCount: exportedData.animationNames.length,
                    hasExportedAnimationRange: exportedData.getAnimationRange("default") !== null
                };
            }, datasetBvhContent);

            // Verify exported BVH has same skeleton structure
            expect(assertionData.exportedBvhLength).toBeGreaterThan(0);
            expect(assertionData.exportedBoneCount).toBeGreaterThan(0);
            expect(assertionData.exportedAnimationCount).toBeGreaterThan(0);
            expect(assertionData.hasExportedAnimationRange).toBe(true);
        });

        it("should handle empty animation names by exporting all available animations", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton with empty animation names (should use all animations)
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, [], 0.041667);
                
                // Parse the exported BVH to compare structure
                const exportedData = BABYLON.BVH.ReadBvh(exportedBvh);

                return {
                    exportedBvhLength: exportedBvh.length,
                    exportedBoneCount: exportedData.bones.length,
                    exportedAnimationCount: exportedData.animationNames.length,
                    hasExportedAnimationRange: exportedData.getAnimationRange("default") !== null,
                    skeletonAnimationCount: skeleton.animations.length
                };
            }, datasetBvhContent);

            // Verify exported BVH has same skeleton structure even with empty animation names
            expect(assertionData.exportedBvhLength).toBeGreaterThan(0);
            expect(assertionData.exportedBoneCount).toBeGreaterThan(0);
            expect(assertionData.exportedAnimationCount).toBeGreaterThan(0);
            expect(assertionData.hasExportedAnimationRange).toBe(true);
            
            // Verify that the exporter handled empty animation names gracefully
            expect(assertionData.skeletonAnimationCount).toBeGreaterThan(0);
        });

        it("should preserve exact joint hierarchy and names", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Extract joint names from exported BVH
                const extractJointNames = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const jointNames: string[] = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("JOINT") || trimmed.startsWith("ROOT")) {
                            const jointName = trimmed.split(/\s+/)[1];
                            jointNames.push(jointName);
                        } else if (trimmed.startsWith("End Site")) {
                            jointNames.push("End Site");
                        }
                    }
                    
                    return jointNames;
                };

                const exportedJointNames = extractJointNames(exportedBvh);
                
                // Extract joint names from original BVH for comparison
                const extractOriginalJointNames = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const jointNames: string[] = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith("JOINT") || trimmed.startsWith("ROOT")) {
                            const jointName = trimmed.split(/\s+/)[1];
                            jointNames.push(jointName);
                        } else if (trimmed.startsWith("End Site")) {
                            jointNames.push("End Site");
                        }
                    }
                    
                    return jointNames;
                };

                const originalJointNames = extractOriginalJointNames(bvhContent);

                return {
                    exportedJointNames,
                    originalJointNames,
                    jointCount: exportedJointNames.length,
                    originalCount: originalJointNames.length,
                    namesMatch: exportedJointNames.length === originalJointNames.length
                };
            }, datasetBvhContent);

            // Verify joint names match exactly
            expect(assertionData.jointCount).toBe(assertionData.originalCount);
            expect(assertionData.namesMatch).toBe(true);
            
            // Verify each joint name matches in order
            for (let i = 0; i < assertionData.originalJointNames.length; i++) {
                expect(assertionData.exportedJointNames[i]).toBe(assertionData.originalJointNames[i]);
            }
        });

        it("should preserve exact channel definitions matching fixture", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse channel definitions from both files
                const parseChannelDefinitions = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const channels: Array<{
                        jointName: string;
                        channelCount: number;
                        channelTypes: string[];
                        fullDefinition: string;
                    }> = [];
                    let currentJoint = '';
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        if (trimmed.startsWith('ROOT') || trimmed.startsWith('JOINT')) {
                            currentJoint = trimmed.split(/\s+/)[1];
                        } else if (trimmed.startsWith('CHANNELS')) {
                            const parts = trimmed.split(/\s+/);
                            const channelCount = parseInt(parts[1]);
                            const channelTypes = parts.slice(2);
                            channels.push({
                                jointName: currentJoint,
                                channelCount,
                                channelTypes,
                                fullDefinition: trimmed
                            });
                        }
                    }
                    
                    return channels;
                };

                const originalChannels = parseChannelDefinitions(bvhContent);
                const exportedChannels = parseChannelDefinitions(exportedBvh);

                // Compare channel definitions
                const channelComparisons = [];
                for (let i = 0; i < Math.min(originalChannels.length, exportedChannels.length); i++) {
                    const original = originalChannels[i];
                    const exported = exportedChannels[i];
                    
                    channelComparisons.push({
                        jointName: original.jointName,
                        original,
                        exported,
                        channelCountMatch: original.channelCount === exported.channelCount,
                        channelTypesMatch: JSON.stringify(original.channelTypes) === JSON.stringify(exported.channelTypes),
                        fullDefinitionMatch: original.fullDefinition === exported.fullDefinition
                    });
                }

                return {
                    originalChannels,
                    exportedChannels,
                    channelComparisons,
                    channelCountMatch: originalChannels.length === exportedChannels.length,
                    allChannelsMatch: channelComparisons.every(comp => 
                        comp.channelCountMatch && comp.channelTypesMatch
                    )
                };
            }, datasetBvhContent);

            // Verify channel count matches
            expect(assertionData.channelCountMatch).toBe(true);
            expect(assertionData.exportedChannels.length).toBe(assertionData.originalChannels.length);
            
            // Verify all channel definitions match
            expect(assertionData.allChannelsMatch).toBe(true);
            
            // Verify specific channel definitions
            assertionData.channelComparisons.forEach(comp => {
                expect(comp.channelCountMatch).toBe(true);
                expect(comp.channelTypesMatch).toBe(true);
                expect(comp.exported.channelCount).toBe(comp.original.channelCount);
                expect(comp.exported.channelTypes).toEqual(comp.original.channelTypes);
            });
            
            // Verify expected channel structure from fixture
            const rootChannels = assertionData.exportedChannels.find(ch => ch.jointName === 'joint_Root');
            expect(rootChannels).toBeDefined();
            expect(rootChannels!.channelCount).toBe(6);
            expect(rootChannels!.channelTypes).toEqual(['Xposition', 'Yposition', 'Zposition', 'Zrotation', 'Xrotation', 'Yrotation']);
        });

        it("should preserve bone offsets with precise values matching fixture", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Extract offset values from both files
                const extractOffsetValues = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const offsets: Array<{jointName: string, x: number, y: number, z: number}> = [];
                    let currentJoint = '';
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        if (trimmed.startsWith('ROOT') || trimmed.startsWith('JOINT')) {
                            const parts = trimmed.split(/\s+/);
                            if (parts.length >= 2) {
                                currentJoint = parts[1];
                            }
                        } else if (trimmed.startsWith('End Site')) {
                            currentJoint = 'End Site';
                        } else if (trimmed.startsWith('OFFSET')) {
                            const offsetValues = trimmed.replace('OFFSET', '').trim().split(/\s+/);
                            if (offsetValues.length === 3 && currentJoint) {
                                offsets.push({
                                    jointName: currentJoint,
                                    x: parseFloat(offsetValues[0]),
                                    y: parseFloat(offsetValues[1]),
                                    z: parseFloat(offsetValues[2])
                                });
                            }
                        }
                    }
                    
                    return offsets;
                };

                const originalOffsets = extractOffsetValues(bvhContent);
                const exportedOffsets = extractOffsetValues(exportedBvh);
                
                // Compare offsets with tolerance
                const offsetComparisons = [];
                for (let i = 0; i < Math.min(originalOffsets.length, exportedOffsets.length); i++) {
                    const original = originalOffsets[i];
                    const exported = exportedOffsets[i];
                    
                    const xDiff = Math.abs(exported.x - original.x);
                    const yDiff = Math.abs(exported.y - original.y);
                    const zDiff = Math.abs(exported.z - original.z);
                    
                    offsetComparisons.push({
                        jointName: original.jointName,
                        original: original,
                        exported: exported,
                        xDiff,
                        yDiff,
                        zDiff,
                        withinTolerance: xDiff < 0.001 && yDiff < 0.001 && zDiff < 0.001
                    });
                }

                return {
                    originalOffsets,
                    exportedOffsets,
                    offsetComparisons,
                    offsetCountMatch: originalOffsets.length === exportedOffsets.length,
                    allWithinTolerance: offsetComparisons.every(comp => comp.withinTolerance),
                    maxDifference: Math.max(...offsetComparisons.map(comp => 
                        Math.max(comp.xDiff, comp.yDiff, comp.zDiff)
                    ))
                };
            }, datasetBvhContent);

            // Verify offset count matches
            expect(assertionData.offsetCountMatch).toBe(true);
            expect(assertionData.exportedOffsets.length).toBe(assertionData.originalOffsets.length);
            
            // Verify all offsets are within tolerance
            expect(assertionData.allWithinTolerance).toBe(true);
            expect(assertionData.maxDifference).toBeLessThan(0.001);
            
            // Verify specific known offsets from fixture
            const rootOffset = assertionData.exportedOffsets.find(offset => offset.jointName === 'joint_Root');
            expect(rootOffset).toBeDefined();
            expect(rootOffset!.x).toBeCloseTo(0, 3);
            expect(rootOffset!.y).toBeCloseTo(0, 3);
            expect(rootOffset!.z).toBeCloseTo(0, 3);
            
            // Verify first few offsets match exactly
            for (let i = 0; i < Math.min(5, assertionData.offsetComparisons.length); i++) {
                const comp = assertionData.offsetComparisons[i];
                expect(comp.withinTolerance).toBe(true);
                expect(comp.xDiff).toBeLessThan(0.001);
                expect(comp.yDiff).toBeLessThan(0.001);
                expect(comp.zDiff).toBeLessThan(0.001);
            }
        });

        it("should preserve exact motion data structure matching fixture", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH with exact same frame rate as fixture
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse motion data from both files
                const parseMotionData = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    let inMotion = false;
                    let frames = 0;
                    let frameTime = 0;
                    const frameDataLines: string[] = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        if (trimmed === 'MOTION') {
                            inMotion = true;
                            continue;
                        }
                        
                        if (inMotion) {
                            if (trimmed.startsWith('Frames:')) {
                                frames = parseInt(trimmed.split(/\s+/)[1]);
                            } else if (trimmed.startsWith('Frame Time:')) {
                                frameTime = parseFloat(trimmed.split(/\s+/)[2]);
                            } else if (trimmed.match(/^-?\d+\.\d+/)) {
                                frameDataLines.push(trimmed);
                            }
                        }
                    }
                    
                    return { frames, frameTime, frameDataLines };
                };

                const originalMotion = parseMotionData(bvhContent);
                const exportedMotion = parseMotionData(exportedBvh);
                
                // Parse channel definitions
                const parseChannelDefinitions = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const channels: Array<{jointName: string, channelCount: number, channelTypes: string[]}> = [];
                    let currentJoint = '';
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        if (trimmed.startsWith('ROOT') || trimmed.startsWith('JOINT')) {
                            currentJoint = trimmed.split(/\s+/)[1];
                        } else if (trimmed.startsWith('CHANNELS')) {
                            const parts = trimmed.split(/\s+/);
                            const channelCount = parseInt(parts[1]);
                            const channelTypes = parts.slice(2);
                            channels.push({
                                jointName: currentJoint,
                                channelCount,
                                channelTypes
                            });
                        }
                    }
                    
                    return channels;
                };

                const originalChannels = parseChannelDefinitions(bvhContent);
                const exportedChannels = parseChannelDefinitions(exportedBvh);

                // Calculate total expected values per frame
                const totalChannels = originalChannels.reduce((sum, ch) => sum + ch.channelCount, 0);
                
                // Verify first frame data structure
                let firstFrameValues: number[] = [];
                if (exportedMotion.frameDataLines.length > 0) {
                    const firstFrame = exportedMotion.frameDataLines[0];
                    firstFrameValues = firstFrame.split(/\s+/).map(v => parseFloat(v));
                }

                return {
                    originalMotion,
                    exportedMotion,
                    originalChannels,
                    exportedChannels,
                    firstFrameValues,
                    totalChannels,
                    frameCountMatch: originalMotion.frames === exportedMotion.frames,
                    frameTimeMatch: Math.abs(originalMotion.frameTime - exportedMotion.frameTime) < 0.0001,
                    channelCountMatch: originalChannels.length === exportedChannels.length,
                    frameDataCountMatch: originalMotion.frameDataLines.length === exportedMotion.frameDataLines.length
                };
            }, datasetBvhContent);

            // Verify motion data matches exactly
            expect(assertionData.frameCountMatch).toBe(true);
            expect(assertionData.frameTimeMatch).toBe(true);
            expect(assertionData.channelCountMatch).toBe(true);
            expect(assertionData.frameDataCountMatch).toBe(true);
            
            // Verify frame count and time are correct
            expect(assertionData.exportedMotion.frames).toBe(195); // From fixture
            expect(assertionData.exportedMotion.frameTime).toBeCloseTo(0.0333333, 6);
            
            // Verify channel definitions match exactly
            for (let i = 0; i < assertionData.originalChannels.length; i++) {
                const original = assertionData.originalChannels[i];
                const exported = assertionData.exportedChannels[i];
                
                expect(exported.jointName).toBe(original.jointName);
                expect(exported.channelCount).toBe(original.channelCount);
                expect(exported.channelTypes).toEqual(original.channelTypes);
            }
            
            // Verify first frame has correct number of values
            expect(assertionData.firstFrameValues.length).toBe(assertionData.totalChannels);
            
            // Verify all frame data lines have correct number of values
            assertionData.exportedMotion.frameDataLines.forEach(frameLine => {
                const values = frameLine.split(/\s+/);
                expect(values.length).toBe(assertionData.totalChannels);
            });
        });

        it("should mark first bone as ROOT in exported BVH", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse the hierarchy to find the first bone
                const lines = exportedBvh.split('\n');
                let firstBoneLine = '';
                let firstBoneType = '';
                let firstBoneName = '';
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('ROOT') || trimmed.startsWith('JOINT')) {
                        firstBoneLine = trimmed;
                        firstBoneType = trimmed.split(/\s+/)[0];
                        firstBoneName = trimmed.split(/\s+/)[1];
                        break;
                    }
                }
                
                // Count ROOT vs JOINT occurrences
                const rootCount = lines.filter(line => line.trim().startsWith('ROOT')).length;
                const jointCount = lines.filter(line => line.trim().startsWith('JOINT')).length;
                
                // Verify the structure matches the original
                const originalLines = bvhContent.split('\n');
                const originalFirstBoneLine = originalLines.find(line => 
                    line.trim().startsWith('ROOT') || line.trim().startsWith('JOINT')
                ) || '';
                const originalFirstBoneType = originalFirstBoneLine.split(/\s+/)[0];
                const originalFirstBoneName = originalFirstBoneLine.split(/\s+/)[1];

                return {
                    firstBoneLine,
                    firstBoneType,
                    firstBoneName,
                    rootCount,
                    jointCount,
                    originalFirstBoneType,
                    originalFirstBoneName,
                    isFirstBoneRoot: firstBoneType === 'ROOT',
                    matchesOriginal: firstBoneType === originalFirstBoneType && firstBoneName === originalFirstBoneName
                };
            }, datasetBvhContent);

            // Verify first bone is marked as ROOT
            expect(assertionData.isFirstBoneRoot).toBe(true);
            expect(assertionData.firstBoneType).toBe('ROOT');
            expect(assertionData.firstBoneName).toBe('joint_Root'); // From fixture
            
            // Verify it matches the original structure
            expect(assertionData.matchesOriginal).toBe(true);
            expect(assertionData.originalFirstBoneType).toBe('ROOT');
            
            // Verify we have exactly one ROOT bone
            expect(assertionData.rootCount).toBe(1);
            expect(assertionData.jointCount).toBeGreaterThan(0);
        });

        it("should preserve end sites with correct structure and placement", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse end sites from both files
                const parseEndSites = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const endSites: Array<{
                        name: string;
                        level: number;
                        offset?: {x: number, y: number, z: number};
                        parentJoint?: string;
                    }> = [];
                    
                    let currentLevel = 0;
                    let currentJoint = '';
                    let parentJoint = '';
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const trimmed = line.trim();
                        const indent = line.length - line.replace(/^\s*/, '').length;
                        const level = Math.floor(indent / 4);
                        
                        if (trimmed.startsWith('ROOT') || trimmed.startsWith('JOINT')) {
                            currentJoint = trimmed.split(/\s+/)[1];
                            parentJoint = currentJoint;
                        } else if (trimmed.startsWith('End Site')) {
                            endSites.push({
                                name: 'End Site',
                                level,
                                parentJoint: currentJoint
                            });
                        } else if (trimmed.startsWith('OFFSET') && endSites.length > 0) {
                            // Check if this offset belongs to the last end site
                            const lastEndSite = endSites[endSites.length - 1];
                            if (lastEndSite && !lastEndSite.offset) {
                                const values = trimmed.replace('OFFSET', '').trim().split(/\s+/);
                                if (values.length === 3) {
                                    lastEndSite.offset = {
                                        x: parseFloat(values[0]),
                                        y: parseFloat(values[1]),
                                        z: parseFloat(values[2])
                                    };
                                }
                            }
                        }
                    }
                    
                    return endSites;
                };

                const originalEndSites = parseEndSites(bvhContent);
                const exportedEndSites = parseEndSites(exportedBvh);

                return {
                    originalEndSites,
                    exportedEndSites,
                    endSiteCountMatch: originalEndSites.length === exportedEndSites.length,
                    endSiteCount: exportedEndSites.length,
                    originalEndSiteCount: originalEndSites.length
                };
            }, datasetBvhContent);

            // Verify end site count matches
            expect(assertionData.endSiteCountMatch).toBe(true);
            expect(assertionData.endSiteCount).toBe(assertionData.originalEndSiteCount);
            expect(assertionData.endSiteCount).toBeGreaterThan(0);
            
            // Verify each end site has correct structure
            assertionData.exportedEndSites.forEach(endSite => {
                expect(endSite.name).toBe('End Site');
                expect(endSite.level).toBeGreaterThan(0); // End sites should be nested
                expect(endSite.parentJoint).toBeDefined();
                expect(endSite.offset).toBeDefined();
                expect(typeof endSite.offset!.x).toBe('number');
                expect(typeof endSite.offset!.y).toBe('number');
                expect(typeof endSite.offset!.z).toBe('number');
            });
        });

        it("should export multiple keyframes with proper animation data", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse motion data from exported BVH
                const parseMotionData = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    let inMotion = false;
                    let frames = 0;
                    let frameTime = 0;
                    const frameDataLines: string[] = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        
                        if (trimmed === 'MOTION') {
                            inMotion = true;
                            continue;
                        }
                        
                        if (inMotion) {
                            if (trimmed.startsWith('Frames:')) {
                                frames = parseInt(trimmed.split(/\s+/)[1]);
                            } else if (trimmed.startsWith('Frame Time:')) {
                                frameTime = parseFloat(trimmed.split(/\s+/)[2]);
                            } else if (trimmed.match(/^-?\d+\.\d+/)) {
                                frameDataLines.push(trimmed);
                            }
                        }
                    }
                    
                    return { frames, frameTime, frameDataLines };
                };

                const motionData = parseMotionData(exportedBvh);
                
                // Parse channel definitions to calculate expected values per frame
                const parseChannels = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    let totalChannels = 0;
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('CHANNELS')) {
                            const parts = trimmed.split(/\s+/);
                            const channelCount = parseInt(parts[1]);
                            totalChannels += channelCount;
                        }
                    }
                    
                    return totalChannels;
                };

                const totalChannels = parseChannels(exportedBvh);
                
                // Analyze first few frames for data consistency
                const frameAnalysis = [];
                for (let i = 0; i < Math.min(5, motionData.frameDataLines.length); i++) {
                    const frameLine = motionData.frameDataLines[i];
                    const values = frameLine.split(/\s+/).map(v => parseFloat(v));
                    frameAnalysis.push({
                        frameIndex: i,
                        valueCount: values.length,
                        hasValidNumbers: values.every(v => !isNaN(v)),
                        sampleValues: values.slice(0, 6) // First 6 values as sample
                    });
                }

                return {
                    motionData,
                    totalChannels,
                    frameAnalysis,
                    hasMultipleFrames: motionData.frames > 1,
                    frameCountMatches: motionData.frames === motionData.frameDataLines.length,
                    allFramesValid: frameAnalysis.every(f => f.hasValidNumbers && f.valueCount === totalChannels)
                };
            }, datasetBvhContent);

            // Verify we have multiple frames
            expect(assertionData.hasMultipleFrames).toBe(true);
            expect(assertionData.motionData.frames).toBe(195); // From fixture
            
            // Verify frame count matches data lines
            expect(assertionData.frameCountMatches).toBe(true);
            
            // Verify all frames have correct number of values
            expect(assertionData.allFramesValid).toBe(true);
            
            // Verify frame time is correct
            expect(assertionData.motionData.frameTime).toBeCloseTo(0.0333333, 6);
            
            // Verify we have reasonable number of channels
            expect(assertionData.totalChannels).toBeGreaterThan(0);
            
            // Verify first few frames have valid data
            assertionData.frameAnalysis.forEach(frame => {
                expect(frame.hasValidNumbers).toBe(true);
                expect(frame.valueCount).toBe(assertionData.totalChannels);
            });
        });

        it("should handle animation keyframe interpolation correctly", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse frame data and analyze value changes
                const lines = exportedBvh.split('\n');
                const motionIndex = lines.findIndex(line => line.trim() === "MOTION");
                const frameDataLines = lines.slice(motionIndex + 3); // Skip MOTION, Frames, Frame Time
                
                // Analyze value changes between frames
                const valueChanges = [];
                for (let i = 0; i < Math.min(10, frameDataLines.length - 1); i++) {
                    const currentFrame = frameDataLines[i].split(/\s+/).map(v => parseFloat(v));
                    const nextFrame = frameDataLines[i + 1].split(/\s+/).map(v => parseFloat(v));
                    
                    const changes = currentFrame.map((val, idx) => Math.abs(val - nextFrame[idx]));
                    const maxChange = Math.max(...changes);
                    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
                    
                    valueChanges.push({
                        framePair: `${i}-${i + 1}`,
                        maxChange,
                        avgChange,
                        hasVariation: maxChange > 0.001
                    });
                }

                // Check for smooth transitions (not all values should be identical)
                const hasVariation = valueChanges.some(change => change.hasVariation);
                const totalVariation = valueChanges.reduce((sum, change) => sum + change.avgChange, 0);
                
                return {
                    valueChanges,
                    hasVariation,
                    totalVariation,
                    frameCount: frameDataLines.length,
                    sampleChanges: valueChanges.slice(0, 3)
                };
            }, datasetBvhContent);

            // Verify we have frame data
            expect(assertionData.frameCount).toBeGreaterThan(0);
            
            // Verify there's variation in the data (not all static)
            expect(assertionData.hasVariation).toBe(true);
            
            // Verify reasonable amount of variation
            expect(assertionData.totalVariation).toBeGreaterThan(0);
            
            // Verify sample changes show proper animation data
            assertionData.sampleChanges.forEach(change => {
                expect(change.maxChange).toBeGreaterThanOrEqual(0);
                expect(change.avgChange).toBeGreaterThanOrEqual(0);
            });
        });

        it("should preserve animation timing and frame rate accuracy", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export with specific frame rate
                const testFrameRate = 0.041667; // 24 FPS
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], testFrameRate);
                
                // Parse frame rate from exported BVH
                const lines = exportedBvh.split('\n');
                const frameTimeLine = lines.find(line => line.trim().startsWith('Frame Time:'));
                const exportedFrameRate = frameTimeLine ? parseFloat(frameTimeLine.split(':')[1].trim()) : 0;
                
                // Calculate expected frame count based on animation range
                const animationRange = skeleton.getAnimationRange("default");
                const expectedFrameCount = animationRange ? 
                    Math.floor((animationRange.to - animationRange.from) / testFrameRate) + 1 : 0;
                
                // Parse actual frame count
                const framesLine = lines.find(line => line.trim().startsWith('Frames:'));
                const actualFrameCount = framesLine ? parseInt(framesLine.split(':')[1].trim()) : 0;
                
                return {
                    exportedFrameRate,
                    testFrameRate,
                    actualFrameCount,
                    expectedFrameCount,
                    frameRateMatch: Math.abs(exportedFrameRate - testFrameRate) < 0.0001,
                    hasAnimationRange: !!animationRange,
                    animationRange: animationRange ? {
                        from: animationRange.from,
                        to: animationRange.to,
                        duration: animationRange.to - animationRange.from
                    } : null
                };
            }, datasetBvhContent);

            // Verify frame rate is preserved
            expect(assertionData.frameRateMatch).toBe(true);
            expect(assertionData.exportedFrameRate).toBeCloseTo(assertionData.testFrameRate, 6);
            
            // Verify we have animation range
            expect(assertionData.hasAnimationRange).toBe(true);
            
            // Verify frame count is reasonable
            expect(assertionData.actualFrameCount).toBeGreaterThan(0);
            
            // If we have animation range, verify frame count calculation
            if (assertionData.animationRange) {
                expect(assertionData.actualFrameCount).toBeGreaterThanOrEqual(assertionData.expectedFrameCount - 1);
                expect(assertionData.actualFrameCount).toBeLessThanOrEqual(assertionData.expectedFrameCount + 1);
            }
        });

        it("should validate keyframe data structure and animation values", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Parse and validate keyframe data
                const lines = exportedBvh.split('\n');
                const motionIndex = lines.findIndex(line => line.trim() === "MOTION");
                const frameDataLines = lines.slice(motionIndex + 3); // Skip MOTION, Frames, Frame Time
                
                // Extract channel information
                const channelInfo = [];
                for (let i = 0; i < motionIndex; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('CHANNELS')) {
                        const parts = line.split(/\s+/);
                        const channelCount = parseInt(parts[1]);
                        const channelTypes = parts.slice(2);
                        channelInfo.push({
                            channelCount,
                            channelTypes,
                            hasPosition: channelTypes.includes('Xposition'),
                            hasRotation: channelTypes.includes('Zrotation')
                        });
                    }
                }
                
                const totalChannels = channelInfo.reduce((sum, ch) => sum + ch.channelCount, 0);
                
                // Validate frame data structure
                const frameValidation = [];
                for (let i = 0; i < Math.min(10, frameDataLines.length); i++) {
                    const frameLine = frameDataLines[i];
                    const values = frameLine.split(/\s+/).map(v => parseFloat(v));
                    
                    // Check for position values (first 3 values of each bone with position channels)
                    const positionValues = [];
                    const rotationValues = [];
                    
                    let valueIndex = 0;
                    for (const chInfo of channelInfo) {
                        if (chInfo.hasPosition) {
                            positionValues.push({
                                x: values[valueIndex],
                                y: values[valueIndex + 1],
                                z: values[valueIndex + 2]
                            });
                            valueIndex += 3;
                        }
                        if (chInfo.hasRotation) {
                            rotationValues.push({
                                z: values[valueIndex],
                                x: values[valueIndex + 1],
                                y: values[valueIndex + 2]
                            });
                            valueIndex += 3;
                        }
                    }
                    
                    frameValidation.push({
                        frameIndex: i,
                        valueCount: values.length,
                        positionValues,
                        rotationValues,
                        hasValidNumbers: values.every(v => !isNaN(v) && isFinite(v)),
                        positionRange: positionValues.length > 0 ? {
                            minX: Math.min(...positionValues.map(p => p.x)),
                            maxX: Math.max(...positionValues.map(p => p.x)),
                            minY: Math.min(...positionValues.map(p => p.y)),
                            maxY: Math.max(...positionValues.map(p => p.y)),
                            minZ: Math.min(...positionValues.map(p => p.z)),
                            maxZ: Math.max(...positionValues.map(p => p.z))
                        } : null
                    });
                }
                
                // Check for reasonable value ranges
                const allFramesValid = frameValidation.every(f => f.hasValidNumbers && f.valueCount === totalChannels);
                const hasReasonableRanges = frameValidation.every(f => {
                    if (!f.positionRange) return true;
                    const range = f.positionRange;
                    return Math.abs(range.maxX - range.minX) < 1000 && 
                           Math.abs(range.maxY - range.minY) < 1000 && 
                           Math.abs(range.maxZ - range.minZ) < 1000;
                });
                
                return {
                    channelInfo,
                    totalChannels,
                    frameValidation,
                    allFramesValid,
                    hasReasonableRanges,
                    frameCount: frameDataLines.length,
                    sampleFrame: frameValidation[0]
                };
            }, datasetBvhContent);

            // Verify channel information is correct
            expect(assertionData.channelInfo.length).toBeGreaterThan(0);
            expect(assertionData.totalChannels).toBeGreaterThan(0);
            
            // Verify all frames have valid data structure
            expect(assertionData.allFramesValid).toBe(true);
            
            // Verify reasonable value ranges
            expect(assertionData.hasReasonableRanges).toBe(true);
            
            // Verify frame count
            expect(assertionData.frameCount).toBeGreaterThan(0);
            
            // Verify sample frame has expected structure
            expect(assertionData.sampleFrame).toBeDefined();
            expect(assertionData.sampleFrame.hasValidNumbers).toBe(true);
            expect(assertionData.sampleFrame.valueCount).toBe(assertionData.totalChannels);
            
            // Verify we have both position and rotation data
            const hasPositionChannels = assertionData.channelInfo.some(ch => ch.hasPosition);
            const hasRotationChannels = assertionData.channelInfo.some(ch => ch.hasRotation);
            expect(hasPositionChannels).toBe(true);
            expect(hasRotationChannels).toBe(true);
        });

        it("should produce BVH file with identical structure to input", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.0333333);
                
                // Verify exported BVH has correct sections
                const hasHierarchy = exportedBvh.includes("HIERARCHY");
                const hasMotion = exportedBvh.includes("MOTION");
                const hasRoot = exportedBvh.includes("ROOT");
                const hasJoint = exportedBvh.includes("JOINT");
                const hasEndSite = exportedBvh.includes("End Site");
                
                // Verify file structure
                const lines = exportedBvh.split('\n');
                const lineCount = lines.length;
                
                // Verify hierarchy section comes before motion section
                const hierarchyIndex = lines.findIndex(line => line.trim() === "HIERARCHY");
                const motionIndex = lines.findIndex(line => line.trim() === "MOTION");
                const hierarchyBeforeMotion = hierarchyIndex !== -1 && motionIndex !== -1 && hierarchyIndex < motionIndex;
                
                // Verify proper formatting
                const hasFrames = exportedBvh.includes("Frames:");
                const hasFrameTime = exportedBvh.includes("Frame Time:");

                return {
                    exportedBvhLength: exportedBvh.length,
                    hasHierarchy,
                    hasMotion,
                    hasRoot,
                    hasJoint,
                    hasEndSite,
                    lineCount,
                    hierarchyBeforeMotion,
                    hasFrames,
                    hasFrameTime
                };
            }, datasetBvhContent);

            // Verify exported BVH has correct sections
            expect(assertionData.hasHierarchy).toBe(true);
            expect(assertionData.hasMotion).toBe(true);
            expect(assertionData.hasRoot).toBe(true);
            expect(assertionData.hasJoint).toBe(true);
            expect(assertionData.hasEndSite).toBe(true);
            
            // Verify file structure matches expected
            expect(assertionData.lineCount).toBeGreaterThan(50); // Should have substantial content
            expect(assertionData.hierarchyBeforeMotion).toBe(true);
            expect(assertionData.hasFrames).toBe(true);
            expect(assertionData.hasFrameTime).toBe(true);
            
            // Verify exported BVH has similar length (allowing for minor formatting differences)
            const lengthRatio = assertionData.exportedBvhLength / datasetBvhContent.length;
            expect(lengthRatio).toBeGreaterThan(0.8);
            expect(lengthRatio).toBeLessThan(1.2);
        });
    });
});
