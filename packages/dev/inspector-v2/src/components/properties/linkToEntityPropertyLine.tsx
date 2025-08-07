import type { PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import type { ISelectionService } from "../../services/selectionService";
import { useEffect, useState, type FunctionComponent } from "react";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import type { Nullable } from "core/types";

type LinkToEntityProps = { entity: Nullable<{ name: string; reservedDataStore?: Record<PropertyKey, unknown> }>; selectionService: ISelectionService };

/**
 * A property line that links to a specific entity in the scene.
 * @param props an entity and a selection service
 * @returns A link property line component.
 */
export const LinkToEntityPropertyLine: FunctionComponent<PropertyLineProps<string> & LinkToEntityProps> = (props) => {
    const { selectionService, entity, ...rest } = props;
    const [linkedEntity, setLinkedEntity] = useState(entity);
    useEffect(() => {
        setLinkedEntity(props.entity);
    }, [props.entity]);
    return (
        linkedEntity &&
        !linkedEntity.reservedDataStore?.hidden && <LinkPropertyLine {...rest} value={linkedEntity.name} onLink={() => (selectionService.selectedEntity = linkedEntity)} />
    );
};
