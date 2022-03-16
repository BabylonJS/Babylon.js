import { ArcRotateCamera } from "core/Cameras";
import { Engine, NullEngine } from "core/Engines";
import { Vector3 } from "core/Maths";
import { DefaultRenderingPipeline } from "core/PostProcesses";
import { Scene } from "core/scene";

/**
 * Describes the test suite.
 */
describe("Babylon Scene Loader", function () {
    let subject: Engine;

    /**
     * Create a new engine subject before each test.
     */
    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
    });

    /**
     * Integration tests for post processes.
     */
    describe("#postProcesses", () => {
        it("Add default pipeline", () => {
            const scene = new Scene(subject);
            const camera = new ArcRotateCamera("Camera", 0, 0, 100, new Vector3(0, 0, 0), scene);

            // Set caps so that HDR will be set when creating default pipeline
            const caps = subject.getCaps();
            caps.textureFloatRender = true;

            const promise = new Promise<void>((res, rej) => {
                return scene.whenReadyAsync().then(() => {
                    const createShaderProgramSpy = jest.spyOn(subject, "createShaderProgram");
                    new DefaultRenderingPipeline("default", true, scene, [camera]);
                    // wait for all shaders to be compiled if needed
                    setTimeout(() => {
                        expect(createShaderProgramSpy).toBeCalledTimes(1); // Image process shader is compiled by default
                        createShaderProgramSpy.mockRestore();
                        caps.textureFloatRender = false;
                        res();
                    }, 500);
                });
            });
            return promise;
        });
    });
});
