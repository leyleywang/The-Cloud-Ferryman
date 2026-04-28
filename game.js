class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = null;
        this.physics = new PhysicsEngine();
        this.windSystem = new WindSystem();
        this.levelManager = new LevelManager();
        this.windIndicator = null;
        
        this.gameState = 'menu';
        this.currentLevelData = null;
        this.score = 0;
        this.totalScore = 0;
        this.animalsSafe = 0;
        this.animalsTotal = 0;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartCloudX = 0;
        
        this.lastTime = 0;
        this.animationFrameId = null;
        
        this.init();
    }
    
    init() {
        this.renderer = new WebGLRenderer(this.canvas);
        this.windIndicator = new WindIndicator(document.getElementById('wind-indicator'));
        
        this.setupEventListeners();
        this.setupUI();
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        if (this.renderer) {
            this.renderer.resize();
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }
    
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => this.showLevelSelect());
        document.getElementById('backToStart').addEventListener('click', () => this.showScreen('start-screen'));
        
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartFromPause').addEventListener('click', () => this.restartLevel());
        document.getElementById('toLevelSelect').addEventListener('click', () => {
            this.gameState = 'menu';
            this.showScreen('level-select');
        });
        
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        document.getElementById('replayLevelBtn').addEventListener('click', () => this.restartLevel());
        
        document.getElementById('retryBtn').addEventListener('click', () => this.restartLevel());
        document.getElementById('backToLevelSelect').addEventListener('click', () => {
            this.gameState = 'menu';
            this.showScreen('level-select');
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.totalScore = 0;
            this.showLevelSelect();
        });
        
        this.generateLevelButtons();
    }
    
    generateLevelButtons() {
        const levelGrid = document.getElementById('levelGrid');
        levelGrid.innerHTML = '';
        
        for (let i = 0; i < this.levelManager.getTotalLevels(); i++) {
            const level = this.levelManager.getLevel(i);
            const isUnlocked = this.levelManager.isLevelUnlocked(i);
            const isCompleted = this.levelManager.isLevelCompleted(i);
            
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            btn.textContent = level.id;
            
            if (isCompleted) {
                btn.classList.add('completed');
            } else if (!isUnlocked) {
                btn.classList.add('locked');
                btn.textContent = '🔒';
            }
            
            if (isUnlocked) {
                btn.addEventListener('click', () => this.startLevel(i));
            }
            
            levelGrid.appendChild(btn);
        }
    }
    
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }
    
    showLevelSelect() {
        this.generateLevelButtons();
        this.showScreen('level-select');
    }
    
    startLevel(levelIndex) {
        if (!this.levelManager.setCurrentLevel(levelIndex)) {
            return;
        }
        
        this.currentLevelData = this.levelManager.createLevelData(levelIndex);
        if (!this.currentLevelData) {
            return;
        }
        
        this.score = 0;
        this.animalsSafe = 0;
        this.animalsTotal = this.currentLevelData.animals.length;
        
        this.windSystem.configure(this.currentLevelData.wind);
        this.windSystem.reset();
        
        this.physics.maxTilt = Math.PI / 3 / this.currentLevelData.difficulty.tiltResistance;
        this.physics.tiltThreshold = Math.PI / 6 / this.currentLevelData.difficulty.tiltResistance;
        
        this.updateUI();
        
        this.showScreen('game-ui');
        this.gameState = 'playing';
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pause-screen');
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.showScreen('game-ui');
            this.gameState = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    restartLevel() {
        this.startLevel(this.levelManager.currentLevelIndex);
    }
    
    nextLevel() {
        if (this.levelManager.nextLevel()) {
            this.startLevel(this.levelManager.currentLevelIndex);
        } else {
            this.showCompleteScreen();
        }
    }
    
    showWinScreen() {
        this.gameState = 'won';
        
        const levelIndex = this.levelManager.currentLevelIndex;
        const levelScore = Math.floor(this.score * this.currentLevelData.difficulty.scoreMultiplier);
        this.totalScore += levelScore;
        
        this.levelManager.completeLevel(levelIndex, levelScore);
        
        document.getElementById('levelScore').textContent = levelScore;
        document.getElementById('totalScore').textContent = this.totalScore;
        
        const winMessage = document.getElementById('winMessage');
        if (this.animalsSafe === this.animalsTotal) {
            winMessage.textContent = '太棒了！所有小动物都安全到达了彩虹平台！';
        } else {
            winMessage.textContent = `${this.animalsSafe}/${this.animalsTotal} 只小动物安全到达，继续加油！`;
        }
        
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (levelIndex >= this.levelManager.getTotalLevels() - 1) {
            nextLevelBtn.style.display = 'none';
        } else {
            nextLevelBtn.style.display = 'inline-block';
        }
        
        this.showScreen('win-screen');
    }
    
    showLoseScreen() {
        this.gameState = 'lost';
        this.showScreen('lose-screen');
    }
    
    showCompleteScreen() {
        this.gameState = 'complete';
        document.getElementById('finalScore').textContent = this.totalScore;
        this.showScreen('complete-screen');
    }
    
    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 2 - 1;
        const y = 1 - (e.clientY - rect.top) / rect.height * 2;
        
        const cloudX = this.currentLevelData.cloud.x / 6;
        const cloudHitbox = this.currentLevelData.cloud.scale * 0.3;
        
        if (Math.abs(x - cloudX) < cloudHitbox && Math.abs(y - this.currentLevelData.cloud.y / 3) < cloudHitbox * 0.7) {
            this.isDragging = true;
            this.currentLevelData.cloud.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartCloudX = this.currentLevelData.cloud.x;
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging || this.gameState !== 'playing') return;
        
        const deltaX = (e.clientX - this.dragStartX) / this.canvas.clientWidth * 12;
        this.currentLevelData.cloud.targetX = Math.max(-6, Math.min(6, this.dragStartCloudX + deltaX));
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        if (this.currentLevelData && this.currentLevelData.cloud) {
            this.currentLevelData.cloud.isDragging = false;
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.handleMouseDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            this.handleMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }
    }
    
    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }
    
    updateUI() {
        document.getElementById('currentLevel').textContent = this.levelManager.currentLevelIndex + 1;
        
        const aliveAnimals = this.currentLevelData.animals.filter(a => !a.falling || a.fallProgress <= 1).length;
        document.getElementById('animalCount').textContent = `${this.animalsSafe}/${this.animalsTotal}`;
        
        const levelScore = Math.floor(this.score * this.currentLevelData.difficulty.scoreMultiplier);
        document.getElementById('score').textContent = levelScore;
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
    
    update(deltaTime) {
        const windForce = this.windSystem.update(deltaTime);
        this.windIndicator.update(this.windSystem);
        
        this.physics.updateCloud(
            this.currentLevelData.cloud,
            this.currentLevelData.animals,
            windForce,
            deltaTime
        );
        
        this.physics.updateAnimals(
            this.currentLevelData.animals,
            this.currentLevelData.cloud,
            deltaTime
        );
        
        this.checkGameConditions();
        this.updateUI();
    }
    
    checkGameConditions() {
        const winResult = this.physics.checkWinCondition(
            this.currentLevelData.animals,
            this.currentLevelData.platform
        );
        
        if (winResult.allSafe) {
            this.animalsSafe = winResult.safeCount;
            this.score += 100 * this.animalsSafe;
            this.showWinScreen();
            return;
        }
        
        this.animalsSafe = winResult.safeCount;
        
        const loseResult = this.physics.checkLoseCondition(this.currentLevelData.animals);
        
        if (loseResult.allFallen && this.animalsSafe === 0) {
            this.showLoseScreen();
            return;
        }
        
        for (const animal of this.currentLevelData.animals) {
            if (animal.falling && animal.fallProgress > 1 && !animal.penaltyApplied) {
                animal.penaltyApplied = true;
                this.score = Math.max(0, this.score - 50);
            }
        }
        
        const platformReached = this.currentLevelData.animals.some(animal => 
            !animal.falling && this.physics.checkPlatformCollision(animal, this.currentLevelData.platform)
        );
        
        if (platformReached && !this.scoreBonusApplied) {
            const allOnPlatform = this.currentLevelData.animals.every(animal => 
                animal.falling || animal.safe || this.physics.checkPlatformCollision(animal, this.currentLevelData.platform)
            );
            
            if (allOnPlatform) {
                this.scoreBonusApplied = true;
                this.score += 200;
            }
        }
    }
    
    render() {
        const time = performance.now() / 1000;
        
        this.renderer.clear(0.53, 0.81, 0.92, 1.0);
        
        this.renderer.drawSky(time, this.currentLevelData);
        
        this.renderRainbowPlatform();
        
        this.renderCloudWithShadow();
        
        this.renderAnimals();
        
        this.renderWindParticles(time);
    }
    
    renderRainbowPlatform() {
        const platform = this.currentLevelData.platform;
        
        this.renderer.drawRainbow(
            platform.x,
            platform.y + platform.height / 2,
            platform.width,
            platform.height * 1.5
        );
        
        this.renderer.drawCube(
            platform.x,
            platform.y - platform.height / 4,
            0,
            platform.width / 2,
            platform.height / 4,
            0.3,
            0,
            [1.0, 1.0, 1.0, 0.9]
        );
    }
    
    renderCloudWithShadow() {
        const cloud = this.currentLevelData.cloud;
        
        this.renderer.drawCloud(
            cloud.x + 0.2,
            cloud.y - 0.3,
            cloud.tilt * 0.5,
            cloud.scale * 0.9,
            [0.3, 0.3, 0.35, 0.3]
        );
        
        const cloudColor = this.getCloudColor();
        this.renderer.drawCloud(
            cloud.x,
            cloud.y,
            cloud.tilt,
            cloud.scale,
            cloudColor
        );
    }
    
    getCloudColor() {
        const tiltIntensity = Math.abs(this.currentLevelData.cloud.tilt) / (Math.PI / 3);
        
        if (tiltIntensity > 0.7) {
            return [1.0, 0.8, 0.8, 1.0];
        } else if (tiltIntensity > 0.4) {
            return [1.0, 0.95, 0.9, 1.0];
        }
        
        return [1.0, 1.0, 1.0, 1.0];
    }
    
    renderAnimals() {
        for (const animal of this.currentLevelData.animals) {
            if (animal.falling && animal.fallProgress > 1) continue;
            
            if (animal.safe) {
                const platform = this.currentLevelData.platform;
                this.renderer.drawAnimal({
                    ...animal,
                    x: platform.x + (animal.localX || 0) * 0.5,
                    y: platform.y + platform.height / 2 + 0.2
                });
            } else {
                this.renderer.drawAnimal(animal);
            }
        }
    }
    
    renderWindParticles(time) {
        if (!this.windSystem.isWindActive()) return;
        
        const windStrength = this.windSystem.getWindStrength();
        const windDirection = this.windSystem.getWindDirection();
        
        const particleCount = Math.floor(windStrength * 2);
        
        for (let i = 0; i < particleCount; i++) {
            const particleX = (Math.sin(time * 2 + i * 1.5) * 0.5) * windDirection + 
                             (Math.random() - 0.5) * 8;
            const particleY = Math.sin(time * 1.5 + i * 2.3) * 2 + 
                             (Math.random() - 0.5) * 4;
            
            this.renderer.drawSphere(
                particleX,
                particleY,
                -0.5,
                0.05 + Math.random() * 0.05,
                [1.0, 1.0, 1.0, 0.3 + Math.random() * 0.2]
            );
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});