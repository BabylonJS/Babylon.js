import { EvaluateAbstractAudioNodeTestAsync } from "../utils/abstractAudioNode.utils";
import type { AudioNodeType } from "../utils/audioV2.utils";
import { Channel, EvaluateVolumesAtTimeAsync, VolumePrecision } from "../utils/audioV2.utils";

import { expect, test } from "@playwright/test";

export const AddSharedAbstractAudioNodeSpatialTests = (audioNodeType: AudioNodeType) => {
    test.describe(`${audioNodeType} spatial`, () => {
        test("Setting `spatialConeInnerAngle` and `spatialConeOuterAngle` options to 0 should play sound at 0 volume in left and right speakers", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.01) });
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: 0,
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatialConeInnerAngle` option to 360 should play sound at 1x volume in left and right speakers", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.000001) });
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialConeInnerAngle: 360 });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            // Test against 0.7 because the 1.0 amplitude sound is evenly distributed between the two speakers.
            expect(volumes[Channel.L]).toBeCloseTo(0.7, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.7, VolumePrecision);
        });

        test("Setting `spatialPosition` option to left of listener should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialPosition: new BABYLON.Vector3(-1, 0, 0),
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial options to rotate sound on left halfway thru spatial cone should play sound at 0.5x volume in left speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: Math.PI,
                    spatialPosition: new BABYLON.Vector3(-1, 0, 0),
                    spatialRotation: new BABYLON.Vector3(0, 0.25 * Math.PI, 0),
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.5, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial options to rotate sound on left out of spatial cone should play sound at 0 volume in left speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: Math.PI,
                    spatialPosition: new BABYLON.Vector3(-1, 0, 0),
                    spatialRotation: new BABYLON.Vector3(0, 0.5 * Math.PI, 0),
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial options to rotate sound on right halfway thru spatial cone should play sound at 0.5x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: Math.PI,
                    spatialPosition: new BABYLON.Vector3(1, 0, 0),
                    spatialRotation: new BABYLON.Vector3(0, 1.25 * Math.PI, 0),
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.5, VolumePrecision);
        });

        test("Setting spatial options to rotate sound on right out of spatial cone should play sound at 0.5x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: Math.PI,
                    spatialPosition: new BABYLON.Vector3(1, 0, 0),
                    spatialRotation: new BABYLON.Vector3(0, 1.5 * Math.PI, 0),
                });

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.coneInnerAngle` and `spatial.coneOuterAngle` properties to 0 should play sound at 0 volume in left and right speakers", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.01) });
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = 0;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.coneInnerAngle` and `spatial.coneOuterAngle` properties to 0 without enabling spatial audio at init should play sound at 0 volume in left and right speakers", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.01) });
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = 0;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.coneInnerAngle` property to 360 should play sound at 1x volume in left and right speakers", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.01) });
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 360;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            // Test against 0.7 because the 1.0 amplitude sound is evenly distributed between the two speakers.
            expect(volumes[Channel.L]).toBeCloseTo(0.7, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.7, VolumePrecision);
        });

        test("Setting `spatial.coneInnerAngle` property to 360 without enabling spatial audio at init should play sound at 1x volume in left and right speakers", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                // Move the listener up since no cone attenuation occurs when the the listener and sound are colocated.
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType, undefined, { listenerPosition: new BABYLON.Vector3(0, 0, 0.01) });
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile);

                outputNode.spatial.coneInnerAngle = 360;
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            // Test against 0.7 because the 1.0 amplitude sound is evenly distributed between the two speakers.
            expect(volumes[Channel.L]).toBeCloseTo(0.7, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.7, VolumePrecision);
        });

        test("Setting `spatial.position` property to left of listener should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.position = new BABYLON.Vector3(-1, 0, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.position` property to left of listener with Vector3.set should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.position.set(-1, 0, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.position` property to left of listener with Vector3.set with spatialAutoUpdate set to false should play sound at 1x volume in left and right speakers", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialAutoUpdate: false,
                    spatialEnabled: true,
                });

                outputNode.spatial.position.set(-1, 0, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.7, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.7, VolumePrecision);
        });

        test("Setting `spatial.position` property to left of listener with Vector3.set with spatialAutoUpdate set to false then calling spatial.update() should play sound at 1x volume in left speaker and 0 volume in right speaker", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialAutoUpdate: false,
                    spatialEnabled: true,
                });

                outputNode.spatial.position.set(-1, 0, 0);
                outputNode.spatial.update();
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial properties to rotate sound on left halfway thru spatial cone should play sound at 0.5x volume in left speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = Math.PI;
                outputNode.spatial.position = new BABYLON.Vector3(-1, 0, 0);
                outputNode.spatial.rotation = new BABYLON.Vector3(0, 0.25 * Math.PI, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.5, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial properties to rotate sound on left out of spatial cone should play sound at 0 volume in left speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = Math.PI;
                outputNode.spatial.position = new BABYLON.Vector3(-1, 0, 0);
                outputNode.spatial.rotation = new BABYLON.Vector3(0, 0.5 * Math.PI, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting spatial properties to rotate sound on right halfway thru spatial cone should play sound at 0.5x volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = Math.PI;
                outputNode.spatial.position = new BABYLON.Vector3(1, 0, 0);
                outputNode.spatial.rotation = new BABYLON.Vector3(0, 1.25 * Math.PI, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.5, VolumePrecision);
        });

        test("Setting spatial properties to rotate sound on right halfway thru spatial cone using Vector3.set should play sound at 0.5x volume in right speaker", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = Math.PI;
                outputNode.spatial.position.set(1, 0, 0);
                outputNode.spatial.rotation.set(0, 1.25 * Math.PI, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0.5, VolumePrecision);
        });

        test("Setting spatial properties to rotate sound on right out of spatial cone should play sound at 0 volume in right speaker", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });

                outputNode.spatial.coneInnerAngle = 0;
                outputNode.spatial.coneOuterAngle = Math.PI;
                outputNode.spatial.position = new BABYLON.Vector3(1, 0, 0);
                outputNode.spatial.rotation = new BABYLON.Vector3(0, 1.5 * Math.PI, 0);
                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });
    });

    test.describe(`${audioNodeType} spatial.attachedMesh`, () => {
        test("Setting `spatial.attachedMesh` property with mesh created in front of listener should play sound at equal volume left and right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                mesh.position.z = 1;
                mesh.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(volumes[Channel.R], VolumePrecision);
        });

        test("Setting `spatial.attachedMesh` property with mesh created on left of listener should play sound at 1x volume left and 0 volume right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                mesh.position.x = -1;
                mesh.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.attachedMesh` property with mesh created on right of listener should play sound at 0 volume left and 1x volume right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                mesh.position.x = 1;
                mesh.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Moving attached mesh in front of listener should play sound at equal volume left and right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                mesh.position.z = 1;
                scene.render();

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(volumes[Channel.R], VolumePrecision);
        });

        test("Moving attached mesh to left of listener should play sound at 1x volume left and 0 volume right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                mesh.position.x = -1;
                scene.render();

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Moving attached mesh to right of listener should play sound at 1x volume left and 0 volume right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                mesh.position.x = 1;
                scene.render();

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Setting `spatial.attachedMesh` property with parented mesh created on left of listener should play sound at 1x volume left and 0 volume right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const parent = new BABYLON.TransformNode("parent", scene);
                parent.position.x = 1;
                const mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
                mesh.parent = parent;
                mesh.position.x = -2;
                mesh.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(mesh);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.attachedMesh` property with parented mesh on left of listener and rotated halfway thru spatial cone should play sound at 0.5x volume in left speaker", async ({
            page,
        }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const parent = new BABYLON.TransformNode("parent", scene);
                parent.position.x = -1;
                parent.rotation.y = 0.125 * Math.PI;
                const mesh = BABYLON.MeshBuilder.CreateBox("mesh", { size: 1 }, scene);
                mesh.parent = parent;
                mesh.rotation.y = 0.125 * Math.PI;
                mesh.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, {
                    spatialConeInnerAngle: 0,
                    spatialConeOuterAngle: Math.PI,
                });
                outputNode.spatial.attach(mesh);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0.5, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });
    });

    test.describe(`${audioNodeType} spatial.attachedTransformNode`, () => {
        test("Setting `spatial.attachedTransformNode` property with mesh created in front of listener should play sound at equal volume left and right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const transformNode = new BABYLON.TransformNode("transformNode", scene);
                transformNode.position.z = 1;
                transformNode.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transformNode);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(volumes[Channel.R], VolumePrecision);
        });

        test("Setting `spatial.attachedTransformNode` property with mesh created on left of listener should play sound at 1x volume left and 0 volume right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const transformNode = new BABYLON.TransformNode("transformNode", scene);
                transformNode.position.x = -1;
                transformNode.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transformNode);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Setting `spatial.attachedTransformNode` property with mesh created on right of listener should play sound at 0 volume left and 1x volume right", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                const transformNode = new BABYLON.TransformNode("transformNode", scene);
                transformNode.position.x = 1;
                transformNode.computeWorldMatrix(true);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transformNode);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });

        test("Moving attached transform node in front of listener should play sound at equal volume left and right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const transforNode = new BABYLON.TransformNode("transformNode", scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transforNode);

                transforNode.position.z = 1;
                scene.render();

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(volumes[Channel.R], VolumePrecision);
        });

        test("Moving attached transform node to left of listener should play sound at 1x volume left and 0 volume right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const transformNode = new BABYLON.TransformNode("transformNode", scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transformNode);

                transformNode.position.x = -1;
                transformNode.computeWorldMatrix(true);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
        });

        test("Moving attached transform node to right of listener should play sound at 1x volume left and 0 volume right after mesh is rendered", async ({ page }) => {
            await EvaluateAbstractAudioNodeTestAsync(page, audioNodeType, async ({ audioNodeType }) => {
                const canvas = document.createElement("canvas");
                const engine = new BABYLON.Engine(canvas, true);
                const scene = new BABYLON.Scene(engine);
                scene.createDefaultCamera();
                const transformNode = new BABYLON.TransformNode("transformNode", scene);

                await AudioV2Test.CreateAudioEngineAsync(audioNodeType);
                const { sound, outputNode } = await AudioV2Test.CreateAbstractSoundAndOutputNodeAsync(audioNodeType, audioTestConfig.pulseTrainSoundFile, { spatialEnabled: true });
                outputNode.spatial.attach(transformNode);

                transformNode.position.x = 1;
                transformNode.computeWorldMatrix(true);

                sound.play();
                await AudioV2Test.WaitAsync(1, () => {
                    sound.stop();
                });
            });

            const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

            expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
            expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
        });
    });
};
