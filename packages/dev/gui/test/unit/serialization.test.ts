import { Rectangle } from "../../src/2D/controls/rectangle";

describe("GUI Serialization test", () => {
    it("Respects the isSerializable property", () => {
        const rect = new Rectangle("rect");

        const s1 = {};
        rect.serialize(s1);

        // s1 will contain something
        expect(s1).not.toEqual({});

        rect.isSerializable = false;
        const s2 = {};
        rect.serialize(s2);

        // s2 will be empty
        expect(s2).toEqual({});
    });
});
