/**
 * Quick sanity test for TC39 decorator migration.
 * Tests the core decorator functions work correctly with Symbol.metadata.
 */
import { serialize, serializeAsColor3, expandToProperty } from "core/Misc/decorators";
import { GetDirectStore, GetMergedStore } from "core/Misc/decorators.functions";
import { Color3 } from "core/Maths/math.color";

describe("TC39 Decorator Migration", () => {
    describe("serialize decorator", () => {
        it("should store serialization metadata via Symbol.metadata", () => {
            class TestClass {
                @serialize()
                public myProp: number = 42;

                @serialize("renamedProp")
                public anotherProp: string = "hello";
            }

            const store = GetDirectStore(new TestClass());
            expect(store).toBeDefined();
            expect(store["myProp"]).toBeDefined();
            expect(store["myProp"].type).toBe(0); // default type
            expect(store["renamedProp"]).toBeDefined();
        });

        it("should merge stores from parent and child classes", () => {
            class Parent {
                @serialize()
                public parentProp: number = 1;
            }

            class Child extends Parent {
                @serialize()
                public childProp: number = 2;
            }

            const child = new Child();
            const merged = GetMergedStore(child);
            expect(merged["parentProp"]).toBeDefined();
            expect(merged["childProp"]).toBeDefined();
        });
    });

    describe("serializeAsColor3 decorator", () => {
        it("should serialize color3 properties", () => {
            class ColorClass {
                @serializeAsColor3()
                public color: Color3 = new Color3(1, 0, 0);
            }

            const store = GetDirectStore(new ColorClass());
            expect(store["color"]).toBeDefined();
        });
    });

    describe("expandToProperty decorator", () => {
        it("should create getter/setter that reads from backing field", () => {
            class ExpandClass {
                // @ts-expect-error Accessed dynamically by expandToProperty decorator
                private _myCallback() {
                    // no-op
                }

                @expandToProperty("_myCallback")
                public accessor myExpanded: number;

                // @ts-expect-error Backing field accessed dynamically by expandToProperty
                private _myExpanded: number = 10;
            }

            const instance = new ExpandClass();
            expect(instance.myExpanded).toBe(10);

            instance.myExpanded = 20;
            expect(instance.myExpanded).toBe(20);
        });
    });
});
