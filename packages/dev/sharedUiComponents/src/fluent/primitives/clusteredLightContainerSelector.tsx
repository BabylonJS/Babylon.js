import { type FunctionComponent, useCallback } from "react";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { type PrimitiveProps } from "./primitive";
import { type EntitySelectorProps, EntitySelector } from "./entitySelector";

import { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";

export type ClusteredLightContainerSelectorProps = PrimitiveProps<Nullable<ClusteredLightContainer>> & {
    /**
     * The scene to get clustered light containers from
     */
    scene: Scene;
    /**
     * Optional filter function to filter which clustered light containers are shown
     */
    filter?: (container: ClusteredLightContainer) => boolean;
} & Omit<EntitySelectorProps<ClusteredLightContainer>, "getEntities" | "getName">;

/**
 * A primitive component with a ComboBox for selecting from existing scene clustered light containers.
 * @param props ClusteredLightContainerSelectorProps
 * @returns ClusteredLightContainerSelector component
 */
export const ClusteredLightContainerSelector: FunctionComponent<ClusteredLightContainerSelectorProps> = (props) => {
    ClusteredLightContainerSelector.displayName = "ClusteredLightContainerSelector";
    const { scene, ...rest } = props;

    const getClusteredLightContainers = useCallback(
        () => scene.lights.filter((light): light is ClusteredLightContainer => light instanceof ClusteredLightContainer),
        [scene.lights]
    );
    const getName = useCallback((container: ClusteredLightContainer) => container.name, []);

    return <EntitySelector {...rest} getEntities={getClusteredLightContainers} getName={getName} />;
};
