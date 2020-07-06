import { StringTools } from './stringTools';
import { Logger } from './logger';

var cloneValue = (source: any, destinationObject: any) => {
    if (!source) {
        return null;
    }

    if (source.getClassName && source.getClassName() === "Mesh") {
        return null;
    }

    if (source.getClassName && source.getClassName() === "SubMesh") {
        return source.clone(destinationObject);
    } else if (source.clone) {
        return source.clone();
    }
    return null;
};

function getAllPropertyNames(obj: any): string[] {
    const props: string[] = [];

    do {
        Object.getOwnPropertyNames(obj).forEach(function(prop) {
            if (props.indexOf(prop) === -1) {
                props.push(prop);
            }
        });
    } while (obj = Object.getPrototypeOf(obj));

    return props;
}

/**
 * Class containing a set of static utilities functions for deep copy.
 */
export class DeepCopier {
    /**
     * Tries to copy an object by duplicating every property
     * @param source defines the source object
     * @param destination defines the target object
     * @param doNotCopyList defines a list of properties to avoid
     * @param mustCopyList defines a list of properties to copy (even if they start with _)
     */
    public static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void {
        const proerties = getAllPropertyNames(source);
        for (var prop of proerties) {

            if (prop[0] === "_" && (!mustCopyList || mustCopyList.indexOf(prop) === -1)) {
                continue;
            }

            if (StringTools.EndsWith(prop, "Observable")) {
                continue;
            }

            if (doNotCopyList && doNotCopyList.indexOf(prop) !== -1) {
                continue;
            }

            var sourceValue = source[prop];
            var typeOfSourceValue = typeof sourceValue;

            if (typeOfSourceValue === "function") {
                continue;
            }

            try {
                if (typeOfSourceValue === "object") {
                    if (sourceValue instanceof Array) {
                        destination[prop] = [];

                        if (sourceValue.length > 0) {
                            if (typeof sourceValue[0] == "object") {
                                for (var index = 0; index < sourceValue.length; index++) {
                                    var clonedValue = cloneValue(sourceValue[index], destination);

                                    if (destination[prop].indexOf(clonedValue) === -1) { // Test if auto inject was not done
                                        destination[prop].push(clonedValue);
                                    }
                                }
                            } else {
                                destination[prop] = sourceValue.slice(0);
                            }
                        }
                    } else {
                        destination[prop] = cloneValue(sourceValue, destination);
                    }
                } else {
                    destination[prop] = sourceValue;
                }
            }
            catch (e) {
                // Log a warning (it could be because of a read-only property)
                Logger.Warn(e.message);
            }
        }
    }
}
