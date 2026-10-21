import { AndOrNotEvaluator } from "core/Misc/andOrNotEvaluator";
import { Tags } from "core/Misc/tags";

const Evaluate = (query: string, trueValues: string[]) => AndOrNotEvaluator.Eval(query, (value) => trueValues.includes(value));

describe("AndOrNotEvaluator", () => {
    it("keeps a true operand when an 'and' chain follows it in an 'or' chain", () => {
        expect(Evaluate("a || b && c", ["a"])).toBe(true);
        expect(Evaluate("a || b && c || d", ["a"])).toBe(true);
        expect(Evaluate("a || b && c", ["b", "c"])).toBe(true);
        expect(Evaluate("a || b && c", ["b"])).toBe(false);
        expect(Evaluate("a || b && c", [])).toBe(false);
    });

    it("evaluates plain 'or' and 'and' chains", () => {
        expect(Evaluate("a || b", ["a"])).toBe(true);
        expect(Evaluate("a || b", ["b"])).toBe(true);
        expect(Evaluate("a || b", [])).toBe(false);
        expect(Evaluate("a && b || c", ["c"])).toBe(true);
        expect(Evaluate("a && b || c", ["a"])).toBe(false);
        expect(Evaluate("a && b || c && d", ["c", "d"])).toBe(true);
        expect(Evaluate("(a || b) && c", ["b", "c"])).toBe(true);
        expect(Evaluate("a && !b", ["a"])).toBe(true);
    });

    it("applies to tag queries", () => {
        const obj = {};
        Tags.EnableFor(obj);
        Tags.AddTagsTo(obj, "player");
        expect(Tags.MatchesQuery(obj, "player || enemy && alive")).toBe(true);
        expect(Tags.MatchesQuery(obj, "enemy && alive || player")).toBe(true);
        expect(Tags.MatchesQuery(obj, "enemy || npc && alive")).toBe(false);
    });
});
