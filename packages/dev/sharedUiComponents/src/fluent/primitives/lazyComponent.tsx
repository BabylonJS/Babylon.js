import type { SpinnerProps } from "@fluentui/react-components";
import type { ComponentProps, ComponentType, ElementRef, Ref } from "react";

import { Spinner } from "@fluentui/react-components";
import { forwardRef, lazy, Suspense } from "react";

type LazyComponentProps = {
    spinnerSize?: SpinnerProps["size"];
    spinnerLabel?: string;
};

/**
 * Creates a lazy component wrapper that only calls the async function to get the underlying component when the lazy component is actually mounted.
 * This allows deferring imports until they are needed. While the underlying component is being loaded, a spinner is displayed.
 * @param getComponentAsync A function that returns a promise resolving to the component.
 * @param defaultProps Options for the loading spinner.
 * @returns A React component that displays a spinner while loading the async component.
 */
export function MakeLazyComponent<ComponentT extends ComponentType<any>>(getComponentAsync: () => Promise<ComponentT>, defaultProps?: LazyComponentProps) {
    type WrappedComponentProps = ComponentProps<ComponentT> & LazyComponentProps;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const LazyComponent = lazy(async () => {
        const component = await getComponentAsync();
        return { default: component };
    });

    return forwardRef<ElementRef<typeof Spinner | ComponentT>, WrappedComponentProps>((props, ref) => {
        const { spinnerSize = defaultProps?.spinnerSize, spinnerLabel = defaultProps?.spinnerLabel, ...rest } = props;

        const componentProps = { ...rest, ref };

        return (
            <Suspense fallback={<Spinner ref={ref as Ref<ElementRef<typeof Spinner>>} size={spinnerSize} label={spinnerLabel} />}>
                <LazyComponent {...(componentProps as ComponentProps<ComponentT>)} />
            </Suspense>
        );
    });
}
