// Game Constants
const GAME_SPEED = 5;
const ENEMY_CARS = [
    'assets/e_car1.png',
    'assets/e_car2.png',
    'assets/e_car3.png'
];
const POWER_UPS = [
    { type: 'shield', image: 'assets/shield.png', duration: 5000 },
    { type: 'speed', image: 'assets/speed.png', duration: 3000 },
    { type: 'life', image: 'assets/life.png' }
];

// Audio Constants
const AUDIO = {
    bgm: 'assets/audio/bgm.mp3',
    collision: 'assets/audio/collision.wav',
    powerup: 'assets/audio/powerup.wav',
    gameOver: 'assets/audio/gameover.wav',
    buttonClick: 'assets/audio/button.wav'
};

// Leaderboard Data
const leaderboardData = [
    { name: 'SpeedDemon', baseScore: 12450, date: '2023-11-15' },
    { name: 'RoadWarrior', baseScore: 10875, date: '2023-11-14' },
    { name: 'TharMaster', baseScore: 9320, date: '2023-11-13' },
    { name: 'TrafficNinja', baseScore: 8765, date: '2023-11-12' },
    { name: 'DriftKing', baseScore: 7890, date: '2023-11-11' },
    { name: 'NightRider', baseScore: 6540, date: '2023-11-10' },
    { name: 'HighwayHero', baseScore: 5980, date: '2023-11-09' },
    { name: 'ThrottleQueen', baseScore: 5210, date: '2023-11-08' },
    { name: 'RoadRunner', baseScore: 4875, date: '2023-11-07' },
    { name: 'TharChampion', baseScore: 4320, date: '2023-11-06' }
];

// Game Variables
let gameLoop;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = GAME_SPEED;
let isGameRunning = false;
let isPaused = false;
let lives = 3;
let isInvincible = false;
let activePowerUps = [];
let lastSpawnTime = 0;
let lastPowerUpTime = 0;
let enemyCars = new Set(); // Track active enemy cars
let powerUps = new Set(); // Track active power-ups
let leaderboardInterval;
let bgMusic;
let soundEnabled = true;

// DOM Elements
const gameContainer = document.getElementById('gameContainer');
const playerCar = document.getElementById('playerCar');
const road = document.getElementById('road');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const livesDisplay = document.getElementById('livesDisplay');
const instructionsButton = document.getElementById('instructionsButton');
const instructionsModal = document.getElementById('instructionsModal');
const closeInstructionsButton = document.getElementById('closeInstructionsButton');
const pauseButton = document.getElementById('pauseButton');
const pauseScreen = document.getElementById('pauseScreen');
const resumeButton = document.getElementById('resumeButton');
const navHowToPlay = document.getElementById('navHowToPlay');
const navLeaderboard = document.getElementById('navLeaderboard');
const navPlayNow = document.getElementById('navPlayNow');
const leaderboardModal = document.getElementById('leaderboardModal');
const closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
const instructionsButton2 = document.getElementById('instructionsButton2');
const leaderboardTableBody = document.querySelector('#leaderboardModal table tbody');

// Audio Functions
function initAudio() {
    // Create background music
    bgMusic = new Audio(AUDIO.bgm);
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    
    // Preload sound effects
    const collisionSound = new Audio(AUDIO.collision);
    const powerupSound = new Audio(AUDIO.powerup);
    const gameOverSound = new Audio(AUDIO.gameOver);
    const buttonSound = new Audio(AUDIO.buttonClick);
    
    // Add sound toggle button to navbar
    const soundToggle = document.createElement('button');
    soundToggle.id = 'soundToggle';
    soundToggle.className = 'text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium';
    soundToggle.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
    soundToggle.title = 'Toggle Sound';
    
    // Insert before the Play Now button
    const navbarButtons = document.querySelector('.flex.items-center.space-x-4');
    navbarButtons.insertBefore(soundToggle, navPlayNow);
    
    // Add event listener for sound toggle
    soundToggle.addEventListener('click', toggleSound);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundToggle = document.getElementById('soundToggle');
    
    if (soundEnabled) {
        soundToggle.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        if (isGameRunning && !isPaused) {
            bgMusic.play();
        }
    } else {
        soundToggle.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        bgMusic.pause();
    }
}

function playSound(soundFile) {
    if (!soundEnabled) return;
    
    const sound = new Audio(soundFile);
    sound.volume = 0.7;
    sound.play();
}

// Event Listeners
startButton.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    startGame();
});
restartButton.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    startGame();
});
navPlayNow.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    startGame();
});
document.addEventListener('mousemove', movePlayerCar);
instructionsButton.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    showInstructions();
});
instructionsButton2.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    showInstructions();
});
closeInstructionsButton.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    hideInstructions();
});
pauseButton.addEventListener('click', togglePause);
resumeButton.addEventListener('click', togglePause);
document.addEventListener('keydown', handleKeyPress);
navHowToPlay.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    showInstructions();
});
navLeaderboard.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    showLeaderboard();
});
closeLeaderboardButton.addEventListener('click', () => {
    playSound(AUDIO.buttonClick);
    hideLeaderboard();
});

// Initialize high score display
highScoreElement.textContent = highScore;

// Initialize leaderboard
initializeLeaderboard();

// Initialize audio
initAudio();

// Game Functions
function startGame() {
    // Reset game state
    score = 0;
    gameSpeed = GAME_SPEED;
    lives = 3;
    isInvincible = false;
    isPaused = false;
    activePowerUps = [];
    enemyCars.clear();
    powerUps.clear();
    
    // Update UI
    scoreElement.textContent = '0';
    updateLivesDisplay();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    gameContainer.classList.remove('paused');
    isGameRunning = true;
    
    // Clear existing elements
    document.querySelectorAll('.enemy-car, .power-up').forEach(el => el.remove());
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(updateGame, 1000 / 60);
    
    // Start spawning
    lastSpawnTime = Date.now();
    lastPowerUpTime = Date.now();
    spawnEnemyCar();
    spawnPowerUp();
    
    // Play background music
    if (soundEnabled) {
        bgMusic.currentTime = 0;
        bgMusic.play();
    }
}

function movePlayerCar(e) {
    if (!isGameRunning) return;
    
    const containerRect = gameContainer.getBoundingClientRect();
    const carRect = playerCar.getBoundingClientRect();
    
    // Calculate new position
    let newX = e.clientX - containerRect.left - carRect.width / 2;
    
    // Keep car within bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - carRect.width));
    
    // Update car position
    playerCar.style.left = `${newX}px`;
}

function spawnEnemyCar() {
    if (!isGameRunning) return;
    
    const now = Date.now();
    const minSpawnDelay = Math.max(500, 1500 - score * 5);
    
    if (now - lastSpawnTime < minSpawnDelay) {
        setTimeout(spawnEnemyCar, minSpawnDelay - (now - lastSpawnTime));
        return;
    }
    
    lastSpawnTime = now;
    
    // Check for overlapping cars
    const containerWidth = gameContainer.clientWidth;
    const carWidth = 96;
    let validPosition = false;
    let attempts = 0;
    let randomX;
    
    while (!validPosition && attempts < 10) {
        randomX = Math.random() * (containerWidth - carWidth);
        validPosition = true;
        
        // Check against existing cars
        for (const car of enemyCars) {
            const carLeft = parseFloat(car.style.left);
            if (Math.abs(carLeft - randomX) < carWidth * 1.2) {
                validPosition = false;
                break;
            }
        }
        
        attempts++;
    }
    
    if (!validPosition) {
        // If we couldn't find a good position, try again later
        setTimeout(spawnEnemyCar, 500);
        return;
    }
    
    const enemyCar = document.createElement('div');
    enemyCar.className = 'enemy-car';
    
    // Random car image
    const randomCar = ENEMY_CARS[Math.floor(Math.random() * ENEMY_CARS.length)];
    enemyCar.innerHTML = `<img src="${randomCar}" alt="Enemy Car" class="w-full h-full object-contain">`;
    
    enemyCar.style.left = `${randomX}px`;
    enemyCar.style.top = '-96px';
    
    gameContainer.appendChild(enemyCar);
    enemyCars.add(enemyCar);
    
    // Schedule next spawn
    setTimeout(spawnEnemyCar, minSpawnDelay);
}

function spawnPowerUp() {
    if (!isGameRunning) return;
    
    const now = Date.now();
    const minPowerUpDelay = 10000; // 10 seconds between power-ups
    
    if (now - lastPowerUpTime < minPowerUpDelay) {
        setTimeout(spawnPowerUp, minPowerUpDelay - (now - lastPowerUpTime));
        return;
    }
    
    lastPowerUpTime = now;
    
    const powerUp = document.createElement('div');
    powerUp.className = 'power-up';
    
    // Random power-up
    const randomPowerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
    powerUp.innerHTML = `<img src="${randomPowerUp.image}" alt="${randomPowerUp.type}" class="w-full h-full object-contain">`;
    powerUp.dataset.type = randomPowerUp.type;
    
    // Random horizontal position
    const containerWidth = gameContainer.clientWidth;
    const powerUpWidth = 48;
    const randomX = Math.random() * (containerWidth - powerUpWidth);
    powerUp.style.left = `${randomX}px`;
    powerUp.style.top = '-48px';
    
    gameContainer.appendChild(powerUp);
    powerUps.add(powerUp);
    
    // Schedule next power-up
    setTimeout(spawnPowerUp, minPowerUpDelay);
}

function updateGame() {
    if (!isGameRunning || isPaused) return;
    
    // Move enemy cars
    for (const car of enemyCars) {
        const currentTop = parseFloat(car.style.top);
        car.style.top = `${currentTop + gameSpeed}px`;
        
        // Check if car is out of bounds
        if (currentTop > gameContainer.clientHeight) {
            car.remove();
            enemyCars.delete(car);
            score += 10;
            scoreElement.textContent = score;
            
            // Increase game speed
            if (score % 100 === 0) {
                gameSpeed += 0.5;
            }
        }
        
        // Check for collision
        if (!isInvincible && checkCollision(car)) {
            handleCollision();
        }
    }
    
    // Move power-ups
    for (const powerUp of powerUps) {
        const currentTop = parseFloat(powerUp.style.top);
        powerUp.style.top = `${currentTop + gameSpeed * 0.8}px`;
        
        // Check if power-up is out of bounds
        if (currentTop > gameContainer.clientHeight) {
            powerUp.remove();
            powerUps.delete(powerUp);
        }
        
        // Check for collection
        if (checkPowerUpCollection(powerUp)) {
            collectPowerUp(powerUp);
        }
    }
    
    // Update active power-ups
    updateActivePowerUps();
}

function checkCollision(enemyCar) {
    const playerRect = playerCar.getBoundingClientRect();
    const enemyRect = enemyCar.getBoundingClientRect();
    
    // Calculate the center points of both cars
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top + playerRect.height / 2;
    const enemyCenterX = enemyRect.left + enemyRect.width / 2;
    const enemyCenterY = enemyRect.top + enemyRect.height / 2;
    
    // Calculate the distance between the centers
    const distanceX = Math.abs(playerCenterX - enemyCenterX);
    const distanceY = Math.abs(playerCenterY - enemyCenterY);
    
    // Define collision thresholds (smaller than the actual car size)
    const collisionThresholdX = (playerRect.width + enemyRect.width) / 3;
    const collisionThresholdY = (playerRect.height + enemyRect.height) / 3;
    
    // Check if the distance is less than the threshold
    return distanceX < collisionThresholdX && distanceY < collisionThresholdY;
}

function checkPowerUpCollection(powerUp) {
    const playerRect = playerCar.getBoundingClientRect();
    const powerUpRect = powerUp.getBoundingClientRect();
    
    // Calculate the center points
    const playerCenterX = playerRect.left + playerRect.width / 2;
    const playerCenterY = playerRect.top + playerRect.height / 2;
    const powerUpCenterX = powerUpRect.left + powerUpRect.width / 2;
    const powerUpCenterY = powerUpRect.top + powerUpRect.height / 2;
    
    // Calculate the distance between the centers
    const distanceX = Math.abs(playerCenterX - powerUpCenterX);
    const distanceY = Math.abs(playerCenterY - powerUpCenterY);
    
    // Define collection threshold (slightly larger than power-up for easier collection)
    const collectionThresholdX = (playerRect.width + powerUpRect.width) / 2.5;
    const collectionThresholdY = (playerRect.height + powerUpRect.height) / 2.5;
    
    // Check if the distance is less than the threshold
    return distanceX < collectionThresholdX && distanceY < collectionThresholdY;
}

function collectPowerUp(powerUp) {
    const type = powerUp.dataset.type;
    
    // Remove the power-up
    powerUp.remove();
    powerUps.delete(powerUp);
    
    // Play power-up sound
    playSound(AUDIO.powerup);
    
    // Apply power-up effect
    switch (type) {
        case 'shield':
            activateShield();
            break;
        case 'speed':
            activateSpeedBoost();
            break;
        case 'life':
            addLife();
            break;
    }
}

function activateShield() {
    isInvincible = true;
    playerCar.classList.add('shield-active');
    
    // Add to active power-ups
    activePowerUps.push({
        type: 'shield',
        endTime: Date.now() + 5000
    });
    
    // Remove shield after duration
    setTimeout(() => {
        isInvincible = false;
        playerCar.classList.remove('shield-active');
    }, 5000);
}

function activateSpeedBoost() {
    const originalSpeed = gameSpeed;
    gameSpeed *= 1.5;
    
    // Add to active power-ups
    activePowerUps.push({
        type: 'speed',
        endTime: Date.now() + 3000
    });
    
    // Restore original speed after duration
    setTimeout(() => {
        gameSpeed = originalSpeed;
    }, 3000);
}

function addLife() {
    if (lives < 5) {
        lives++;
        updateLivesDisplay();
    }
}

function updateActivePowerUps() {
    const now = Date.now();
    
    // Remove expired power-ups
    activePowerUps = activePowerUps.filter(powerUp => {
        if (powerUp.endTime && now > powerUp.endTime) {
            if (powerUp.type === 'shield') {
                playerCar.classList.remove('shield-active');
            }
            return false;
        }
        return true;
    });
}

function handleCollision() {
    if (isInvincible) return;
    
    lives--;
    updateLivesDisplay();
    
    // Play collision sound
    playSound(AUDIO.collision);
    
    // Flash the player car
    playerCar.classList.add('flash');
    setTimeout(() => {
        playerCar.classList.remove('flash');
    }, 500);
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Brief invincibility after hit
        isInvincible = true;
        setTimeout(() => {
            isInvincible = false;
        }, 1500);
    }
}

function updateLivesDisplay() {
    livesDisplay.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const lifeIcon = document.createElement('span');
        lifeIcon.className = 'text-red-500 text-2xl mx-1';
        lifeIcon.innerHTML = '❤️';
        livesDisplay.appendChild(lifeIcon);
    }
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    
    // Stop background music and play game over sound
    bgMusic.pause();
    playSound(AUDIO.gameOver);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    // Show game over screen
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

function initializeLeaderboard() {
    updateLeaderboardDisplay();
}

function updateLeaderboardDisplay() {
    if (!leaderboardTableBody) return;
    
    // Clear existing rows
    leaderboardTableBody.innerHTML = '';
    
    // Sort leaderboard data by score (descending)
    const sortedData = [...leaderboardData].sort((a, b) => b.currentScore - a.currentScore);
    
    // Create rows for each player
    sortedData.forEach((player, index) => {
        const row = document.createElement('tr');
        if (index < sortedData.length - 1) {
            row.classList.add('border-b', 'border-gray-600');
        }
        
        // Add random fluctuation to score (between -50 and +50)
        const fluctuation = Math.floor(Math.random() * 101) - 50;
        player.currentScore = player.baseScore + fluctuation;
        
        row.innerHTML = `
            <td class="py-3 px-4">${index + 1}</td>
            <td class="py-3 px-4">${player.name}</td>
            <td class="py-3 px-4">${player.currentScore.toLocaleString()}</td>
            <td class="py-3 px-4">${player.date}</td>
        `;
        
        leaderboardTableBody.appendChild(row);
    });
}

function showLeaderboard() {
    leaderboardModal.classList.remove('hidden');
    
    // Start updating leaderboard values
    updateLeaderboardDisplay();
    leaderboardInterval = setInterval(updateLeaderboardDisplay, 2000); // Update every 2 seconds
}

function hideLeaderboard() {
    leaderboardModal.classList.add('hidden');
    
    // Stop updating leaderboard values
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
    }
}

function showInstructions() {
    instructionsModal.classList.remove('hidden');
}

function hideInstructions() {
    instructionsModal.classList.add('hidden');
}

function togglePause() {
    if (!isGameRunning) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        gameContainer.classList.add('paused');
        bgMusic.pause();
    } else {
        pauseScreen.classList.add('hidden');
        gameContainer.classList.remove('paused');
        if (soundEnabled) {
            bgMusic.play();
        }
    }
}

function handleKeyPress(e) {
    if (e.key === 'Escape') {
        if (instructionsModal.classList.contains('hidden') && 
            leaderboardModal.classList.contains('hidden') && 
            !startScreen.classList.contains('hidden')) {
            // Do nothing if on start screen
            return;
        }
        
        if (!instructionsModal.classList.contains('hidden')) {
            hideInstructions();
        } else if (!leaderboardModal.classList.contains('hidden')) {
            hideLeaderboard();
        } else if (isGameRunning) {
            togglePause();
        }
    }
} 