/**
 * @jest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { WebXRFeaturesManager, WebXRSessionManager, WebXRMotionControllerTeleportation, WebXRControllerMovement } from "core/XR";
// eslint-disable-next-line import/no-internal-modules
import "core/Animations/index";
/**
 * WebXR Features Manager test suite.
 */
describe("Babylon WebXR Features Manager", function () {
    let subject: WebXRFeaturesManager;

    /**
     * Create a new session manager subject before each test.
     */
    beforeEach(function () {
        const engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        const scene = new Scene(engine);
        const sessionManager = new WebXRSessionManager(scene);

        // Normally added via import side effects (features add themselves)
        WebXRFeaturesManager.AddWebXRFeature(
            WebXRMotionControllerTeleportation.Name,
            (xrSessionManager, options) => {
                return () => new WebXRMotionControllerTeleportation(xrSessionManager, options);
            },
            WebXRMotionControllerTeleportation.Version,
            true
        );

        WebXRFeaturesManager.AddWebXRFeature(
            WebXRControllerMovement.Name,
            (xrSessionManager, options) => {
                return () => new WebXRControllerMovement(xrSessionManager, options);
            },
            WebXRControllerMovement.Version,
            true
        );

        subject = new WebXRFeaturesManager(sessionManager);
    });

    /**
     * Test conflicting features
     */
    describe("Conflicting Features cannot be enabled simultaneously", () => {
        it("Cannot enable Movement feature while Teleportation feature is enabled", () => {
            const teleportationFeature = subject.enableFeature(WebXRMotionControllerTeleportation.Name, undefined, { xrInput: { xrCamera: {} } });
            expect(teleportationFeature).toBeDefined();
            expect(subject.getEnabledFeatures()).toStrictEqual([WebXRMotionControllerTeleportation.Name]);

            expect(() => subject.enableFeature(WebXRControllerMovement.Name)).toThrow(
                `Feature ${WebXRControllerMovement.Name} cannot be enabled while ${WebXRMotionControllerTeleportation.Name} is enabled.`
            );

            expect(subject.getEnabledFeatures()).toStrictEqual([WebXRMotionControllerTeleportation.Name]);
        });

        it("Cannot enable Teleportation feature while Movement feature is enabled", () => {
            const teleportationFeature = subject.enableFeature(WebXRControllerMovement.Name, undefined, { xrInput: {} });
            expect(teleportationFeature).toBeDefined();
            expect(subject.getEnabledFeatures()).toStrictEqual([WebXRControllerMovement.Name]);

            expect(() => subject.enableFeature(WebXRMotionControllerTeleportation.Name)).toThrow(
                `Feature ${WebXRMotionControllerTeleportation.Name} cannot be enabled while ${WebXRControllerMovement.Name} is enabled.`
            );

            expect(subject.getEnabledFeatures()).toStrictEqual([WebXRControllerMovement.Name]);
        });
    });
});
