export enum PropertyTypeForEdition {
    Boolean,
    Float,
    Vector2,
    List,
}

export interface IEditablePropertyListOption {
    "label": string;
    "value": number;
}

export interface IEditablePropertyOption {
    "min"?: number;
    "max"?: number;
    "notifiers"?: {
        "rebuild"?: boolean;
        "update"?: boolean;
    };
    "options"?: IEditablePropertyListOption[];
}

export interface IPropertyDescriptionForEdition {
    "propertyName": string;
    "displayName": string;
    "type": PropertyTypeForEdition;
    "groupName": string;
    "options": IEditablePropertyOption;
}

export function editableInPropertyPage(displayName: string, propertyType: PropertyTypeForEdition = PropertyTypeForEdition.Boolean, groupName: string = "PROPERTIES", options?: IEditablePropertyOption) {
    return (target: any, propertyKey: string) => {
        let propStore: IPropertyDescriptionForEdition[] = target._propStore;
        if (!propStore) {
            propStore = [];
            target._propStore = propStore;
        }
        propStore.push({
            "propertyName": propertyKey,
            "displayName": displayName,
            "type": propertyType,
            "groupName": groupName,
            "options": options ?? {}
        });
    };
}
