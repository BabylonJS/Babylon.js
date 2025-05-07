// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, Nullable } from "core/index";

import type { IService, ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IShellService } from "../../shellService";

import { makeStyles } from "@fluentui/react-components";
import { DocumentTextRegular } from "@fluentui/react-icons";
import { useMemo, type ComponentType } from "react";

import { Observable } from "core/Misc/observable";
import { useObservableCollection, useObservableState } from "../../../hooks/observableHooks";
import { ObservableCollection } from "../../../misc/observableCollection";
import { ShellServiceIdentity } from "../../shellService";

export const PropertiesServiceIdentity = Symbol("PropertiesService");
export interface IPropertiesService extends IService<typeof PropertiesServiceIdentity> {
    addEntityType<T>(predicate: (entity: unknown) => entity is T, component: ComponentType<{ entity: T }>): IDisposable;
    boundEntity: Nullable<unknown>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    },
});

export const PropertiesServiceDefinition: ServiceDefinition<[IPropertiesService], [IShellService]> = {
    friendlyName: "Properties Editor",
    produces: [PropertiesServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const entityTypesCollection = new ObservableCollection<{ predicate: (entity: unknown) => boolean; component: ComponentType<{ entity: unknown }> }>();
        let boundEntityState: Nullable<unknown> = null;
        const boundEntityObservable = new Observable<Nullable<unknown>>();

        const registration = shellService.addToRightPane({
            key: "Properties",
            title: "Properties",
            icon: DocumentTextRegular,
            suppressTeachingMoment: true,
            content: () => {
                const classes = useStyles();

                const entityTypes = useObservableCollection(entityTypesCollection);
                const boundEntity = useObservableState(() => boundEntityState, boundEntityObservable);

                // eslint-disable-next-line @typescript-eslint/naming-convention
                const EntityComponent = useMemo(() => entityTypes.find((type) => type.predicate(boundEntity))?.component, [entityTypes, boundEntity]);

                return (
                    <div className={classes.rootDiv}>
                        {EntityComponent ? (
                            <EntityComponent entity={boundEntity} />
                        ) : boundEntity ? (
                            `No component found for this entity type (${boundEntity.toString()})`
                        ) : (
                            "No entity selected"
                        )}
                    </div>
                );
            },
        });

        return {
            addEntityType: (predicate, component) => entityTypesCollection.add({ predicate, component: component as ComponentType<{ entity: unknown }> }),
            get boundEntity() {
                return boundEntityState;
            },
            set boundEntity(entity) {
                if (boundEntityState !== entity) {
                    boundEntityState = entity;
                    boundEntityObservable.notifyObservers(entity);
                }
            },
            dispose: () => registration.dispose(),
        } satisfies IPropertiesService & IDisposable;
    },
};
