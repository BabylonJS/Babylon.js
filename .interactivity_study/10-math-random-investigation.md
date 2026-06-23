# 10 — math/random investigation & fix

Status: **FIXED**. All 4 `random.glb` sub-tests pass. Full batch: 109 ok / 10 FAIL (the 10 are pre-existing precision/unimplemented failures, unchanged). Core unit suites: 313 FlowGraph + 205 Interactivity all pass.

## The asset (`math/random/random.glb`)
Four sub-tests (self-tested via debug/log; failure logs contain `ERROR!`):

1. **Random (new number in new flow)** — expect `true`. Stores `random#0` into a variable, flows `onStart → sequence → variable/set → debug/log → flow/branch`, then `math/eq` re-reads `random#0`. The re-read happens *after* flow nodes executed, so per spec it MUST be a **new** value ⇒ `eq` false ⇒ success path.
2. **Random (same number in current flow)** — expect `0`. `math/sub(random#15, random#15)` — the same node read twice **within one evaluation** (no flow activation between reads) MUST return the same value ⇒ difference `0`.
3. **Monte Carlo 1k** — `flow/for` 0..1000, each iteration samples a point from two random nodes, counts those inside the unit circle; `4 * inside/1000 ≈ π` (tolerance 0.3).
4. **Monte Carlo 10k** — same, 0..10000, tolerance 0.08.

## Spec references (Specification.adoc)
- L239: "output value sockets **MUST** retain their values until an interactivity node with one or more flow sockets is executed."
- L1105: two accesses return the same value if there were no flow socket activations between them.
- L1113: the value **MUST** be updated when accessed as a result of a new flow socket activation, including self-activations.
- L3235-3245 (`flow/for`): increment index by 1 and **self-activate** `in` each iteration; no iteration cap in the spec.

## Root causes
### Issue 1 — random not fresh across flows
`flowGraphSignalConnection.pure.ts` increased the execution id **after** `_execute`. Flow execution is synchronous and nested (a block activates its `out` inside its own `_execute`), so an entire flow chain ran at the **same** execution id. `FlowGraphCachedOperationBlock` (random's base) memoizes by execution id ⇒ random returned the same value across the whole chain ⇒ sub-test 1 `eq(A,A)=true` ⇒ FAIL.

### Issue 2 — 10k loop capped at 1000
`flowGraphForLoopBlock.pure.ts` capped with `if (i > MaxLoopIterations * step)` where `MaxLoopIterations = 1000`. This caps on the index **value**, not the iteration **count** (also breaks for any loop whose `startIndex > MaxLoopIterations`). The 10k loop was cut to ~1000 iterations ⇒ ratio ≈ 0.31 ⇒ FAIL.

## Fixes
1. `flowGraphSignalConnection.pure.ts`: move `context._increaseExecutionId()` to **before** `_execute` (after the breakpoint check). Each flow socket activation now starts a new execution frame, while the id stays **constant within** a single block execution (incremented before the block runs, not during), so per-frame value caching still works. This matches the spec ("retain until a flow node is executed").
2. `flowGraphForLoopBlock.pure.ts`: count **iterations** (`++iterations >= MaxLoopIterations`) instead of capping on index value, and raise `MaxLoopIterations` 1000 → 100000.

## Why this is safe (validation)
- executionId stays constant within one block evaluation ⇒ "same number in current flow" (sub-test 2) and the unit test "Values are cached for the same execution id" still pass.
- No unit test asserts a concrete executionId value; the physics test sets it directly (unaffected).
- ForLoop unit test (start 1, end 7, step 2 → 1,3,5) and loaders `flow/for` (0..4) unaffected by the count-based cap.
- Full batch after fix: math/random ✓, and the other 109 assets unchanged (the 10 failures are the same pre-existing precision/unimplemented set: OkLCh×2, slerp, matDecompose, normalize, inverse, transform, combine4x4, quatFromUpForward, get_set_morphtargets).

## Observed run (proof)
```
new number in new flow : A=0.615, B=0.297 → Test Successful
same number in current flow : Value is 0 → Test Successful
Monte Carlo 1k  : 775/1000  → 3.1    → Test Successful
Monte Carlo 10k : 7817/10000 → 3.1268 → Test Successful
```

## Note on flow/for vs spec
The current block keeps a non-standard `step` input and runs the loop synchronously instead of literally self-activating `in`. Behaviourally it still produces fresh per-iteration randoms (each loop-body flow node bumps the execution id). Aligning `flow/for` exactly with the spec (drop `step`, real self-activation) is a larger refactor tracked separately; not required for conformance here.
