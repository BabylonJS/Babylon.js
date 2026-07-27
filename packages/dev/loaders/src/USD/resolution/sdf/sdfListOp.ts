/**
 * USD list-editing operation for ordered lists such as references, payloads, inherits,
 * specializes, relationship targets, and attribute connections.
 */
export interface ISdfListOp<Item> {
    /** True when the authoring was an explicit list opinion that replaces weaker list opinions. */
    isExplicit: boolean;
    /** Explicit items, replacing weaker list opinions when present. */
    explicit?: Item[];
    /** Items prepended ahead of weaker items. */
    prepended?: Item[];
    /** Items appended after weaker items. */
    appended?: Item[];
    /** Legacy "add" items. Composition applies these with USD list-op semantics. */
    added?: Item[];
    /** Items removed from weaker opinions. */
    deleted?: Item[];
    /** Reordering constraints applied after list composition. */
    ordered?: Item[];
}

/**
 * Flattens one authored list op into its addition-side items, with no weaker base beneath it.
 *
 * This is the single canonical reader for a *standalone* list op (one that is not being composed
 * over a weaker opinion). Its result mirrors the composition-time authority `ApplyListOp`
 * (composeLayerStack) applied over an empty base with an identity key: an explicit opinion replaces
 * everything, otherwise items compose in prepended, then appended, then added order. Base-relative
 * `deleted`/`ordered` edits are composition-time concerns and are intentionally not applied here.
 *
 * Every standalone list-op read in the loader must go through this reader so the rule cannot diverge
 * across call sites (as it previously did between the mapping, prefetch, and composition layers).
 * @param listOp the authored list op to read, if any
 * @returns the composed addition-side items in canonical order
 */
export function ReadListOpItems<Item>(listOp: ISdfListOp<Item> | undefined): Item[] {
    if (!listOp) {
        return [];
    }
    if (listOp.isExplicit) {
        return [...(listOp.explicit ?? [])];
    }
    return [...(listOp.prepended ?? []), ...(listOp.appended ?? []), ...(listOp.added ?? [])];
}
