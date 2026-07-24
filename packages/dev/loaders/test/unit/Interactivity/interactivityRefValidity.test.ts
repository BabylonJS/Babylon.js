import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { getNumericValue } from "core/FlowGraph/utils";
import { MarkDelayActive, MarkDelayInactive, IsDelayActive } from "core/FlowGraph/flowGraphDelayReference";
import { GetEventReference } from "core/FlowGraph/flowGraphEventReference";
import { InteractivityRefPathToObjectConverter } from "loaders/glTF/2.0/Extensions/interactivityRefPathToObjectConverter";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

/**
 * Coverage for the KHR_interactivity ref-validity `pointer/get` accessors
 * (spec §4.2.3 Event References and §4.2.4 Delay References), resolved by
 * {@link InteractivityRefPathToObjectConverter}.
 */
describe("KHR_interactivity ref-validity accessors", () => {
    let engine: NullEngine;
    let scene: Scene;
    let context: FlowGraphContext;
    const converter = new InteractivityRefPathToObjectConverter();

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = coordinator.createGraph();
        context = graph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("delay references (/extensions/KHR_interactivity/delays/{})", () => {
        it("marks a delay active and resolves it as valid until cleared", () => {
            expect(IsDelayActive(context, 0)).toBe(false);

            MarkDelayActive(context, 0);
            expect(IsDelayActive(context, 0)).toBe(true);

            // pointer/get on an active delay ref => value is the delay handle, isValid (truthy) true.
            const active = converter.convert("/extensions/KHR_interactivity/delays/0/");
            const value = active.info.get(active.object, undefined, context);
            expect(value).toBeInstanceOf(FlowGraphInteger);
            expect(getNumericValue(value as FlowGraphInteger)).toBe(0);

            // Once the delay fires or is cancelled it is no longer valid.
            MarkDelayInactive(context, 0);
            expect(IsDelayActive(context, 0)).toBe(false);
            expect(converter.convert("/extensions/KHR_interactivity/delays/0/").info.get(active.object, undefined, context)).toBeUndefined();
        });

        it("resolves an unknown or never-scheduled delay ref as invalid", () => {
            expect(converter.convert("/extensions/KHR_interactivity/delays/7/").info.get({}, undefined, context)).toBeUndefined();
        });

        it("returns undefined when no context is supplied", () => {
            MarkDelayActive(context, 2);
            const accessor = converter.convert("/extensions/KHR_interactivity/delays/2/");
            // Without the runtime context the active-delay set cannot be queried.
            expect(accessor.info.get(accessor.object)).toBeUndefined();
        });

        it("tracks multiple independent delay indices", () => {
            MarkDelayActive(context, 1);
            MarkDelayActive(context, 4);
            expect(IsDelayActive(context, 1)).toBe(true);
            expect(IsDelayActive(context, 4)).toBe(true);
            expect(IsDelayActive(context, 2)).toBe(false);

            MarkDelayInactive(context, 1);
            expect(IsDelayActive(context, 1)).toBe(false);
            expect(IsDelayActive(context, 4)).toBe(true);
        });
    });

    describe("event references (/extensions/KHR_interactivity/events/{})", () => {
        it("resolves an event ref produced by an event operation as valid", () => {
            const eventRef = GetEventReference("onStart");
            // The path-template substitution reconstructs the event ref path with a trailing slash.
            const accessor = converter.convert(eventRef + "/");
            const value = accessor.info.get(accessor.object, undefined, context);
            // Spec: on success the value output equals the input reference.
            expect(value).toBe(eventRef);
        });

        it("resolves custom-event receiver refs as valid", () => {
            const eventRef = GetEventReference("myCustomEvent");
            const accessor = converter.convert(eventRef + "/");
            expect(accessor.info.get(accessor.object, undefined, context)).toBe(eventRef);
        });

        it("exposes a non-null target for the event accessor", () => {
            const accessor = converter.convert(GetEventReference("onTick") + "/");
            expect(accessor.info.getTarget(accessor.object)).toBeTruthy();
        });
    });
});
