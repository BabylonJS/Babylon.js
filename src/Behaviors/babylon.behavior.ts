module BABYLON {
    export interface Behavior<T extends Node> {
        name: string;

        attach(node: T): void;
        detach(node: T): void;
    }
}