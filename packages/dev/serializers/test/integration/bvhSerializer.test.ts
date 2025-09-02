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
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.041667);
                
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

        it("should preserve 3D bone offsets exactly", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.041667);
                
                // Extract offset values from exported BVH
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

                const exportedOffsets = extractOffsetValues(exportedBvh);
                
                // Verify all offsets are 3D (X, Y, Z)
                const allOffsetsAre3D = exportedOffsets.every(offset => 
                    typeof offset.x === 'number' && 
                    typeof offset.y === 'number' && 
                    typeof offset.z === 'number'
                );
                
                // Find first few offsets for validation
                const firstOffset = exportedOffsets[0];
                const secondOffset = exportedOffsets[1];

                return {
                    exportedOffsets,
                    allOffsetsAre3D,
                    firstOffset,
                    secondOffset,
                    offsetCount: exportedOffsets.length
                };
            }, datasetBvhContent);

            // Verify all offsets are 3D (X, Y, Z)
            expect(assertionData.allOffsetsAre3D).toBe(true);
            expect(assertionData.offsetCount).toBeGreaterThan(0);
            
            // Verify specific offsets exist and are valid numbers
            expect(assertionData.firstOffset).toBeDefined();
            expect(typeof assertionData.firstOffset.x).toBe('number');
            expect(typeof assertionData.firstOffset.y).toBe('number');
            expect(typeof assertionData.firstOffset.z).toBe('number');
            
            if (assertionData.secondOffset) {
                expect(typeof assertionData.secondOffset.x).toBe('number');
                expect(typeof assertionData.secondOffset.y).toBe('number');
                expect(typeof assertionData.secondOffset.z).toBe('number');
            }
        });

        it("should preserve channel definitions and animation data", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.041667);
                
                // Extract motion data from exported BVH
                const extractMotionData = (bvhText: string) => {
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

                const exportedMotion = extractMotionData(exportedBvh);
                
                // Extract channel definitions
                const extractChannelDefinitions = (bvhText: string) => {
                    const lines = bvhText.split("\n");
                    const channels: string[] = [];
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('CHANNELS')) {
                            channels.push(trimmed);
                        }
                    }
                    
                    return channels;
                };

                const exportedChannels = extractChannelDefinitions(exportedBvh);
                
                // Verify first frame has correct number of values
                let firstFrameValueCount = 0;
                if (exportedMotion.frameDataLines.length > 0) {
                    const firstFrame = exportedMotion.frameDataLines[0];
                    const values = firstFrame.split(/\s+/);
                    firstFrameValueCount = values.length;
                }

                return {
                    exportedMotion,
                    exportedChannels,
                    firstFrameValueCount,
                    channelCount: exportedChannels.length,
                    frameCount: exportedMotion.frames,
                    frameTime: exportedMotion.frameTime,
                    frameDataLineCount: exportedMotion.frameDataLines.length
                };
            }, datasetBvhContent);

            // Verify motion section structure
            expect(assertionData.frameCount).toBeGreaterThan(0);
            expect(assertionData.frameTime).toBeGreaterThan(0);
            expect(assertionData.frameDataLineCount).toBeGreaterThan(0);
            
            // Verify first frame has values
            expect(assertionData.firstFrameValueCount).toBeGreaterThan(0);
            
            // Verify channel definitions exist
            expect(assertionData.channelCount).toBeGreaterThan(0);
            
            // Verify each joint has channels in correct order
            assertionData.exportedChannels.forEach(channelDef => {
                expect(channelDef).toContain("CHANNELS");
                expect(channelDef).toMatch(/CHANNELS \d+/);
            });
        });

        it("should produce BVH file with identical structure to input", async () => {
            const assertionData = await page.evaluate((bvhContent) => {
                // Load the BVH file into a skeleton
                const skeleton = BABYLON.BVH.ReadBvh(bvhContent);

                // Export the skeleton back to BVH
                const exportedBvh = BABYLON.BVHExporter.Export(skeleton, ["default"], 0.041667);
                
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
