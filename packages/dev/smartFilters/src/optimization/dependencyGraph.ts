import { Logger } from "core/Misc/logger.js";

/**
 * Implementation of a dependency graph.
 */
export class DependencyGraph<T> {
    private _list: Set<T>;
    private _dependOn: Map<T, Set<T>>;
    private _requiredBy: Map<T, Set<T>>;

    /**
     * Creates a new instance of a dependency graph.
     */
    constructor() {
        this._list = new Set();
        this._dependOn = new Map();
        this._requiredBy = new Map();
    }

    /**
     * Adds an element to the graph.
     * @param element - The element to add to the graph.
     */
    public addElement(element: T) {
        if (this._list.has(element)) {
            throw new Error(`Element "${element}" already added to the graph!`);
        }

        this._list.add(element);
    }

    /**
     * Adds a dependency between two elements.
     * @param element - The element that depends on another element.
     * @param dependency - The element that is required by the element passed as the first parameter.
     */
    public addDependency(element: T, dependency: T) {
        if (!this._dependOn.has(element)) {
            this._dependOn.set(element, new Set());
        }

        if (!this._requiredBy.has(dependency)) {
            this._requiredBy.set(dependency, new Set());
        }

        this._dependOn.get(element)!.add(dependency);
        this._requiredBy.get(dependency)!.add(element);
    }

    /**
     * Walks through the graph and calls the callback for each element.
     * The elements that depend on other elements will be traversed after the elements they depend on.
     * Note: the graph will be modified during the walk, so don't call walk twice on the same graph!
     * @param callback - The callback to call for each element.
     */
    public walk(callback: (element: T) => void) {
        const toVisit: T[] = [];

        // Collect all elements that have no dependency
        for (const element of this._list) {
            if (!this._dependOn.get(element)) {
                toVisit.push(element);
                this._list.delete(element);
            }
        }

        // Loop over all elements that have no dependency
        while (toVisit.length > 0) {
            const element = toVisit.shift()!;

            callback(element);

            this._list.delete(element);

            const requiredBy = this._requiredBy.get(element);
            if (requiredBy) {
                for (const dependingElement of requiredBy) {
                    const dependencies = this._dependOn.get(dependingElement);

                    if (dependencies) {
                        dependencies.delete(element);

                        if (dependencies.size === 0) {
                            toVisit.push(dependingElement);
                        }
                    }
                }
            }
        }

        if (this._list.size > 0) {
            Logger.Error(JSON.stringify(this._list));
            throw new Error("Circular dependency detected!");
        }
    }
}
