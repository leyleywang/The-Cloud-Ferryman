class PhysicsEngine {
    constructor() {
        this.gravity = -9.8;
        this.friction = 0.98;
        this.angularFriction = 0.95;
        this.maxTilt = Math.PI / 3;
        this.tiltThreshold = Math.PI / 6;
    }
    
    updateCloud(cloud, animals, windForce, deltaTime) {
        if (cloud.isDragging) {
            cloud.velocityX = (cloud.targetX - cloud.x) * 5;
            cloud.x = cloud.targetX;
        } else {
            cloud.velocityX += windForce * deltaTime;
            cloud.velocityX *= this.friction;
            cloud.x += cloud.velocityX * deltaTime;
        }
        
        cloud.x = Math.max(-6, Math.min(6, cloud.x));
        
        const centerOfMass = this.calculateCenterOfMass(cloud, animals);
        
        const tiltTorque = -centerOfMass * 15;
        const windTorque = windForce * 8;
        
        cloud.angularVelocity += (tiltTorque + windTorque) * deltaTime;
        cloud.angularVelocity *= this.angularFriction;
        cloud.tilt += cloud.angularVelocity * deltaTime;
        
        cloud.tilt = Math.max(-this.maxTilt, Math.min(this.maxTilt, cloud.tilt));
        
        const stabilizingTorque = -cloud.tilt * 2;
        cloud.angularVelocity += stabilizingTorque * deltaTime;
        
        return centerOfMass;
    }
    
    calculateCenterOfMass(cloud, animals) {
        let totalMass = cloud.mass;
        let totalMoment = 0;
        
        for (const animal of animals) {
            if (animal.falling) continue;
            
            const relativeX = animal.x - cloud.x;
            const distanceFromCenter = relativeX / cloud.scale;
            
            totalMass += animal.mass;
            totalMoment += animal.mass * distanceFromCenter;
        }
        
        return totalMass > 0 ? totalMoment / totalMass : 0;
    }
    
    updateAnimals(animals, cloud, deltaTime) {
        for (const animal of animals) {
            if (animal.falling) {
                animal.fallProgress += deltaTime * 2;
                animal.velocityX *= 0.99;
                animal.x += animal.velocityX * deltaTime;
                continue;
            }
            
            const tiltEffect = Math.sin(cloud.tilt) * 3;
            animal.velocityX += tiltEffect * deltaTime;
            animal.velocityX *= 0.95;
            
            animal.localX += animal.velocityX * deltaTime;
            
            const maxLocalX = cloud.scale * 0.6;
            animal.localX = Math.max(-maxLocalX, Math.min(maxLocalX, animal.localX));
            
            animal.x = cloud.x + animal.localX;
            animal.y = cloud.y + cloud.scale * 0.5 + animal.localY;
            
            const localTilt = animal.localX / maxLocalX;
            const effectiveTilt = cloud.tilt + localTilt * 0.3;
            
            if (Math.abs(effectiveTilt) > this.tiltThreshold) {
                const tiltFactor = (Math.abs(effectiveTilt) - this.tiltThreshold) / 
                                   (this.maxTilt - this.tiltThreshold);
                
                if (Math.random() < tiltFactor * deltaTime * 5) {
                    this.makeAnimalFall(animal, cloud);
                }
            }
        }
    }
    
    makeAnimalFall(animal, cloud) {
        animal.falling = true;
        animal.fallProgress = 0;
        animal.velocityX = animal.velocityX + cloud.velocityX * 0.5 + 
                           Math.sign(cloud.tilt) * 2;
        animal.fallDirection = Math.sign(cloud.tilt) || (Math.random() > 0.5 ? 1 : -1);
    }
    
    checkAnimalFall(animal, cloud) {
        if (animal.falling) return false;
        
        const distanceFromCenter = animal.x - cloud.x;
        const maxDistance = cloud.scale * 0.7;
        
        if (Math.abs(distanceFromCenter) > maxDistance) {
            return true;
        }
        
        return false;
    }
    
    checkPlatformCollision(animal, platform) {
        const dx = animal.x - platform.x;
        const dy = animal.y - platform.y;
        
        const platformHalfWidth = platform.width / 2;
        const platformHalfHeight = platform.height / 2;
        const animalRadius = animal.scale * 0.15;
        
        return (Math.abs(dx) < platformHalfWidth + animalRadius &&
                Math.abs(dy) < platformHalfHeight + animalRadius);
    }
    
    checkWinCondition(animals, platform) {
        let safeCount = 0;
        let totalAlive = 0;
        
        for (const animal of animals) {
            if (animal.falling && animal.fallProgress > 1) continue;
            
            totalAlive++;
            
            if (this.checkPlatformCollision(animal, platform)) {
                safeCount++;
                animal.safe = true;
            }
        }
        
        return {
            allSafe: safeCount === animals.length && totalAlive === animals.length,
            safeCount,
            totalAlive
        };
    }
    
    checkLoseCondition(animals) {
        let fallenCount = 0;
        
        for (const animal of animals) {
            if (animal.falling && animal.fallProgress > 1) {
                fallenCount++;
            }
        }
        
        return {
            allFallen: fallenCount === animals.length,
            fallenCount
        };
    }
    
    getAnimalRelativePosition(animal, cloud) {
        return (animal.x - cloud.x) / cloud.scale;
    }
}

window.PhysicsEngine = PhysicsEngine;