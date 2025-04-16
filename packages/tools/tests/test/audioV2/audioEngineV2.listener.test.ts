import { Channel, EvaluateVolumesAtTimeAsync, InitAudioV2Tests, VolumePrecision } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();

test.describe("AudioEngineV2 listener", () => {
    test("Sound at position (0, 0, -1) with no listener options set should be 1x volume in left and right speakers", async ({ page }) => {
        await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

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

    test("Sound at position (0, 0, 0) with listener position option set to (1, 0, 0) should be 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
        await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerPosition: new BABYLON.Vector3(1, 0, 0) });
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, 0) });

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
    });

    test("Sound at position (0, 0, 0) with listener position option set to (-1, 0, 0) should be 0 volume in left speaker and 1x volume in right speaker", async ({ page }) => {
        await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerPosition: new BABYLON.Vector3(-1, 0, 0) });
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, 0) });

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
    });

    test("Sound at position (0, 0, -1) with listener rotation option set to 90 degrees should be 0 volume in left speaker and 1x volume in right speaker", async ({ page }) => {
        await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerRotation: new BABYLON.Vector3(0, 0.5 * Math.PI, 0) });
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(0, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(1, VolumePrecision);
    });

    test("Sound at position (0, 0, -1) with listener rotation option set to -90 degrees should be 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
        await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerRotation: new BABYLON.Vector3(0, -0.5 * Math.PI, 0) });
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
    });

    test("Sound at position (0, 0, 0) with listener position property set to (1, 0, 0) should be 1x volume in left speaker and 0 volume in right speaker", async ({ page }) => {
        await page.evaluate(async () => {
            const audioEngine = await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, 0) });

            audioEngine.listener.position = new BABYLON.Vector3(1, 0, 0);

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
    });

    test("Sound at position (0, 0, 0) with listener position property set to (1, 0, 0) via Vector3.set should be 1x volume in left speaker and 0 volume in right speaker", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const audioEngine = await AudioV2Test.CreateAudioEngineAsync();
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, 0) });

            audioEngine.listener.position.set(1, 0, 0);

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
    });

    test("Sound at position (0, 0, 0) with `listenerAttachedMesh` option set to mesh at position (1, 0, 0) should be 1x volume in left speaker and 0 volume in right speaker", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const canvas = document.createElement("canvas");
            const engine = new BABYLON.Engine(canvas, true);
            const scene = new BABYLON.Scene(engine);
            const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            mesh.position.x = 1;
            mesh.computeWorldMatrix(true);

            const audioEngine = await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerEnabled: true });
            audioEngine.listener.attach(mesh);
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, 0) });

            sound.play();
            await AudioV2Test.WaitAsync(1, () => {
                sound.stop();
            });
        });

        const volumes = await EvaluateVolumesAtTimeAsync(page, 0.5);

        expect(volumes[Channel.L]).toBeCloseTo(1, VolumePrecision);
        expect(volumes[Channel.R]).toBeCloseTo(0, VolumePrecision);
    });

    test("Sound at position (0, 0, -1) with `listenerAttachedMesh` option set to mesh rotated 90 degrees should be 0 volume in left speaker and 1x volume in right speaker", async ({
        page,
    }) => {
        await page.evaluate(async () => {
            const canvas = document.createElement("canvas");
            const engine = new BABYLON.Engine(canvas, true);
            const scene = new BABYLON.Scene(engine);
            const mesh = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            mesh.rotation.y = 0.5 * Math.PI;
            mesh.computeWorldMatrix(true);

            const audioEngine = await AudioV2Test.CreateAudioEngineAsync(undefined, undefined, { listenerEnabled: true });
            audioEngine.listener.attach(mesh);
            const sound = await AudioV2Test.CreateSoundAsync(audioTestConfig.pulseTrainSoundFile, { spatialPosition: new BABYLON.Vector3(0, 0, -1) });

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
