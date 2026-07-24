import { describe, expect, it } from "vitest";
import { Line } from "../../src/2D/controls/line";
import { Rectangle } from "../../src/2D/controls/rectangle";
import { Measure } from "../../src/2D/measure";

class TestLine extends Line {
    public prepareMeasure(parentMeasure: Measure): void {
        this._preMeasure(parentMeasure);
    }
}

describe("Line layout", () => {
    it("uses the current parent origin while measuring a connected control", () => {
        const line = new TestLine("line");
        const connectedControl = new Rectangle("connectedControl");
        const parentMeasure = new Measure(600, 400, 800, 600);

        connectedControl._currentMeasure.copyFromFloats(750, 500, 100, 40);
        line.connectedControl = connectedControl;
        line.x2 = 20;
        line.y2 = -10;
        line.prepareMeasure(parentMeasure);

        expect(line._effectiveX2).toBe(220);
        expect(line._effectiveY2).toBe(110);
    });
});
