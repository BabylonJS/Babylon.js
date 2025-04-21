import type { ComponentType } from "react";

export type ComponentInfo = Readonly<{
    /**
     * The key of the component.
     */
    key: string;

    /**
     * The component itself.
     */
    component: ComponentType;

    /**
     * The order of the component relative to sibling components.
     */
    order?: number;
}>;
