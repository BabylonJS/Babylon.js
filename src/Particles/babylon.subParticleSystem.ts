module BABYLON {
    export class SubParticleSystem extends ParticleSystem {
        public generationString: string;
        constructor(name: string, capacity: number, scene: Scene, private _generation: number, private _rootParticleSystem: ParticleSystem, customEffect: Nullable<Effect> = null, _isAnimationSheetEnabled: boolean = false, epsilon: number = 0.01) {
            super(name, capacity, scene, customEffect, _isAnimationSheetEnabled, epsilon);
            this.generationString = this._generation.toString();
        }

        public stoppedEmitting(overrideRemove = false): void {

            if (overrideRemove)
                this._rootParticleSystem.activeSubSystems.remove(this.name);
                
            if (this._rootParticleSystem.stockSubSystems.contains(this.generationString)) {
                (this._rootParticleSystem.stockSubSystems.get(this.generationString)!).push(this);
            }
            else {
                var subSysArray = new Array<SubParticleSystem>();
                subSysArray.push(this);
                this._rootParticleSystem.stockSubSystems.add(this.generationString, subSysArray);
            }
        }

        public emitFromParticle(particle: Particle): void {
            ParticleSystem.emitFromGeneration(this._rootParticleSystem, particle, this._generation + 1);
        }

        public recycleParticle(particle: Particle): void {
            ParticleSystem.recycleParticle(this._rootParticleSystem, this, particle);
        }

        public createParticle(): Particle {
            return ParticleSystem.createParticle(this._rootParticleSystem, this);
        }
    }
}