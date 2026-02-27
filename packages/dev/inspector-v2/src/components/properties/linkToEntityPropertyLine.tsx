import type { FunctionComponent } from "react";

import type { Nullable } from "core/types";
import { Link } from "shared-ui-components/fluent/primitives/link";
import type { PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import type { ISelectionService } from "../../services/selectionService";

/** Props for the LinkToEntity component */
export type LinkToEntityProps = {
    /** The entity to link to, or null if no entity is available */
    entity: Nullable<{ name: string; reservedDataStore?: Record<PropertyKey, unknown> }>;
    /** The selection service used to navigate to the entity */
    selectionService: ISelectionService;
};

/**
 * A clickable link that navigates to a specific entity in the inspector.
 * Renders nothing when the entity is null or hidden.
 * @param props - The entity and selection service
 * @returns A link component, or null
 */
export const LinkToEntity: FunctionComponent<LinkToEntityProps> = ({ entity, selectionService }) => {
    if (!entity || entity.reservedDataStore?.hidden) {
        return null;
    }

    return <Link value={entity.name} onLink={() => (selectionService.selectedEntity = entity)} />;
};

/**
 * A property line that links to a specific entity in the scene.
 * @param props an entity and a selection service
 * @returns A link property line component.
 */
export const LinkToEntityPropertyLine: FunctionComponent<PropertyLineProps<string> & LinkToEntityProps> = (props) => {
    const { selectionService, entity, ...rest } = props;
    if (!entity || entity.reservedDataStore?.hidden) {
        return null;
    }
    return (
        <PropertyLine {...rest}>
            <LinkToEntity entity={entity} selectionService={selectionService} />
        </PropertyLine>
    );
};
