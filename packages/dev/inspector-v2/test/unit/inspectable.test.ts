import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { StartInspectable, _StartInspectable } from "../../src/inspectable";
import { type WeaklyTypedServiceDefinition } from "../../src/modularity/serviceContainer";

const TestServiceIdentity = Symbol("TestService");
const TestService2Identity = Symbol("TestService2");

describe("StartInspectable", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("returns a non-disposed token", () => {
        const token = StartInspectable(scene);
        expect(token.isDisposed).toBe(false);
        token.dispose();
    });

    it("returns the same container for the same scene", () => {
        const token1 = _StartInspectable(scene);
        const token2 = _StartInspectable(scene);
        expect(token1.serviceContainer).toBe(token2.serviceContainer);
        token1.dispose();
        token2.dispose();
    });

    it("container survives first dispose when ref count > 0", () => {
        const token1 = _StartInspectable(scene);
        const token2 = _StartInspectable(scene);
        const container = token1.serviceContainer;

        token1.dispose();
        expect(token1.isDisposed).toBe(true);

        const token3 = _StartInspectable(scene);
        expect(token3.serviceContainer).toBe(container);

        token2.dispose();
        token3.dispose();
    });

    it("container is disposed when all tokens are disposed", () => {
        const token1 = _StartInspectable(scene);
        const token2 = _StartInspectable(scene);

        token1.dispose();
        token2.dispose();

        const token3 = _StartInspectable(scene);
        expect(token3.isDisposed).toBe(false);
        token3.dispose();
    });

    it("extra serviceDefinitions are added to the container", async () => {
        let serviceCreated = false;
        const extraService: WeaklyTypedServiceDefinition = {
            friendlyName: "Extra Test Service",
            produces: [TestServiceIdentity],
            factory: () => {
                serviceCreated = true;
            },
        };

        const token = StartInspectable(scene, { serviceDefinitions: [extraService] });

        await new Promise((resolve) => setTimeout(resolve, 200));
        expect(serviceCreated).toBe(true);

        token.dispose();
    });

    it("extra services are disposed when the token is disposed, before container teardown", async () => {
        let serviceDisposed = false;
        const extraService: WeaklyTypedServiceDefinition = {
            friendlyName: "Disposable Extra Service",
            produces: [TestServiceIdentity],
            factory: () => ({
                testValue: "disposable",
                dispose: () => {
                    serviceDisposed = true;
                },
            }),
        };

        const token1 = StartInspectable(scene, { serviceDefinitions: [extraService] });
        const token2 = StartInspectable(scene);

        await new Promise((resolve) => setTimeout(resolve, 200));

        token1.dispose();
        expect(serviceDisposed).toBe(true);

        token2.dispose();
    });

    it("multiple callers can add different extra services", async () => {
        let service1Created = false;
        let service2Created = false;

        const extra1: WeaklyTypedServiceDefinition = {
            friendlyName: "Extra Service 1",
            produces: [TestServiceIdentity],
            factory: () => {
                service1Created = true;
            },
        };

        const extra2: WeaklyTypedServiceDefinition = {
            friendlyName: "Extra Service 2",
            produces: [TestService2Identity],
            factory: () => {
                service2Created = true;
            },
        };

        const token1 = StartInspectable(scene, { serviceDefinitions: [extra1] });
        const token2 = StartInspectable(scene, { serviceDefinitions: [extra2] });

        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(service1Created).toBe(true);
        expect(service2Created).toBe(true);

        token1.dispose();
        token2.dispose();
    });
});
