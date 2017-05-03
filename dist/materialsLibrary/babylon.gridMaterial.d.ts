/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    /**
     * The grid materials allows you to wrap any shape with a grid.
     * Colors are customizable.
     */
    class GridMaterial extends BABYLON.Material {
        /**
         * Main color of the grid (e.g. between lines)
         */
        mainColor: Color3;
        /**
         * Color of the grid lines.
         */
        lineColor: Color3;
        /**
         * The scale of the grid compared to unit.
         */
        gridRatio: number;
        /**
         * The frequency of thicker lines.
         */
        majorUnitFrequency: number;
        /**
         * The visibility of minor units in the grid.
         */
        minorUnitVisibility: number;
        /**
         * The grid opacity outside of the lines.
         */
        opacity: number;
        private _gridControl;
        private _renderId;
        private _defines;
        private _cachedDefines;
        /**
         * constructor
         * @param name The name given to the material in order to identify it afterwards.
         * @param scene The scene the material is used in.
         */
        constructor(name: string, scene: Scene);
        /**
         * Returns wehter or not the grid requires alpha blending.
         */
        needAlphaBlending(): boolean;
        private _checkCache(scene, mesh?, useInstances?);
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): GridMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): GridMaterial;
    }
}
