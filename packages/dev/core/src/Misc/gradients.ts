import { Color3, Color4 } from '../Maths/math.color';

/** Interface used by value gradients (color, factor, ...) */
export interface IValueGradient {
    /**
     * Gets or sets the gradient value (between 0 and 1)
     */
    gradient: number;
}

/** Class used to store color4 gradient */
export class ColorGradient implements IValueGradient {
    /**
     * Creates a new color4 gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param color1 gets or sets first associated color
     * @param color2 gets or sets first second color
     */
    public constructor(
        /**
         * Gets or sets the gradient value (between 0 and 1)
         */
        public gradient: number,
        /**
         * Gets or sets first associated color
         */
        public color1: Color4,
        /**
         * Gets or sets second associated color
         */
        public color2?: Color4) {
    }

    /**
     * Will get a color picked randomly between color1 and color2.
     * If color2 is undefined then color1 will be used
     * @param result defines the target Color4 to store the result in
     */
    public getColorToRef(result: Color4) {
        if (!this.color2) {
            result.copyFrom(this.color1);
            return;
        }

        Color4.LerpToRef(this.color1, this.color2, Math.random(), result);
    }
}

/** Class used to store color 3 gradient */
export class Color3Gradient implements IValueGradient {
    /**
     * Creates a new color3 gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param color gets or sets associated color
     */
    public constructor(
        /**
         * Gets or sets the gradient value (between 0 and 1)
         */
        public gradient: number,
        /**
         * Gets or sets the associated color
         */
        public color: Color3) {
    }
}

/** Class used to store factor gradient */
export class FactorGradient implements IValueGradient {
    /**
     * Creates a new factor gradient
     * @param gradient gets or sets the gradient value (between 0 and 1)
     * @param factor1 gets or sets first associated factor
     * @param factor2 gets or sets second associated factor
     */
    public constructor(
        /**
         * Gets or sets the gradient value (between 0 and 1)
         */
        public gradient: number,
        /**
         * Gets or sets first associated factor
         */
        public factor1: number,
        /**
         * Gets or sets second associated factor
         */
        public factor2?: number) {
    }

    /**
     * Will get a number picked randomly between factor1 and factor2.
     * If factor2 is undefined then factor1 will be used
     * @returns the picked number
     */
    public getFactor(): number {
        if (this.factor2 === undefined || this.factor2 === this.factor1) {
            return this.factor1;
        }

        return this.factor1 + ((this.factor2 - this.factor1) * Math.random());
    }
}

/**
 * Helper used to simplify some generic gradient tasks
 */
export class GradientHelper {
    /**
     * Gets the current gradient from an array of IValueGradient
     * @param ratio defines the current ratio to get
     * @param gradients defines the array of IValueGradient
     * @param updateFunc defines the callback function used to get the final value from the selected gradients
     */
    public static GetCurrentGradient(ratio: number, gradients: IValueGradient[], updateFunc: (current: IValueGradient, next: IValueGradient, scale: number) => void) {

        // Use last index if over
        if (gradients[0].gradient > ratio) {
            updateFunc(gradients[0], gradients[0], 1.0);
            return;
        }

        for (var gradientIndex = 0; gradientIndex < gradients.length - 1; gradientIndex++) {
            let currentGradient = gradients[gradientIndex];
            let nextGradient = gradients[gradientIndex + 1];

            if (ratio >= currentGradient.gradient && ratio <= nextGradient.gradient) {
                let scale = (ratio - currentGradient.gradient) / (nextGradient.gradient - currentGradient.gradient);
                updateFunc(currentGradient, nextGradient, scale);
                return;
            }
        }

        // Use last index if over
        const lastIndex = gradients.length - 1;
        updateFunc(gradients[lastIndex], gradients[lastIndex], 1.0);
    }
}