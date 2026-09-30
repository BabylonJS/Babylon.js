/**
 * @vitest-environment jsdom
 */

import { act, type FunctionComponent, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";
import { useLatestAsyncOperation } from "../../src/lite/services/panes/properties/useLatestAsyncOperation";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

type Deferred<T> = Readonly<{
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
}>;

function MakeDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

type HarnessProps = Readonly<{
    identity: object;
    invalidations: readonly [Observable<void>, Observable<void>];
    refresh: Observable<void>;
    disposed: () => boolean;
    operations: Deferred<{ changed: boolean }>[];
    successes: string[];
}>;

const Harness: FunctionComponent<HarnessProps> = (props) => {
    const { identity, invalidations, disposed, operations, successes } = props;
    const [states, run] = useLatestAsyncOperation(identity, invalidations, disposed);
    const [latestId, setLatestId] = useState<string>();
    const state = latestId ? states[latestId] : undefined;
    const start = (id: string) => {
        const deferred = operations.shift()!;
        setLatestId(id);
        run({
            id,
            operationAsync: () => deferred.promise,
            onSuccess: (result) => successes.push(`${id}:${result.changed}`),
            getErrorMessage: (error) => (error instanceof Error ? error.message : "failed"),
        });
    };

    return (
        <>
            <button onClick={() => start("first")}>First</button>
            <button onClick={() => start("second")}>Second</button>
            <output>{state?.pending ? `pending:${latestId}` : state?.error ? `error:${latestId}:${state.error}` : "idle"}</output>
        </>
    );
};

describe("latest asynchronous operation generations", () => {
    const roots: Root[] = [];
    const containers: HTMLElement[] = [];

    afterEach(() => {
        roots.splice(0).forEach((root) => act(() => root.unmount()));
        containers.splice(0).forEach((container) => container.remove());
    });

    function Render(props: HarnessProps): { container: HTMLElement; root: Root } {
        const container = document.createElement("div");
        document.body.appendChild(container);
        containers.push(container);
        const root = createRoot(container);
        roots.push(root);
        act(() => root.render(<Harness {...props} />));
        return { container, root };
    }

    function MakeProps(operations: Deferred<{ changed: boolean }>[], identity = {}): HarnessProps {
        return {
            identity,
            invalidations: [new Observable<void>(), new Observable<void>()],
            refresh: new Observable<void>(),
            disposed: () => false,
            operations,
            successes: [],
        };
    }

    it("publishes only the latest overlapping completion and consumes stale rejection", async () => {
        const first = MakeDeferred<{ changed: boolean }>();
        const second = MakeDeferred<{ changed: boolean }>();
        const props = MakeProps([first, second]);
        const { container } = Render(props);
        const [firstButton, secondButton] = Array.from(container.querySelectorAll("button"));

        act(() => {
            firstButton.click();
            secondButton.click();
        });
        expect(container.textContent).toContain("pending:second");

        await act(async () => {
            first.reject(new Error("stale failure"));
            await first.promise.catch(() => undefined);
        });
        expect(container.textContent).toContain("pending:second");
        expect(container.textContent).not.toContain("stale failure");

        await act(async () => {
            second.resolve({ changed: false });
            await second.promise;
        });
        expect(props.successes).toEqual(["second:false"]);
        expect(container.textContent).toContain("idle");
    });

    it("preserves pending work across refresh and invalidates on disposal, selection, identity, and unmount", async () => {
        const deferreds = [MakeDeferred<{ changed: boolean }>(), MakeDeferred<{ changed: boolean }>(), MakeDeferred<{ changed: boolean }>()];
        const props = MakeProps([...deferreds]);
        const { container, root } = Render(props);

        act(() => {
            container.querySelector("button")!.click();
            props.refresh.notifyObservers();
        });
        await act(async () => {
            deferreds[0].resolve({ changed: true });
            await deferreds[0].promise;
        });
        expect(props.successes).toEqual(["first:true"]);
        expect(container.textContent).toContain("idle");

        act(() => {
            container.querySelector("button")!.click();
            props.invalidations[1].notifyObservers();
            root.render(<Harness {...props} identity={{}} />);
        });
        await act(async () => {
            deferreds[1].reject(new Error("obsolete"));
            await deferreds[1].promise.catch(() => undefined);
        });
        expect(container.textContent).not.toContain("obsolete");

        act(() => {
            container.querySelector("button")!.click();
            root.unmount();
        });
        roots.splice(roots.indexOf(root), 1);
        await act(async () => {
            deferreds[2].resolve({ changed: true });
            await deferreds[2].promise;
        });
        expect(props.successes).toEqual(["first:true"]);
    });

    it("clears obsolete errors on retry and suppresses completions after disposal", async () => {
        const rejected = MakeDeferred<{ changed: boolean }>();
        const disposed = MakeDeferred<{ changed: boolean }>();
        let isDisposed = false;
        const props = { ...MakeProps([rejected, disposed]), disposed: () => isDisposed };
        const { container } = Render(props);
        const [firstButton, secondButton] = Array.from(container.querySelectorAll("button"));

        act(() => firstButton.click());
        await act(async () => {
            rejected.reject(new Error("explicit failure"));
            await rejected.promise.catch(() => undefined);
        });
        expect(container.textContent).toContain("error:first:explicit failure");

        act(() => secondButton.click());
        expect(container.textContent).toContain("pending:second");
        expect(container.textContent).not.toContain("explicit failure");
        act(() => {
            isDisposed = true;
            props.invalidations[0].notifyObservers();
        });
        await act(async () => {
            disposed.resolve({ changed: true });
            await disposed.promise;
        });
        expect(props.successes).toEqual([]);
        expect(container.textContent).toContain("idle");
    });

    it("keeps rows and Inspector instances independent", async () => {
        const firstDeferred = MakeDeferred<{ changed: boolean }>();
        const secondDeferred = MakeDeferred<{ changed: boolean }>();
        const first = MakeProps([firstDeferred]);
        const second = MakeProps([secondDeferred]);
        const firstRender = Render(first);
        const secondRender = Render(second);

        act(() => {
            firstRender.container.querySelector("button")!.click();
            secondRender.container.querySelectorAll("button")[1].click();
        });
        await act(async () => {
            firstDeferred.resolve({ changed: true });
            secondDeferred.reject(new Error("second failed"));
            await Promise.all([firstDeferred.promise, secondDeferred.promise.catch(() => undefined)]);
        });

        expect(first.successes).toEqual(["first:true"]);
        expect(firstRender.container.textContent).toContain("idle");
        expect(second.successes).toEqual([]);
        expect(secondRender.container.textContent).toContain("error:second:second failed");
    });

    it("allows independent rows to complete without superseding each other", async () => {
        const firstDeferred = MakeDeferred<{ changed: boolean }>();
        const secondDeferred = MakeDeferred<{ changed: boolean }>();
        const props = MakeProps([firstDeferred, secondDeferred]);
        const { container } = Render(props);
        const [firstButton, secondButton] = Array.from(container.querySelectorAll("button"));

        act(() => {
            firstButton.click();
            secondButton.click();
        });
        await act(async () => {
            secondDeferred.resolve({ changed: true });
            await secondDeferred.promise;
            firstDeferred.resolve({ changed: true });
            await firstDeferred.promise;
        });

        expect(props.successes).toEqual(["second:true", "first:true"]);
    });
});
