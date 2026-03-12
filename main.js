const canvas = document.getElementById('canvas-background');
const ctx = canvas.getContext('2d');
const enterBtn = document.getElementById('enter-btn');
const enterScreen = document.getElementById('enter-screen');
const mainContainer = document.getElementById('main-container');
const audio = document.getElementById('bg-music');
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

let particles = [];
const particleCount = 150;

// Resize canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Particle Class with mouse interaction
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5; // Varying sizes
        this.speedX = (Math.random() - 0.5) * 0.2; // Slower
        this.speedY = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.originalOpacity = this.opacity;
        this.glow = Math.random() * 10 + 5;
    }

    update() {
        let baseSpeed = 0.3;
        if (dataArray) {
            const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            baseSpeed += (avg / 255) * 2;
        }

        this.x += this.speedX * (1 + baseSpeed);
        this.y += this.speedY * (1 + baseSpeed);

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
            this.opacity = 0.8;
            this.x -= dx * 0.01;
            this.y -= dy * 0.01;
        } else {
            this.opacity = this.originalOpacity;
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for next particle
    }
}

const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Initialize particles
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Audio Visualizer Logic
let audioContext, analyser, dataArray, source;

function initVisualizer() {
    if (audioContext) {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return;
    }
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

const circCanvas = document.getElementById('circular-visualizer');
const circCtx = circCanvas.getContext('2d');
circCanvas.width = 250;
circCanvas.height = 250;

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    circCtx.clearRect(0, 0, circCanvas.width, circCanvas.height);

    if (analyser) {
        analyser.getByteFrequencyData(dataArray);

        // Pulsing card effect
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const scale = 1 + (avg / 255) * 0.05;
        document.querySelector('.glass-card').style.transform = `scale(${scale})`;

        // Avatar Visualizer
        const centerX = circCanvas.width / 2;
        const centerY = circCanvas.height / 2;
        const baseRadius = 60; // Just outside the avatar border

        circCtx.lineCap = "round";

        // 1. Draw a subtle persistent base ring
        circCtx.beginPath();
        circCtx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        circCtx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        circCtx.lineWidth = 1;
        circCtx.stroke();

        // Determine number of bars
        const bars = 60; // Smooth ring
        const step = Math.floor(dataArray.length / bars);

        for (let i = 0; i < bars; i++) {
            const dataIndex = i * step;
            let barHeight = dataArray[dataIndex] / 5; // Scale height
            if (barHeight < 3) barHeight = 3; // Minimum visible height

            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;

            const x1 = centerX + Math.cos(angle) * (baseRadius + 2); // Gap from base ring
            const y1 = centerY + Math.sin(angle) * (baseRadius + 2);
            const x2 = centerX + Math.cos(angle) * (baseRadius + 2 + barHeight);
            const y2 = centerY + Math.sin(angle) * (baseRadius + 2 + barHeight);

            // Premium Glow Effect
            circCtx.lineWidth = 2.5;
            circCtx.shadowBlur = 15;

            // Dynamic Coloring & Glow based on intensity
            const intensity = dataArray[dataIndex] / 255;
            if (intensity > 0.6) {
                circCtx.strokeStyle = `rgba(255, 255, 255, ${intensity + 0.2})`;
                circCtx.shadowColor = "rgba(100, 200, 255, 0.8)"; // Cyan glow on highs
            } else {
                circCtx.strokeStyle = `rgba(180, 220, 255, ${intensity + 0.1})`;
                circCtx.shadowColor = "rgba(255, 255, 255, 0.2)"; // Soft white glow on lows
            }

            circCtx.beginPath();
            circCtx.moveTo(x1, y1);
            circCtx.lineTo(x2, y2);
            circCtx.stroke();

            // Reset shadow to avoid compounding
            circCtx.shadowBlur = 0;
        }
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

animate();



// Enter Action
enterBtn.addEventListener('click', () => {
    enterScreen.classList.add('hidden');
    mainContainer.classList.add('visible');
    document.getElementById('music-widget').classList.add('visible');

    if (!audioContext) initVisualizer();
    else if (audioContext.state === 'suspended') audioContext.resume();

    audio.volume = 0.5;
    audio.play().catch(e => console.error(e));
});

// Music Toggle Logic
const musicToggle = document.getElementById('music-toggle');
const musicWidget = document.getElementById('music-widget');
const volumeSlider = document.getElementById('volume-slider');

musicToggle.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
        musicWidget.classList.remove('paused');
    } else {
        audio.pause();
        musicToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
        musicWidget.classList.add('paused');
    }
});

// View Counter Logic
function initViewCounter() {
    const viewCountEl = document.getElementById('view-count-val');
    let views = localStorage.getItem('profile_views');

    if (!views) {
        views = Math.floor(Math.random() * 50) + 1240; // High starting number for "cool" factor
    } else {
        views = parseInt(views) + 1;
    }

    localStorage.setItem('profile_views', views);
    viewCountEl.innerText = views;

    // Simulate real-time live views
    setInterval(() => {
        if (Math.random() > 0.7) {
            views++;
            viewCountEl.innerText = views;
            viewCountEl.style.color = '#ffffff'; // Brief highlight
            setTimeout(() => viewCountEl.style.color = 'rgba(255, 255, 255, 0.6)', 500);
            localStorage.setItem('profile_views', views);
        }
    }, 4000);
}

initViewCounter();

// Parallax Tilt Effect
const card = document.querySelector('.glass-card');
document.addEventListener('mousemove', (e) => {
    if (!card) return;

    const xAxis = (window.innerWidth / 2 - e.pageX) / 45;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 45;

    card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Reset tilt when mouse leaves
document.addEventListener('mouseleave', () => {
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});
