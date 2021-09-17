/**
 * Custom block example
 */

 (function () {
    "use strict";

    var NodeMaterialBlock = BABYLON.NodeMaterialBlock;
    var NodeMaterialBlockConnectionPointTypes = BABYLON.NodeMaterialBlockConnectionPointTypes;
    var NodeMaterialBlockTargets = BABYLON.NodeMaterialBlockTargets;

    /**
     * Block used to square a value
     */
    function SquareBlock(name) {
        NodeMaterialBlock.call(this, name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("value", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
    }
    SquareBlock.prototype = Object.create(NodeMaterialBlock.prototype);
    SquareBlock.prototype.constructor = SquareBlock;

    /**
     * Gets the block's comments (used for showing tooltips)
     * @returns the block's comments
     */
    SquareBlock.GetComments = function () {
        return "Square the input value";
    };

    /**
     * Gets the current class name
     * @returns the class name
     */
    SquareBlock.prototype.getClassName = function () {
        return "SquareBlock";
    };

    Object.defineProperty(SquareBlock.prototype, "value", {
        /**
         * Gets the value input component
         */
        get: function () {
            return this._inputs[0];
        },
        enumerable: false,
        configurable: true
    });

    Object.defineProperty(SquareBlock.prototype, "output", {
        /**
         * Gets the output component
         */
        get: function () {
            return this._outputs[0];
        },
        enumerable: false,
        configurable: true
    });

    SquareBlock.prototype._buildBlock = function (state) {
        NodeMaterialBlock.prototype._buildBlock.call(this, state);

        state.compilationString += this._declareOutput(this.output, state) +
            (" = " + this.value.associatedVariableName + " * " + this.value.associatedVariableName + ";\r\n");

        return this;
    };

    BABYLON.SquareBlock = SquareBlock;
    BABYLON._TypeStore.RegisteredTypes["BABYLON.SquareBlock"] = SquareBlock;
})();