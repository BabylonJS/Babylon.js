var BABYLON;
(function (BABYLON) {
    /**
    *  Class used to coorelate duration ratio to completion ratio.  Enables Deformations to have
    *  characteristics like accelation, deceleration, & linear.
    */
    var Pace = (function () {
        /**
        * @immutable, reusable
        * @param {Array} completionRatios - values from (> 0 to 1.0), not required to increase from left to right, for 'hicup' effects
        * @param {Array} durationRatios - values from (> 0 to 1.0), MUST increase from left to right
        */
        function Pace(completionRatios, durationRatios) {
            this.completionRatios = completionRatios;
            this.durationRatios = durationRatios;
            // argument validations for JavaScript
            if (!(completionRatios instanceof Array) || !(durationRatios instanceof Array))
                throw "Pace: ratios not arrays";
            if (completionRatios.length !== durationRatios.length)
                throw "Pace: ratio arrays not of equal length";

            if (completionRatios.length === 0)
                throw "Pace: ratio arrays cannot be empty";

            var cRatio, dRatio, prevD = -1;
            for (var i = 0; i < completionRatios.length; i++) {
                cRatio = completionRatios[i];
                dRatio = durationRatios[i];
                if (cRatio <= 0 || dRatio <= 0)
                    throw "Pace: ratios must be > 0";
                if (cRatio > 1 || dRatio > 1)
                    throw "Pace: ratios must be <= 1";
                if (prevD >= dRatio)
                    throw "Pace: durationRatios must be in increasing order";
                prevD = dRatio;
            }
            if (cRatio !== 1 || dRatio !== 1)
                throw "Pace: final ratios must be 1";

            // public member assignment for all, since immutable
            this.steps = completionRatios.length;

            this.incremetalCompletionBetweenSteps = [completionRatios[0]]; // elements can be negative for 'hicups'
            this.incremetalDurationBetweenSteps = [durationRatios[0]];
            for (var i = 1; i < this.steps; i++) {
                this.incremetalCompletionBetweenSteps.push(completionRatios[i] - completionRatios[i - 1]);
                this.incremetalDurationBetweenSteps.push(durationRatios[i] - durationRatios[i - 1]);
            }
            Object.freeze(this); // make immutable
        }
        /**
        * Determine based on time since beginning,  return what should be ration of completion
        * @param{number} currentDurationRatio - How much time has elapse / how long it is supposed to take
        */
        Pace.prototype.getCompletionMilestone = function (currentDurationRatio) {
            // breakout start & running late cases, no need to take into account later
            if (currentDurationRatio <= 0)
                return 0;
            else if (currentDurationRatio >= 1)
                return 1;

            var upperIdx = 0;
            for (; upperIdx < this.steps; upperIdx++) {
                if (currentDurationRatio < this.durationRatios[upperIdx])
                    break;
            }

            var baseCompletion = (upperIdx > 0) ? this.completionRatios[upperIdx - 1] : 0;
            var baseDuration = (upperIdx > 0) ? this.durationRatios[upperIdx - 1] : 0;
            var interStepRatio = (currentDurationRatio - baseDuration) / this.incremetalDurationBetweenSteps[upperIdx];

            return baseCompletion + (interStepRatio * this.incremetalCompletionBetweenSteps[upperIdx]);
        };
        Pace.LINEAR = new Pace([1.0], [1.0]);
        return Pace;
    })();
    BABYLON.Pace = Pace;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.pace.js.map
