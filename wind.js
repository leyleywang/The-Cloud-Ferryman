class WindSystem {
    constructor() {
        this.currentWind = 0;
        this.targetWind = 0;
        this.windVelocity = 0;
        this.isGusting = false;
        this.gustTimer = 0;
        this.gustDuration = 0;
        this.nextGustTime = 3;
        this.timeSinceLastGust = 0;
        
        this.baseWindStrength = 0;
        this.gustIntensity = 5;
        this.gustFrequency = 0.3;
        
        this.turbulence = 0;
        this.turbulenceTime = 0;
    }
    
    configure(config) {
        this.baseWindStrength = config.baseWindStrength || 0;
        this.gustIntensity = config.gustIntensity || 5;
        this.gustFrequency = config.gustFrequency || 0.3;
        this.nextGustTime = this.calculateNextGustTime();
    }
    
    calculateNextGustTime() {
        const baseTime = 2 / (this.gustFrequency + 0.1);
        const variation = Math.random() * baseTime;
        return baseTime + variation;
    }
    
    update(deltaTime) {
        this.turbulenceTime += deltaTime;
        this.turbulence = Math.sin(this.turbulenceTime * 3) * 0.5 + 
                          Math.sin(this.turbulenceTime * 7) * 0.3;
        
        if (this.isGusting) {
            this.gustTimer += deltaTime;
            
            const progress = this.gustTimer / this.gustDuration;
            let gustFactor = 0;
            
            if (progress < 0.2) {
                gustFactor = progress / 0.2;
            } else if (progress < 0.8) {
                gustFactor = 1;
            } else {
                gustFactor = (1 - progress) / 0.2;
            }
            
            this.targetWind = this.gustDirection * this.gustIntensity * gustFactor;
            
            if (this.gustTimer >= this.gustDuration) {
                this.isGusting = false;
                this.gustTimer = 0;
                this.targetWind = this.baseWindStrength;
                this.nextGustTime = this.calculateNextGustTime();
                this.timeSinceLastGust = 0;
            }
        } else {
            this.timeSinceLastGust += deltaTime;
            
            if (this.timeSinceLastGust >= this.nextGustTime) {
                this.triggerGust();
            }
        }
        
        const windDiff = this.targetWind - this.currentWind;
        const acceleration = windDiff * 2;
        this.windVelocity += acceleration * deltaTime;
        this.windVelocity *= 0.9;
        this.currentWind += this.windVelocity * deltaTime;
        
        return this.currentWind + this.turbulence * 0.5;
    }
    
    triggerGust() {
        this.isGusting = true;
        this.gustTimer = 0;
        
        this.gustDirection = Math.random() > 0.5 ? 1 : -1;
        
        this.gustDuration = 1 + Math.random() * 2;
        
        this.gustIntensity = 3 + Math.random() * 4;
    }
    
    getWindForce() {
        return this.currentWind + this.turbulence * 0.5;
    }
    
    isWindActive() {
        return this.isGusting || Math.abs(this.currentWind) > 0.5;
    }
    
    getWindDirection() {
        if (Math.abs(this.currentWind) < 0.1) return 0;
        return Math.sign(this.currentWind);
    }
    
    getWindStrength() {
        return Math.abs(this.currentWind);
    }
    
    reset() {
        this.currentWind = 0;
        this.targetWind = 0;
        this.windVelocity = 0;
        this.isGusting = false;
        this.gustTimer = 0;
        this.gustDuration = 0;
        this.nextGustTime = this.calculateNextGustTime();
        this.timeSinceLastGust = 0;
        this.turbulence = 0;
        this.turbulenceTime = 0;
    }
}

class WindIndicator {
    constructor(element) {
        this.element = element;
        this.arrow = element.querySelector('.wind-arrow');
        this.isVisible = false;
        this.currentDirection = 0;
    }
    
    show(direction, strength) {
        if (!this.isVisible) {
            this.element.classList.add('active');
            this.isVisible = true;
        }
        
        if (direction !== this.currentDirection) {
            this.currentDirection = direction;
            this.arrow.style.transform = direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
        }
        
        const intensity = Math.min(strength / 8, 1);
        this.element.style.opacity = 0.3 + intensity * 0.7;
    }
    
    hide() {
        if (this.isVisible) {
            this.element.classList.remove('active');
            this.isVisible = false;
        }
    }
    
    update(windSystem) {
        if (windSystem.isWindActive()) {
            this.show(windSystem.getWindDirection(), windSystem.getWindStrength());
        } else {
            this.hide();
        }
    }
}

window.WindSystem = WindSystem;
window.WindIndicator = WindIndicator;