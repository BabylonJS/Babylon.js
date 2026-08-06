import { describe, expect, it } from "vitest";
import { Line } from "../../src/2D/controls/line";
import { Rectangle } from "../../src/2D/controls/rectangle";

describe("Line connectedControl", () => {
    it("uses the connected control center relative to the line parent", () => {
        const line = new Line("line");
        const connectedControl = new Rectangle("connectedControl");

        line._cachedParentMeasure.copyFromFloats(600, 400, 800, 600);
        connectedControl._currentMeasure.copyFromFloats(750, 500, 100, 40);
        line.connectedControl = connectedControl;
        line.x2 = 20;
        line.y2 = -10;

        expect(line._effectiveX2).toBe(220);
        expect(line._effectiveY2).toBe(110);
    });
});
