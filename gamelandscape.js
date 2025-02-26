class ParticleSystem {
    constructor(canvas, color) {
        this.particles = [];
        this.canvas = canvas;
        this.color = color;
    }

    emit(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1
            });
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.shapes = [];
        this.balls = [];
        this.generateBtn = document.getElementById('generateShapes');
        this.addBallBtn = document.getElementById('addBall');

        this.backgroundImage = null;
        this.backgroundInput = document.getElementById('backgroundImage');
        this.characterInput = document.getElementById('characterImage');
        this.addCharacterBtn = document.getElementById('addCharacter');
        this.lastUploadedCharacter = null;
        this.isPortrait = true;
        this.isDragging = false;
        this.selectedShape = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragMode = false;

        this.generateBtn.addEventListener('click', () => this.generateRandomShapes());
        this.addBallBtn.addEventListener('click', () => this.addRandomBall());
        document.getElementById('dragShapes').addEventListener('click', () => this.toggleDragMode());
        document.getElementById('applyShapes').addEventListener('click', () => this.applyShapes());
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundImage(e));
        this.characterInput.addEventListener('change', (e) => this.handleCharacterImage(e));
        this.addCharacterBtn.addEventListener('click', () => {
            if (this.lastUploadedCharacter) {
                const randomAngle = Math.random() * Math.PI * 2;
                const speed = 10;
                const ball = {
                    x: this.canvas.width / 2,
                    y: this.canvas.height / 2,
                    radius: 15,
                    speedX: speed * Math.cos(randomAngle),
                    speedY: speed * Math.sin(randomAngle),
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                    image: this.lastUploadedCharacter
                };
                this.balls.push(ball);
            }
        });

        // Add drag event listeners
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

        // Add touch event listeners
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());

        // Set initial canvas size (portrait mode)
        this.updateCanvasSize();

        // Initialize with one ball
        this.addRandomBall();

        // Particle system
        this.particles = new ParticleSystem(this.canvas, '#00ff88');

        // Mouse control
        this.mouseX = this.canvas.width / 2;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });

        // Touch control
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
        });

        // Start game loop
        this.gameLoop();
    }



    updateCanvasSize() {
        const gameContainer = document.getElementById('gameContainer');
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;

        // Set canvas dimensions for portrait mode
        this.canvas.width = Math.min(800, containerWidth);
        this.canvas.height = Math.min(450, containerHeight);

        // Ensure canvas fills container while maintaining aspect ratio
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.objectFit = 'contain';

        // Update mouse position for new dimensions
        this.mouseX = this.canvas.width / 2;
    }

    addRandomBall() {
        const randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
        const randomAngle = Math.random() * Math.PI * 2;
        const speed = 10;
        const ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 15,
            speedX: speed * Math.cos(randomAngle),
            speedY: speed * Math.sin(randomAngle),
            color: randomColor
        };
        this.balls.push(ball);
    }

    update() {
        const MIN_SPEED = 5;
        const MAX_SPEED = 15;

        for (const ball of this.balls) {
            // Update ball position
            ball.x += ball.speedX;
            ball.y += ball.speedY;

            // Ball follows mouse on X axis with smooth movement
            const targetX = this.mouseX;
            ball.x += (targetX - ball.x) * 0.05; // Reduced from 0.1 to 0.05 for less interference with natural movement

            // Calculate current speed
            const currentSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);

            // If speed is too low, increase it
            if (currentSpeed < MIN_SPEED) {
                const scale = MIN_SPEED / currentSpeed;
                ball.speedX *= scale;
                ball.speedY *= scale;
            }

            // Bounce off walls with controlled random direction
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                // Generate random angle between -60 and 60 degrees from the opposite direction
                const baseAngle = ball.x - ball.radius < 0 ? 0 : Math.PI;
                const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 1.5;
                const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                
                ball.speedX = speed * Math.cos(randomAngle);
                ball.speedY = speed * Math.sin(randomAngle);
                this.particles.emit(ball.x, ball.y, 15);
            }

            // Bounce off top/bottom with controlled random direction
            if (ball.y - ball.radius < 0 || ball.y + ball.radius > this.canvas.height) {
                // Generate random angle between -60 and 60 degrees from the opposite direction
                const baseAngle = ball.y - ball.radius < 0 ? Math.PI / 2 : -Math.PI / 2;
                const randomAngle = baseAngle + (Math.random() - 0.5) * Math.PI / 1.5;
                const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                
                ball.speedX = speed * Math.cos(randomAngle);
                ball.speedY = speed * Math.sin(randomAngle);
                this.particles.emit(ball.x, ball.y, 15);
            }

            // Check collision with shapes
            this.checkShapeCollision(ball);
        }

        // Update particle system
        this.particles.update();
    }

    toggleDragMode() {
        this.dragMode = !this.dragMode;
        const dragBtn = document.getElementById('dragShapes');
        if (this.dragMode) {
            dragBtn.style.background = 'linear-gradient(45deg, #e24a4a, #bd3535)';
        } else {
            dragBtn.style.background = 'linear-gradient(45deg, #4a90e2, #357abd)';
        }
    }

    applyShapes() {
        this.dragMode = false;
        document.getElementById('dragShapes').style.background = 'linear-gradient(45deg, #4a90e2, #357abd)';
    }

    handleMouseDown(e) {
        if (!this.dragMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.checkShapeClick(x, y);
    }

    handleTouchStart(e) {
        if (!this.dragMode) return;
        
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        this.checkShapeClick(x, y);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.moveSelectedShape(x, y);
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.selectedShape = null;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.isDragging && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            this.moveSelectedShape(x, y);
        }
    }

    handleTouchEnd() {
        this.isDragging = false;
        this.selectedShape = null;
    }

    checkShapeClick(x, y) {
        for (const shape of this.shapes) {
            const dx = x - (shape.x + shape.width/2);
            const dy = y - (shape.y + shape.height/2);
            if (Math.abs(dx) < shape.width/2 && Math.abs(dy) < shape.height/2) {
                this.isDragging = true;
                this.selectedShape = shape;
                this.dragStartX = x - shape.x;
                this.dragStartY = y - shape.y;
                break;
            }
        }
    }

    moveSelectedShape(x, y) {
        if (this.selectedShape) {
            this.selectedShape.x = x - this.dragStartX;
            this.selectedShape.y = y - this.dragStartY;
        }
    }

    generateRandomShapes() {
        this.shapes = [];
        const blockSize = 30; // Size of each Tetris block
        const tetrisShapes = [
            // I shape
            [[1, 1, 1, 1]],
            // O shape
            [[1, 1], [1, 1]],
            // T shape
            [[0, 1, 0], [1, 1, 1]],
            // S shape
            [[0, 1, 1], [1, 1, 0]],
            // Z shape
            [[1, 1, 0], [0, 1, 1]],
            // J shape
            [[1, 0, 0], [1, 1, 1]],
            // L shape
            [[0, 0, 1], [1, 1, 1]]
        ];

        const numShapes = Math.floor(Math.random() * 3) + 2; // Generate 2-4 Tetris shapes
        
        for (let i = 0; i < numShapes; i++) {
            const shapePattern = tetrisShapes[Math.floor(Math.random() * tetrisShapes.length)];
            const color = `hsl(${Math.random() * 360}, 70%, 50%)`;
            const angle = Math.random() * Math.PI * 2;
            const baseX = Math.random() * (this.canvas.width - 150) + 75;
            const baseY = Math.random() * (this.canvas.height - 150) + 75;

            // Create rectangles for each block in the Tetris shape
            for (let row = 0; row < shapePattern.length; row++) {
                for (let col = 0; col < shapePattern[row].length; col++) {
                    if (shapePattern[row][col] === 1) {
                        const shape = {
                            type: 'rectangle',
                            x: baseX + col * blockSize,
                            y: baseY + row * blockSize,
                            width: blockSize,
                            height: blockSize,
                            angle: angle,
                            color: color
                        };
                        this.shapes.push(shape);
                    }
                }
            }
        }
    }

    checkShapeCollision(ball) {
        const MIN_SPEED = 5;
        const MAX_SPEED = 15;

        for (const shape of this.shapes) {
            if (shape.type === 'rectangle') {
                // Simplified rectangle collision
                const dx = Math.abs(ball.x - (shape.x + shape.width/2));
                const dy = Math.abs(ball.y - (shape.y + shape.height/2));
                
                if (dx < (shape.width/2 + ball.radius) && dy < (shape.height/2 + ball.radius)) {
                    // Calculate reflection angle based on collision point
                    const collisionAngle = Math.atan2(ball.y - (shape.y + shape.height/2), ball.x - (shape.x + shape.width/2));
                    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                    
                    ball.speedX = speed * Math.cos(collisionAngle);
                    ball.speedY = speed * Math.sin(collisionAngle);
                    
                    this.particles.emit(ball.x, ball.y, 15);
                }
            } else if (shape.type === 'triangle') {
                // Enhanced triangle collision
                const dx = ball.x - shape.x;
                const dy = ball.y - shape.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.radius + shape.width/2) {
                    // Calculate reflection angle based on collision point
                    const collisionAngle = Math.atan2(dy, dx);
                    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
                    
                    ball.speedX = speed * Math.cos(collisionAngle);
                    ball.speedY = speed * Math.sin(collisionAngle);
                    
                    this.particles.emit(ball.x, ball.y, 20);
                }
            }
        }
    }

    handleBackgroundImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    handleCharacterImage(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    this.lastUploadedCharacter = img;
                    this.addCharacterBtn.disabled = false;
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background image if exists
        if (this.backgroundImage) {
            this.ctx.globalAlpha = 0.3;
            const scale = Math.max(this.canvas.width / this.backgroundImage.width, this.canvas.height / this.backgroundImage.height);
            const x = (this.canvas.width - this.backgroundImage.width * scale) / 2;
            const y = (this.canvas.height - this.backgroundImage.height * scale) / 2;
            this.ctx.drawImage(this.backgroundImage, x, y, this.backgroundImage.width * scale, this.backgroundImage.height * scale);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw shapes
        for (const shape of this.shapes) {
            this.ctx.save();
            this.ctx.translate(shape.x + shape.width/2, shape.y + shape.height/2);
            this.ctx.rotate(shape.angle);
            
            // Create gradient
            const gradient = this.ctx.createLinearGradient(-shape.width/2, -shape.height/2, shape.width/2, shape.height/2);
            gradient.addColorStop(0, shape.color);
            gradient.addColorStop(1, '#fff');
            
            this.ctx.fillStyle = gradient;
            this.ctx.shadowColor = shape.color;
            this.ctx.shadowBlur = 15;
            
            if (shape.type === 'rectangle') {
                this.ctx.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
            } else if (shape.type === 'triangle') {
                this.ctx.beginPath();
                this.ctx.moveTo(-shape.width/2, shape.height/2);
                this.ctx.lineTo(shape.width/2, shape.height/2);
                this.ctx.lineTo(0, -shape.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }

        // Draw particles
        this.particles.draw(this.ctx);

        // Draw balls with gradient or character image
        for (const ball of this.balls) {
            this.ctx.save();
            if (ball.image) {
                // Draw character image
                const size = 80; // Fixed size for character images
                this.ctx.drawImage(ball.image, ball.x - size/2, ball.y - size/2, size, size);
            } else {
                // Draw regular ball with gradient
                const gradient = this.ctx.createRadialGradient(
                    ball.x - ball.radius/3,
                    ball.y - ball.radius/3,
                    0,
                    ball.x,
                    ball.y,
                    ball.radius
                );
                gradient.addColorStop(0, '#fff');
                gradient.addColorStop(1, ball.color);

                this.ctx.beginPath();
                this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                // Add glow effect
                this.ctx.shadowColor = ball.color;
                this.ctx.shadowBlur = 20;
                this.ctx.beginPath();
                this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            this.ctx.restore();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});