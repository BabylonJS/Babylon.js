module BABYLON {
    export interface Behavior<T> {
        name: string;

        init(): void
        attach(target: T): void;
        detach(): void;
    }

    export interface IBehaviorAware<T> {
        addBehavior(behavior: Behavior<T>): T
        removeBehavior(behavior: Behavior<T>): T;
        getBehaviorByName(name: string): Nullable<Behavior<T>>;
    }
}