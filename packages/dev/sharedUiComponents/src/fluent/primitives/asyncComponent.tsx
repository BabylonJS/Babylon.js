import type { ComponentProps, ComponentType } from "react";
import type { SpinnerProps } from "@fluentui/react-components";

import { forwardRef, lazy, Suspense } from "react";
import { Spinner } from "@fluentui/react-components";

type AsyncComponentOptions = {
    spinnerSize?: SpinnerProps["size"];
    spinnerLabel?: string;
};

/**
 * Creates an asynchronous component wrapper that loads a React component lazily/asynchronously.
 * @param componentFactory A function that returns a promise resolving to the component.
 * @param options Options for the loading spinner.
 * @returns A React component that displays a spinner while loading the async component.
 */
export function MakeAsyncComponent<ComponentT extends ComponentType<any>>(componentFactory: () => Promise<ComponentT>, options?: AsyncComponentOptions) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const LazyComponent = lazy(async () => {
        const module = await componentFactory();
        return { default: module };
    });

    return forwardRef<ComponentProps<ComponentT>>((props, ref) => {
        const componentProps = { ...props, ref };

        return (
            <Suspense fallback={<Spinner size={options?.spinnerSize} label={options?.spinnerLabel} />}>
                <LazyComponent {...(componentProps as ComponentProps<ComponentT>)} />
            </Suspense>
        );
    }) as unknown as ComponentT;
}
