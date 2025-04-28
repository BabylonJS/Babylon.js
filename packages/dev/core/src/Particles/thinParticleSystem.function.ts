import { Color4 } from "core/Maths/math.color";
import type { ColorGradient, FactorGradient } from "core/Misc/gradients";
import { GradientHelper } from "core/Misc/gradients";
import type { Particle } from "./particle";
import type { ThinParticleSystem } from "./thinParticleSystem";
import { Clamp, Lerp, RandomRange } from "core/Maths/math.scalar.functions";
import { TmpVectors, Vector3, Vector4 } from "core/Maths/math.vector";

/** Color */

/** @internal */
export function _CreateColorData(particle: Particle, system: ThinParticleSystem) {
    const step = RandomRange(0, 1.0);

    Color4.LerpToRef(system.color1, system.color2, step, particle.color);

    system.colorDead.subtractToRef(particle.color, system._colorDiff);
    system._colorDiff.scaleToRef(1.0 / particle.lifeTime, particle.colorStep);
}

/** @internal */
export function _CreateColorGradientsData(particle: Particle, system: ThinParticleSystem) {
    particle._currentColorGradient = system._colorGradients![0];
    particle._currentColorGradient.getColorToRef(particle.color);
    particle._currentColor1.copyFrom(particle.color);

    if (system._colorGradients!.length > 1) {
        system._colorGradients![1].getColorToRef(particle._currentColor2);
    } else {
        particle._currentColor2.copyFrom(particle.color);
    }
}

/** @internal */
export function _ProcessColorGradients(particle: Particle, system: ThinParticleSystem) {
    const colorGradients = system._colorGradients;
    GradientHelper.GetCurrentGradient(system._ratio, colorGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentColorGradient) {
            particle._currentColor1.copyFrom(particle._currentColor2);
            (<ColorGradient>nextGradient).getColorToRef(particle._currentColor2);
            particle._currentColorGradient = <ColorGradient>currentGradient;
        }
        Color4.LerpToRef(particle._currentColor1, particle._currentColor2, scale, particle.color);
    });
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
    GradientHelper.GetCurrentGradient(system._ratio, system._angularSpeedGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentAngularSpeedGradient) {
            particle._currentAngularSpeed1 = particle._currentAngularSpeed2;
            particle._currentAngularSpeed2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentAngularSpeedGradient = <FactorGradient>currentGradient;
        }
        particle.angularSpeed = Lerp(particle._currentAngularSpeed1, particle._currentAngularSpeed2, scale);
    });
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
    particle._currentVelocityGradient = system._velocityGradients![0];
    particle._currentVelocity1 = particle._currentVelocityGradient.getFactor();

    if (system._velocityGradients!.length > 1) {
        particle._currentVelocity2 = system._velocityGradients![1].getFactor();
    } else {
        particle._currentVelocity2 = particle._currentVelocity1;
    }
}

/** @internal */
export function _CreateLimitVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    particle._currentLimitVelocityGradient = system._limitVelocityGradients![0];
    particle._currentLimitVelocity1 = particle._currentLimitVelocityGradient.getFactor();

    if (system._limitVelocityGradients!.length > 1) {
        particle._currentLimitVelocity2 = system._limitVelocityGradients![1].getFactor();
    } else {
        particle._currentLimitVelocity2 = particle._currentLimitVelocity1;
    }
}

/** @internal */
export function _ProcessVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._velocityGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentVelocityGradient) {
            particle._currentVelocity1 = particle._currentVelocity2;
            particle._currentVelocity2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentVelocityGradient = <FactorGradient>currentGradient;
        }
        system._directionScale *= Lerp(particle._currentVelocity1, particle._currentVelocity2, scale);
    });
}

/** @internal */
export function _ProcessLimitVelocityGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._limitVelocityGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentLimitVelocityGradient) {
            particle._currentLimitVelocity1 = particle._currentLimitVelocity2;
            particle._currentLimitVelocity2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentLimitVelocityGradient = <FactorGradient>currentGradient;
        }

        const limitVelocity = Lerp(particle._currentLimitVelocity1, particle._currentLimitVelocity2, scale);
        const currentVelocity = particle.direction.length();

        if (currentVelocity > limitVelocity) {
            particle.direction.scaleInPlace(system.limitVelocityDamping);
        }
    });
}

/** @internal */
export function _ProcessDirection(particle: Particle, system: ThinParticleSystem) {
    particle.direction.scaleToRef(system._directionScale, system._scaledDirection);
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
    if (!particle._localPosition) {
        particle._localPosition = particle.position.clone();
    } else {
        particle._localPosition.copyFrom(particle.position);
    }
    Vector3.TransformCoordinatesToRef(particle._localPosition!, system._emitterWorldMatrix, particle.position);
}

/** @internal */
export function _ProcessPosition(particle: Particle, system: ThinParticleSystem) {
    if (system.isLocal && particle._localPosition) {
        particle._localPosition!.addInPlace(system._scaledDirection);
        Vector3.TransformCoordinatesToRef(particle._localPosition!, system._emitterWorldMatrix, particle.position);
    } else {
        particle.position.addInPlace(system._scaledDirection);
    }
}

/** Drag */

/** @internal */
export function _CreateDragData(particle: Particle, system: ThinParticleSystem) {
    particle._currentDragGradient = system._dragGradients![0];
    particle._currentDrag1 = particle._currentDragGradient.getFactor();

    if (system._dragGradients!.length > 1) {
        particle._currentDrag2 = system._dragGradients![1].getFactor();
    } else {
        particle._currentDrag2 = particle._currentDrag1;
    }
}

/** @internal */
export function _ProcessDragGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._dragGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentDragGradient) {
            particle._currentDrag1 = particle._currentDrag2;
            particle._currentDrag2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentDragGradient = <FactorGradient>currentGradient;
        }

        const drag = Lerp(particle._currentDrag1, particle._currentDrag2, scale);

        system._scaledDirection.scaleInPlace(1.0 - drag);
    });
}

/** Noise */

/** @internal */
export function _CreateNoiseData(particle: Particle, system: ThinParticleSystem) {
    if (particle._randomNoiseCoordinates1) {
        particle._randomNoiseCoordinates1.copyFromFloats(Math.random(), Math.random(), Math.random());
        particle._randomNoiseCoordinates2.copyFromFloats(Math.random(), Math.random(), Math.random());
    } else {
        particle._randomNoiseCoordinates1 = new Vector3(Math.random(), Math.random(), Math.random());
        particle._randomNoiseCoordinates2 = new Vector3(Math.random(), Math.random(), Math.random());
    }
}

/** @internal */
export function _ProcessNoise(particle: Particle, system: ThinParticleSystem) {
    const noiseTextureData = system._noiseTextureData;
    const noiseTextureSize = system._noiseTextureSize;

    if (noiseTextureData && noiseTextureSize && particle._randomNoiseCoordinates1) {
        const fetchedColorR = system._fetchR(
            particle._randomNoiseCoordinates1.x,
            particle._randomNoiseCoordinates1.y,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorG = system._fetchR(
            particle._randomNoiseCoordinates1.z,
            particle._randomNoiseCoordinates2.x,
            noiseTextureSize.width,
            noiseTextureSize.height,
            noiseTextureData
        );
        const fetchedColorB = system._fetchR(
            particle._randomNoiseCoordinates2.y,
            particle._randomNoiseCoordinates2.z,
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
    particle._currentSizeGradient = system._sizeGradients![0];
    particle._currentSize1 = particle._currentSizeGradient.getFactor();
    particle.size = particle._currentSize1;

    if (system._sizeGradients!.length > 1) {
        particle._currentSize2 = system._sizeGradients![1].getFactor();
    } else {
        particle._currentSize2 = particle._currentSize1;
    }

    particle.scale.copyFromFloats(RandomRange(system.minScaleX, system.maxScaleX), RandomRange(system.minScaleY, system.maxScaleY));
}

/** @internal */
export function _CreateStartSizeGradientsData(particle: Particle, system: ThinParticleSystem) {
    const ratio = system._actualFrame / system.targetStopDuration;
    GradientHelper.GetCurrentGradient(ratio, system._startSizeGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== system._currentStartSizeGradient) {
            system._currentStartSize1 = system._currentStartSize2;
            system._currentStartSize2 = (<FactorGradient>nextGradient).getFactor();
            system._currentStartSizeGradient = <FactorGradient>currentGradient;
        }

        const value = Lerp(system._currentStartSize1, system._currentStartSize2, scale);
        particle.scale.scaleInPlace(value);
    });
}

/** @internal */
export function _ProcessSizeGradients(particle: Particle, system: ThinParticleSystem) {
    GradientHelper.GetCurrentGradient(system._ratio, system._sizeGradients!, (currentGradient, nextGradient, scale) => {
        if (currentGradient !== particle._currentSizeGradient) {
            particle._currentSize1 = particle._currentSize2;
            particle._currentSize2 = (<FactorGradient>nextGradient).getFactor();
            particle._currentSizeGradient = <FactorGradient>currentGradient;
        }
        particle.size = Lerp(particle._currentSize1, particle._currentSize2, scale);
    });
}

/** Ramp */

/** @internal */
export function _CreateRampData(particle: Particle, system: ThinParticleSystem) {
    particle.remapData = new Vector4(0, 1, 0, 1);
}

/** Remap */

/** @internal */
export function _ProcessRemapGradients(particle: Particle, system: ThinParticleSystem) {
    if (system._colorRemapGradients && system._colorRemapGradients.length > 0) {
        GradientHelper.GetCurrentGradient(system._ratio, system._colorRemapGradients, (currentGradient, nextGradient, scale) => {
            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

            particle.remapData.x = min;
            particle.remapData.y = max - min;
        });
    }

    if (system._alphaRemapGradients && system._alphaRemapGradients.length > 0) {
        GradientHelper.GetCurrentGradient(system._ratio, system._alphaRemapGradients, (currentGradient, nextGradient, scale) => {
            const min = Lerp((<FactorGradient>currentGradient).factor1, (<FactorGradient>nextGradient).factor1, scale);
            const max = Lerp((<FactorGradient>currentGradient).factor2!, (<FactorGradient>nextGradient).factor2!, scale);

            particle.remapData.z = min;
            particle.remapData.w = max - min;
        });
    }
}

/** Life */

/** @internal */
export function _CreateLifeGradientsData(particle: Particle, system: ThinParticleSystem) {
    const ratio = Clamp(system._actualFrame / system.targetStopDuration);
    GradientHelper.GetCurrentGradient(ratio, system._lifeTimeGradients!, (currentGradient, nextGradient) => {
        const factorGradient1 = <FactorGradient>currentGradient;
        const factorGradient2 = <FactorGradient>nextGradient;
        const lifeTime1 = factorGradient1.getFactor();
        const lifeTime2 = factorGradient2.getFactor();
        const gradient = (ratio - factorGradient1.gradient) / (factorGradient2.gradient - factorGradient1.gradient);
        particle.lifeTime = Lerp(lifeTime1, lifeTime2, gradient);
    });
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
        if (!particle._initialDirection) {
            particle._initialDirection = particle.direction.clone();
        } else {
            particle._initialDirection.copyFrom(particle.direction);
        }
        particle.direction.set(0, 0, 0);
    } else {
        particle._initialDirection = null;
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
    particle._currentAngularSpeedGradient = system._angularSpeedGradients![0];
    particle.angularSpeed = particle._currentAngularSpeedGradient.getFactor();
    particle._currentAngularSpeed1 = particle.angularSpeed;

    if (system._angularSpeedGradients!.length > 1) {
        particle._currentAngularSpeed2 = system._angularSpeedGradients![1].getFactor();
    } else {
        particle._currentAngularSpeed2 = particle._currentAngularSpeed1;
    }
    particle.angle = RandomRange(system.minInitialRotation, system.maxInitialRotation);
}

/** Sheet */

/** @internal */
export function _CreateSheetData(particle: Particle, system: ThinParticleSystem) {
    particle._initialStartSpriteCellID = system.startSpriteCellID;
    particle._initialEndSpriteCellID = system.endSpriteCellID;
    particle._initialSpriteCellLoop = system.spriteCellLoop;
}
