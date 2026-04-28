const LEVELS = [
    {
        id: 1,
        name: "温馨起航",
        description: "让小动物们熟悉一下云朵的感觉吧~",
        skyColor1: [0.53, 0.81, 0.92],
        skyColor2: [0.88, 0.97, 0.98],
        sunColor: [1.0, 0.9, 0.6],
        sunPosition: [0.8, 0.7],
        
        cloud: {
            startX: -4,
            startY: 0,
            scale: 1.5,
            mass: 5
        },
        
        platform: {
            x: 5,
            y: 0,
            width: 3,
            height: 1
        },
        
        animals: [
            { type: 'bunny', localX: -0.3, mass: 1, scale: 1 },
            { type: 'bunny', localX: 0.3, mass: 1, scale: 1 }
        ],
        
        wind: {
            baseWindStrength: 0,
            gustIntensity: 2,
            gustFrequency: 0.1
        },
        
        difficulty: {
            tiltResistance: 1.5,
            fallChanceMultiplier: 0.5,
            scoreMultiplier: 1.0
        }
    },
    
    {
        id: 2,
        name: "微风轻拂",
        description: "轻轻的风，轻轻的吹~",
        skyColor1: [0.4, 0.7, 0.9],
        skyColor2: [0.85, 0.95, 1.0],
        sunColor: [1.0, 0.95, 0.7],
        sunPosition: [0.7, 0.6],
        
        cloud: {
            startX: -4.5,
            startY: 0.2,
            scale: 1.6,
            mass: 5
        },
        
        platform: {
            x: 5.5,
            y: -0.2,
            width: 2.8,
            height: 0.9
        },
        
        animals: [
            { type: 'bunny', localX: -0.4, mass: 1, scale: 1 },
            { type: 'cat', localX: 0, mass: 1.2, scale: 1.1 },
            { type: 'bunny', localX: 0.4, mass: 1, scale: 1 }
        ],
        
        wind: {
            baseWindStrength: 0.5,
            gustIntensity: 3,
            gustFrequency: 0.2
        },
        
        difficulty: {
            tiltResistance: 1.2,
            fallChanceMultiplier: 0.7,
            scoreMultiplier: 1.2
        }
    },
    
    {
        id: 3,
        name: "彩云追月",
        description: "黄昏时分，天空染上了温暖的色彩",
        skyColor1: [0.9, 0.5, 0.3],
        skyColor2: [1.0, 0.85, 0.6],
        sunColor: [1.0, 0.6, 0.3],
        sunPosition: [0.6, 0.4],
        
        cloud: {
            startX: -5,
            startY: 0,
            scale: 1.4,
            mass: 4.5
        },
        
        platform: {
            x: 5,
            y: 0.3,
            width: 2.5,
            height: 0.8
        },
        
        animals: [
            { type: 'bird', localX: -0.35, mass: 0.8, scale: 0.9 },
            { type: 'bear', localX: 0, mass: 1.8, scale: 1.3 },
            { type: 'bird', localX: 0.35, mass: 0.8, scale: 0.9 }
        ],
        
        wind: {
            baseWindStrength: -0.5,
            gustIntensity: 4,
            gustFrequency: 0.25
        },
        
        difficulty: {
            tiltResistance: 1.0,
            fallChanceMultiplier: 0.9,
            scoreMultiplier: 1.5
        }
    },
    
    {
        id: 4,
        name: "风中舞蹈",
        description: "风变得调皮了，要小心哦！",
        skyColor1: [0.3, 0.6, 0.85],
        skyColor2: [0.7, 0.85, 0.95],
        sunColor: [1.0, 0.95, 0.8],
        sunPosition: [0.2, 0.65],
        
        cloud: {
            startX: -4,
            startY: 0,
            scale: 1.3,
            mass: 4
        },
        
        platform: {
            x: 5.2,
            y: -0.1,
            width: 2.2,
            height: 0.7
        },
        
        animals: [
            { type: 'bunny', localX: -0.5, mass: 1, scale: 1 },
            { type: 'cat', localX: -0.15, mass: 1.2, scale: 1.1 },
            { type: 'fox', localX: 0.2, mass: 1.5, scale: 1.2 },
            { type: 'bunny', localX: 0.5, mass: 1, scale: 1 }
        ],
        
        wind: {
            baseWindStrength: 0,
            gustIntensity: 5,
            gustFrequency: 0.4
        },
        
        difficulty: {
            tiltResistance: 0.8,
            fallChanceMultiplier: 1.0,
            scoreMultiplier: 1.8
        }
    },
    
    {
        id: 5,
        name: "星光旅程",
        description: "夜幕降临，星星开始闪烁",
        skyColor1: [0.15, 0.15, 0.4],
        skyColor2: [0.3, 0.25, 0.5],
        sunColor: [1.0, 1.0, 0.95],
        sunPosition: [0.1, 0.3],
        
        cloud: {
            startX: -4.5,
            startY: 0.1,
            scale: 1.5,
            mass: 5
        },
        
        platform: {
            x: 4.8,
            y: 0.2,
            width: 2.4,
            height: 0.8
        },
        
        animals: [
            { type: 'bear', localX: -0.4, mass: 1.8, scale: 1.3 },
            { type: 'bird', localX: 0, mass: 0.8, scale: 0.9 },
            { type: 'fox', localX: 0.4, mass: 1.5, scale: 1.2 }
        ],
        
        wind: {
            baseWindStrength: 1,
            gustIntensity: 5,
            gustFrequency: 0.35
        },
        
        difficulty: {
            tiltResistance: 0.7,
            fallChanceMultiplier: 1.1,
            scoreMultiplier: 2.0
        }
    },
    
    {
        id: 6,
        name: "疾风骤雨",
        description: "风越来越大了，一定要稳住！",
        skyColor1: [0.2, 0.3, 0.5],
        skyColor2: [0.4, 0.5, 0.65],
        sunColor: [0.8, 0.85, 0.9],
        sunPosition: [0.9, 0.8],
        
        cloud: {
            startX: -5,
            startY: 0,
            scale: 1.2,
            mass: 3.5
        },
        
        platform: {
            x: 5,
            y: -0.3,
            width: 2.0,
            height: 0.6
        },
        
        animals: [
            { type: 'cat', localX: -0.45, mass: 1.2, scale: 1.1 },
            { type: 'bear', localX: -0.1, mass: 1.8, scale: 1.3 },
            { type: 'fox', localX: 0.25, mass: 1.5, scale: 1.2 },
            { type: 'cat', localX: 0.5, mass: 1.2, scale: 1.1 }
        ],
        
        wind: {
            baseWindStrength: -1.5,
            gustIntensity: 6,
            gustFrequency: 0.45
        },
        
        difficulty: {
            tiltResistance: 0.6,
            fallChanceMultiplier: 1.3,
            scoreMultiplier: 2.5
        }
    },
    
    {
        id: 7,
        name: "彩虹之巅",
        description: "接近终点了，彩虹在前方等待！",
        skyColor1: [0.6, 0.5, 0.8],
        skyColor2: [0.9, 0.85, 0.95],
        sunColor: [1.0, 0.9, 0.95],
        sunPosition: [0.5, 0.5],
        
        cloud: {
            startX: -5.5,
            startY: 0,
            scale: 1.1,
            mass: 3
        },
        
        platform: {
            x: 5.5,
            y: 0,
            width: 1.8,
            height: 0.6
        },
        
        animals: [
            { type: 'bunny', localX: -0.5, mass: 1, scale: 1 },
            { type: 'bird', localX: -0.2, mass: 0.8, scale: 0.9 },
            { type: 'cat', localX: 0.1, mass: 1.2, scale: 1.1 },
            { type: 'fox', localX: 0.35, mass: 1.5, scale: 1.2 },
            { type: 'bear', localX: 0.6, mass: 1.8, scale: 1.3 }
        ],
        
        wind: {
            baseWindStrength: 0,
            gustIntensity: 7,
            gustFrequency: 0.5
        },
        
        difficulty: {
            tiltResistance: 0.5,
            fallChanceMultiplier: 1.5,
            scoreMultiplier: 3.0
        }
    },
    
    {
        id: 8,
        name: "终极挑战",
        description: "这是最后的考验，加油！",
        skyColor1: [0.9, 0.5, 0.6],
        skyColor2: [1.0, 0.8, 0.85],
        sunColor: [1.0, 0.95, 0.95],
        sunPosition: [0.3, 0.45],
        
        cloud: {
            startX: -6,
            startY: 0.2,
            scale: 1.0,
            mass: 2.5
        },
        
        platform: {
            x: 5.8,
            y: -0.1,
            width: 1.6,
            height: 0.5
        },
        
        animals: [
            { type: 'bear', localX: -0.4, mass: 1.8, scale: 1.3 },
            { type: 'fox', localX: -0.1, mass: 1.5, scale: 1.2 },
            { type: 'bear', localX: 0.2, mass: 1.8, scale: 1.3 },
            { type: 'fox', localX: 0.45, mass: 1.5, scale: 1.2 }
        ],
        
        wind: {
            baseWindStrength: 2,
            gustIntensity: 8,
            gustFrequency: 0.6
        },
        
        difficulty: {
            tiltResistance: 0.4,
            fallChanceMultiplier: 1.8,
            scoreMultiplier: 4.0
        }
    }
];

class LevelManager {
    constructor() {
        this.levels = LEVELS;
        this.currentLevelIndex = 0;
        this.unlockedLevels = this.loadUnlockedLevels();
        this.completedLevels = this.loadCompletedLevels();
        this.highScores = this.loadHighScores();
    }
    
    getTotalLevels() {
        return this.levels.length;
    }
    
    getCurrentLevel() {
        return this.levels[this.currentLevelIndex];
    }
    
    getLevel(index) {
        return this.levels[index];
    }
    
    setCurrentLevel(index) {
        if (index >= 0 && index < this.levels.length) {
            this.currentLevelIndex = index;
            return true;
        }
        return false;
    }
    
    nextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.currentLevelIndex++;
            return true;
        }
        return false;
    }
    
    isLevelUnlocked(index) {
        return this.unlockedLevels.includes(index);
    }
    
    unlockLevel(index) {
        if (!this.unlockedLevels.includes(index)) {
            this.unlockedLevels.push(index);
            this.saveUnlockedLevels();
        }
    }
    
    isLevelCompleted(index) {
        return this.completedLevels.includes(index);
    }
    
    completeLevel(index, score) {
        if (!this.completedLevels.includes(index)) {
            this.completedLevels.push(index);
            this.saveCompletedLevels();
        }
        
        if (!this.highScores[index] || score > this.highScores[index]) {
            this.highScores[index] = score;
            this.saveHighScores();
        }
        
        if (index + 1 < this.levels.length) {
            this.unlockLevel(index + 1);
        }
    }
    
    getHighScore(index) {
        return this.highScores[index] || 0;
    }
    
    loadUnlockedLevels() {
        try {
            const saved = localStorage.getItem('cloudFerryman_unlockedLevels');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading unlocked levels:', e);
        }
        return [0];
    }
    
    saveUnlockedLevels() {
        try {
            localStorage.setItem('cloudFerryman_unlockedLevels', JSON.stringify(this.unlockedLevels));
        } catch (e) {
            console.error('Error saving unlocked levels:', e);
        }
    }
    
    loadCompletedLevels() {
        try {
            const saved = localStorage.getItem('cloudFerryman_completedLevels');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading completed levels:', e);
        }
        return [];
    }
    
    saveCompletedLevels() {
        try {
            localStorage.setItem('cloudFerryman_completedLevels', JSON.stringify(this.completedLevels));
        } catch (e) {
            console.error('Error saving completed levels:', e);
        }
    }
    
    loadHighScores() {
        try {
            const saved = localStorage.getItem('cloudFerryman_highScores');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading high scores:', e);
        }
        return {};
    }
    
    saveHighScores() {
        try {
            localStorage.setItem('cloudFerryman_highScores', JSON.stringify(this.highScores));
        } catch (e) {
            console.error('Error saving high scores:', e);
        }
    }
    
    resetProgress() {
        this.unlockedLevels = [0];
        this.completedLevels = [];
        this.highScores = {};
        this.currentLevelIndex = 0;
        
        this.saveUnlockedLevels();
        this.saveCompletedLevels();
        this.saveHighScores();
    }
    
    createLevelData(levelIndex) {
        const level = this.getLevel(levelIndex);
        if (!level) return null;
        
        return {
            ...level,
            cloud: {
                ...level.cloud,
                x: level.cloud.startX,
                y: level.cloud.startY,
                velocityX: 0,
                angularVelocity: 0,
                tilt: 0,
                isDragging: false,
                targetX: level.cloud.startX
            },
            animals: level.animals.map((animal, index) => ({
                ...animal,
                id: index,
                x: level.cloud.startX + animal.localX,
                y: level.cloud.startY + level.cloud.scale * 0.5 + (animal.localY || 0),
                localX: animal.localX,
                localY: animal.localY || 0,
                velocityX: 0,
                velocityY: 0,
                falling: false,
                fallProgress: 0,
                fallDirection: 0,
                safe: false
            })),
            platform: {
                ...level.platform,
                isRainbow: true
            }
        };
    }
}

window.LevelManager = LevelManager;
window.LEVELS = LEVELS;