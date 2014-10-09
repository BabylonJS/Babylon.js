var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    /**
    * sub-class of ReferenceDeformation, where the referenceStateName is Fixed to "BASIS"
    */
    var Deformation = (function (_super) {
        __extends(Deformation, _super);
        /**
        * @param {string} shapeKeyGroupName -  Used by Automaton to place in the correct ShapeKeyGroup queue(s).
        * @param {string} endStateName - Name of state key to deform to
        * @param {number} milliDuration - The number of milli seconds the deformation is to be completed in
        * @param {number} millisBefore - Fixed wait period, once a syncPartner (if any) is also ready (default 0)
        * @param {number} endStateRatio - ratio of the end state to be obtained from reference state: -1 (mirror) to 1 (default 1)
        * @param {Vector3} movePOV - Mesh movement relative to its current position/rotation to be performed at the same time  (default null)
        *                  right-up-forward
        * @param {Vector3} rotatePOV - Incremental Mesh rotation to be performed at the same time  (default null)
        *                  flipBack-twirlClockwise-tiltRight
        * @param {Pace} pace - Any Object with the function: getCompletionMilestone(currentDurationRatio) (default Pace.LINEAR)
        */
        function Deformation(shapeKeyGroupName, endStateName, milliDuration, millisBefore, endStateRatio, movePOV, rotatePOV, pace) {
            _super.call(this, shapeKeyGroupName, "BASIS", endStateName, milliDuration, millisBefore, endStateRatio, movePOV, rotatePOV, pace);
        }
        return Deformation;
    })(BABYLON.ReferenceDeformation);
    BABYLON.Deformation = Deformation;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.deformation.js.map
