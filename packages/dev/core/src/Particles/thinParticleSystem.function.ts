import { Color4 } from "core/Maths/math.color.pure";
import { type ColorGradient, type FactorGradient, type IValueGradient } from "core/Misc/gradients";
import { type Particle } from "./particle";
import { type ThinParticleSystem } from "./thinParticleSystem";
import { Clamp, Lerp, RandomRange } from "core/Maths/math.scalar.functions";
import { TmpVectors, Vector3, Vector4 } from "core/Maths/math.vector.pure";

// Result of _GetCurrentGradientToRef, consumed synchronously by the caller below
// (avoids a callback closure per particle per frame).
let _GradCurrent: IValueGradient = null!;
let _GradNext: IValueGradient = null!;
let _GradScale = 0;

/**
 * Callback-free equivalent of GradientHelper.GetCurrentGradient; stores the result in _GradCurrent/_GradNext/_GradScale.
 * @internal
 */
export function _GetCurrentGradientToRef(ratio: number, gradients: IValueGradient[]): void {
    // Use last index if over
    if (gradients[0].gradient > ratio) {
        _GradCurrent = gradients[0];
        _GradNext = gradients[0];
        _GradScale = 1.0;
        return;
    }

    for (let gradientIndex = 0; gradientIndex < gradients.length - 1; gradientIndex++) {
        const currentGradient = gradients[gradientIndex];
        const nextGradient = gradients[gradientIndex + 1];

        if (ratio >= currentGradient.gradient && ratio <= nextGradient.gradient) {
            _GradCurrent = currentGradient;
            _GradNext = nextGradient;
            _GradScale = (ratio - currentGradient.gradient) / (nextGradient.gradient - currentGradient.gradient);
            return;
        }
    }

    // Use last index if over
    const lastIndex = gradients.length - 1;
    _GradCurrent = gradients[lastIndex];
    _GradNext = gradients[lastIndex];
    _GradScale = 1.0;
}

/** Color */

/** @internal */
export function _CreateColorData(particle: Particle, system: ThinParticleSystem) {
    const step = RandomRange(0, 1.0);

    Color4.LerpToRef(system.color1, system.color2, step, particle.color);
}

/** @internal */
export function _CreateColorDeadData(particle: Particle, system: ThinParticleSystem) {
    system.colorDead.subtractToRef(particle.color, system._colorDiff);
    system._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
}

/** @internal */
export function _CreateColorGradientsData(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentColorGradient = system._colorGradients![0];
    particle._properties.currentColorGradient.getColorToRef(particle.color);
    particle._properties.currentColor1.copyFrom(particle.color);

    if (system._colorGradients!.length > 1) {
        system._colorGradients![1].getColorToRef(particle._properties.currentColor2);
    } else {
        particle._properties.currentColor2.copyFrom(particle.color);
    }
}

/** @internal */
export function _ProcessColorGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._colorGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentColorGradient) {
        particle._properties.currentColor1.copyFrom(particle._properties.currentColor2);
        (<ColorGradient>nextGradient).getColorToRef(particle._properties.currentColor2);
        particle._properties.currentColorGradient = <ColorGradient>currentGradient;
    }
    Color4.LerpToRef(particle._properties.currentColor1, particle._properties.currentColor2, scale, particle.color);

    if (particle.color.a < 0) {
        particle.color.a = 0;
    }
}

/** @internal */
export function _ProcessColor(particle: Particle, system: ThinParticleSystem) {
    particle.colorStep.scaleToRef(system._scaledUpdateSpeed, system._scaledColorStep);
    particle.color.addInPlace(system._scaledColorStep);

    if (particle.color.a < 0) {
        particle.color.a = 0;
    }
}

/** Angular speed */

/** @internal */
export function _ProcessAngularSpeedGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._angularSpeedGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentAngularSpeedGradient) {
        particle._properties.currentAngularSpeed1 = particle._properties.currentAngularSpeed2;
        particle._properties.currentAngularSpeed2 = (<FactorGradient>nextGradient).getFactor();
        particle._properties.currentAngularSpeedGradient = <FactorGradient>currentGradient;
    }
    particle.angularSpeed = Lerp(particle._properties.currentAngularSpeed1, particle._properties.currentAngularSpeed2, scale);
}

/** @internal */
export function _ProcessAngularSpeed(particle: Particle, system: ThinParticleSystem) {
    particle.angle += particle.angularSpeed * system._scaledUpdateSpeed;
}

/** Velocity & direction */

/** @internal */
export function _CreateDirectionData(particle: Particle, system: ThinParticleSystem) {
    system.particleEmitterType.startDirectionFunction(system._emitterWorldMatrix, particle.direction, particle, system.isLocal, system._emitterInverseWorldMatrix);
}

/** @internal */
export function _CreateCustomDirectionData(particle: Particle, system: ThinParticleSystem) {
    system.startDirectionFunction!(system._emitterWorldMatrix, particle.direction, particle, system.isLocal);
}

/** @internal */
export function _CreateVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentVelocityGradient = system._velocityGradients![0];
    particle._properties.currentVelocity1 = particle._properties.currentVelocityGradient.getFactor();

    if (system._velocityGradients!.length > 1) {
        particle._properties.currentVelocity2 = system._velocityGradients![1].getFactor();
    } else {
        particle._properties.currentVelocity2 = particle._properties.currentVelocity1;
    }
}

/** @internal */
export function _CreateLimitVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentLimitVelocityGradient = system._limitVelocityGradients![0];
    particle._properties.currentLimitVelocity1 = particle._properties.currentLimitVelocityGradient.getFactor();

    if (system._limitVelocityGradients!.length > 1) {
        particle._properties.currentLimitVelocity2 = system._limitVelocityGradients![1].getFactor();
    } else {
        particle._properties.currentLimitVelocity2 = particle._properties.currentLimitVelocity1;
    }
}

/** @internal */
export function _ProcessVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._velocityGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentVelocityGradient) {
        particle._properties.currentVelocity1 = particle._properties.currentVelocity2;
        particle._properties.currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
        particle._properties.currentVelocityGradient = <FactorGradient>currentGradient;
    }
    particle._properties.directionScale *= Lerp(particle._properties.currentVelocity1, particle._properties.currentVelocity2, scale);
}

/** @internal */
export function _ProcessLimitVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._limitVelocityGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentLimitVelocityGradient) {
        particle._properties.currentLimitVelocity1 = particle._properties.currentLimitVelocity2;
        particle._properties.currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
        particle._properties.currentLimitVelocityGradient = <FactorGradient>currentGradient;
    }

    const limitVelocity = Lerp(particle._properties.currentLimitVelocity1, particle._properties.currentLimitVelocity2, scale);
    const currentVelocity = particle.direction.length();

    if (currentVelocity > limitVelocity) {
        particle.direction.scaleInPlace(system.limitVelocityDamping);
    }
}

/** @internal */
export function _ProcessDirection(particle: Particle) {
    particle.direction.scaleToRef(particle._properties.directionScale, particle._properties.scaledDirection);
}

/** Position */

/** @internal */
export function _CreatePositionData(particle: Particle, system: ThinParticleSystem) {
    system.particleEmitterType.startPositionFunction(system._emitterWorldMatrix, particle.position, particle, system.isLocal);
}

/** @internal */
export function _CreateCustomPositionData(particle: Particle, system: ThinParticleSystem) {
    system.startPositionFunction!(system._emitterWorldMatrix, particle.position, particle, system.isLocal);
}

/** @internal */
export function _CreateIsLocalData(particle: Particle, system: ThinParticleSystem) {
    if (!particle._properties.localPosition) {
        particle._properties.localPosition = particle.position.clone();
    } else {
        particle._properties.localPosition.copyFrom(particle.position);
    }
    Vector3.TransformCoordinatesToRef(particle._properties.localPosition, system._emitterWorldMatrix, particle.position);
}

/** @internal */
export function _ProcessPosition(particle: Particle, system: ThinParticleSystem) {
    if (system.isLocal && particle._properties.localPosition) {
        particle._properties.localPosition!.addInPlace(particle._properties.scaledDirection);
        Vector3.TransformCoordinatesToRef(particle._properties.localPosition!, system._emitterWorldMatrix, particle.position);
    } else {
        particle.position.addInPlace(particle._properties.scaledDirection);
    }
}

/** Drag */

/** @internal */
export function _CreateDragData(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentDragGradient = system._dragGradients![0];
    particle._properties.currentDrag1 = particle._properties.currentDragGradient.getFactor();

    if (system._dragGradients!.length > 1) {
        particle._properties.currentDrag2 = system._dragGradients![1].getFactor();
    } else {
        particle._properties.currentDrag2 = particle._properties.currentDrag1;
    }
}

/** @internal */
export function _ProcessDragGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._dragGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentDragGradient) {
        particle._properties.currentDrag1 = particle._properties.currentDrag2;
        particle._properties.currentDrag2 = (<FactorGradient>nextGradient).getFactor();
        particle._properties.currentDragGradient = <FactorGradient>currentGradient;
    }

    const drag = Lerp(particle._properties.currentDrag1, particle._properties.currentDrag2, scale);

    particle._properties.scaledDirection.scaleInPlace(1.0 - drag);
}

/** Noise */

/** @internal */
export function _CreateNoiseData(particle: Particle, _system: ThinParticleSystem) {
    if (particle._properties.randomNoiseCoordinates1 && particle._properties.randomNoiseCoordinates2) {
        particle._properties.randomNoiseCoordinates1.copyFromFloats(Math.random(), Math.random(), Math.random());
        particle._properties.randomNoiseCoordinates2.copyFromFloats(Math.random(), Math.random(), Math.random());
    } else {
        particle._properties.randomNoiseCoordinates1 = new Vector3(Math.random(), Math.random(), Math.random());
        particle._properties.randomNoiseCoordinates2 = new Vector3(Math.random(), Math.random(), Math.random());
    }
}

/** @internal */
export function _ProcessNoise(particle: Particle, system: ThinParticleSystem) {
    const noiseTextureData = system._noiseTextureData;
    const noiseTextureSize = system._noiseTextureSize;

    if (noiseTextureData && noiseTextureSize && particle._properties.randomNoiseCoordinates1 && particle._properties.randomNoiseCoordinates2) {
        const fetchedColorR = system._fetchR(
            particle._properties.randomNoiseCoordinates1.x,
            particle._properties.randomNoiseCoordinates1.y,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorG = system._fetchR(
            particle._properties.randomNoiseCoordinates1.z,
            particle._properties.randomNoiseCoordinates2.x,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorB = system._fetchR(
            particle._properties.randomNoiseCoordinates2.y,
            particle._properties.randomNoiseCoordinates2.z,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );

        const force = TmpVectors.Vector3[0];
        const scaledForce = TmpVectors.Vector3[1];

        force.copyFromFloats((2 * fetchedColorR - 1) * system.noiseStrength.x, (2 * fetchedColorG - 1) * system.noiseStrength.y, (2 * fetchedColorB - 1) * system.noiseStrength.z);

        force.scaleToRef(system._tempScaledUpdateSpeed, scaledForce);
        particle.direction.addInPlace(scaledForce);
    }
}

/** Gravity */

/** @internal */
export function _ProcessGravity(particle: Particle, system: ThinParticleSystem) {
    system.gravity.scaleToRef(system._tempScaledUpdateSpeed, system._scaledGravity);
    particle.direction.addInPlace(system._scaledGravity);
}

/** Size */

/** @internal */
export function _CreateSizeData(particle: Particle, system: ThinParticleSystem) {
    particle.size = RandomRange(system.minSize, system.maxSize);
    particle.scale.copyFromFloats(RandomRange(system.minScaleX, system.maxScaleX), RandomRange(system.minScaleY, system.maxScaleY));
}

/** @internal */
export function _CreateSizeGradientsData(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentSizeGradient = system._sizeGradients![0];
    particle._properties.currentSize1 = particle._properties.currentSizeGradient.getFactor();
    particle.size = particle._properties.currentSize1;

    if (system._sizeGradients!.length > 1) {
        particle._properties.currentSize2 = system._sizeGradients![1].getFactor();
    } else {
        particle._properties.currentSize2 = particle._properties.currentSize1;
    }

    particle.scale.copyFromFloats(RandomRange(system.minScaleX, system.maxScaleX), RandomRange(system.minScaleY, system.maxScaleY));
}

/** @internal */
export function _CreateStartSizeGradientsData(particle: Particle, system: ThinParticleSystem) {
    const ratio = system._actualFrame / system.targetStopDuration;
    _GetCurrentGradientToRef(ratio, system._startSizeGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== system._currentStartSizeGradient) {
        system._currentStartSize1 = system._currentStartSize2;
        system._currentStartSize2 = (<FactorGradient>nextGradient).getFactor();
        system._currentStartSizeGradient = <FactorGradient>currentGradient;
    }

    const value = Lerp(system._currentStartSize1, system._currentStartSize2, scale);
    particle.scale.scaleInPlace(value);
}

/** @internal */
export function _ProcessSizeGradients(particle: Particle, system: ThinParticleSystem) {
    _GetCurrentGradientToRef(system._ratio, system._sizeGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const scale = _GradScale;
    if (currentGradient !== particle._properties.currentSizeGradient) {
        particle._properties.currentSize1 = particle._properties.currentSize2;
        particle._properties.currentSize2 = (<FactorGradient>nextGradient).getFactor();
        particle._properties.currentSizeGradient = <FactorGradient>currentGradient;
    }
    particle.size = Lerp(particle._properties.currentSize1, particle._properties.currentSize2, scale);
}

/** Ramp */

/** @internal */
export function _CreateRampData(particle: Particle, _system: ThinParticleSystem) {
    if (particle.remapData) {
        // Reuse remap data of recycled particles instead of allocating a Vector4 per call
        particle.remapData.copyFromFloats(0, 1, 0, 1);
    } else {
        particle.remapData = new Vector4(0, 1, 0, 1);
    }
}

/** Remap */

/** @internal */
export function _ProcessRemapGradients(particle: Particle, system: ThinParticleSystem) {
    if (system._colorRemapGradients && system._colorRemapGradients.length > 0) {
        _GetCurrentGradientToRef(system._ratio, system._colorRemapGradients);
        const currentGradient = _GradCurrent;
        const nextGradient = _GradNext;
        const scale = _GradScale;
        const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
        const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

        particle.remapData.x = min;
        particle.remapData.y = max - min;
    }

    if (system._alphaRemapGradients && system._alphaRemapGradients.length > 0) {
        _GetCurrentGradientToRef(system._ratio, system._alphaRemapGradients);
        const currentGradient = _GradCurrent;
        const nextGradient = _GradNext;
        const scale = _GradScale;
        const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
        const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

        particle.remapData.z = min;
        particle.remapData.w = max - min;
    }
}

/** Life */

/** @internal */
export function _CreateLifeGradientsData(particle: Particle, system: ThinParticleSystem) {
    const ratio = Clamp(system._actualFrame / system.targetStopDuration);
    _GetCurrentGradientToRef(ratio, system._lifeTimeGradients!);
    const currentGradient = _GradCurrent;
    const nextGradient = _GradNext;
    const factorGradient1 = <FactorGradient>currentGradient;
    const factorGradient2 = <FactorGradient>nextGradient;
    const lifeTime1 = factorGradient1.getFactor();
    const lifeTime2 = factorGradient2.getFactor();
    const gradient = (ratio - factorGradient1.gradient) / (factorGradient2.gradient - factorGradient1.gradient);
    particle.lifeTime = Lerp(lifeTime1, lifeTime2, gradient);
    system._emitPower = RandomRange(system.minEmitPower, system.maxEmitPower);
}

/** @internal */
export function _CreateLifetimeData(particle: Particle, system: ThinParticleSystem) {
    particle.lifeTime = RandomRange(system.minLifeTime, system.maxLifeTime);
    system._emitPower = RandomRange(system.minEmitPower, system.maxEmitPower);
}

/** Emit power */

/** @internal */
export function _CreateEmitPowerData(particle: Particle, system: ThinParticleSystem) {
    if (system._emitPower === 0) {
        if (!particle._properties.initialDirection) {
            particle._properties.initialDirection = particle.direction.clone();
        } else {
            particle._properties.initialDirection.copyFrom(particle.direction);
        }
        particle.direction.set(0, 0, 0);
    } else {
        particle._properties.initialDirection = null;
        particle.direction.scaleInPlace(system._emitPower);
    }

    // Inherited Velocity
    particle.direction.addInPlace(system._inheritedVelocityOffset);
}

/** Angle */

/** @internal */
export function _CreateAngleData(particle: Particle, system: ThinParticleSystem) {
    particle.angularSpeed = RandomRange(system.minAngularSpeed, system.maxAngularSpeed);
    particle.angle = RandomRange(system.minInitialRotation, system.maxInitialRotation);
}

/** @internal */
export function _CreateAngleGradientsData(particle: Particle, system: ThinParticleSystem) {
    particle._properties.currentAngularSpeedGradient = system._angularSpeedGradients![0];
    particle.angularSpeed = particle._properties.currentAngularSpeedGradient.getFactor();
    particle._properties.currentAngularSpeed1 = particle.angularSpeed;

    if (system._angularSpeedGradients!.length > 1) {
        particle._properties.currentAngularSpeed2 = system._angularSpeedGradients![1].getFactor();
    } else {
        particle._properties.currentAngularSpeed2 = particle._properties.currentAngularSpeed1;
    }
    particle.angle = RandomRange(system.minInitialRotation, system.maxInitialRotation);
}

/** Sheet */

/** @internal */
export function _CreateSheetData(particle: Particle, system: ThinParticleSystem) {
    particle._properties.initialStartSpriteCellId = system.startSpriteCellID;
    particle._properties.initialEndSpriteCellId = system.endSpriteCellID;
    particle._properties.initialSpriteCellLoop = system.spriteCellLoop;
}
