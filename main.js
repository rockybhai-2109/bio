const canvas = document.getElementById('canvas-background');
const ctx = canvas.getContext('2d');
const enterBtn = document.getElementById('enter-btn');
const enterScreen = document.getElementById('enter-screen');
const mainContainer = document.getElementById('main-container');
const audio = document.getElementById('bg-music');
const audioSource = audio.querySelector('source');

// Playlist Configuration
const playlist = [
    { src: 'Bahon Mein Chale Aao - Lofi.mp3', title: 'Bahon Mein Chale Aao' },
    { src: 'music.mp3', title: 'Background Track' }
];
let currentTrackIndex = 0;

function loadTrack(index) {
    currentTrackIndex = index;
    audioSource.src = playlist[index].src;
    audio.load();
    if (audioContext && audioContext.state === 'running') {
        audio.play().catch(e => console.log("Playback error:", e));
    }
}
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
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.originalOpacity = this.opacity;
        this.glow = Math.random() * 8 + 2;
    }

    update() {
        let baseSpeed = 0.5;
        let bassIntensity = 0;
        if (dataArray) {
            // Focus on bass frequencies (index 0-5)
            const bassAvg = (dataArray[0] + dataArray[1] + dataArray[2] + dataArray[3] + dataArray[4]) / 5;
            bassIntensity = bassAvg / 255;
            baseSpeed += bassIntensity * 2;
        }

        this.x += this.speedX * (1 + baseSpeed);
        this.y += this.speedY * (1 + baseSpeed);

        // Mouse influence: Subtle attraction/repulsion
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
            const force = (150 - distance) / 150;
            this.x -= dx * 0.02 * force;
            this.y -= dy * 0.02 * force;
            this.opacity = Math.min(1, this.originalOpacity + force * 0.5);
        } else {
            this.opacity = this.originalOpacity;
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const mouse = { x: 0, y: 0 };
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Heart Particle Class (Enhanced)
class Heart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 25 + 15;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = Math.random() * -12 - 5;
        this.gravity = 0.2;
        this.opacity = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = Math.random() > 0.5 ? '#ff4d6d' : '#ff758f';
        this.glow = 15;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.opacity -= 0.012;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const d = this.size;
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-d / 2, -d / 2, -d, d / 3, 0, d);
        ctx.bezierCurveTo(d, d / 3, d / 2, -d / 2, 0, 0);
        ctx.fill();
        ctx.restore();
    }
}

let hearts = [];

function spawnHearts(x, y, count = 35) {
    for (let i = 0; i < count; i++) {
        hearts.push(new Heart(x, y));
    }
}

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

    let bassIntensity = 0;
    if (analyser) {
        analyser.getByteFrequencyData(dataArray);
        bassIntensity = dataArray[2] / 255;

        // Pulsing card effect
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const scale = 1 + (avg / 255) * 0.05;
        document.querySelector('.glass-card').style.transform = `scale(${scale})`;

        // Avatar Visualizer
        const centerX = circCanvas.width / 2;
        const centerY = circCanvas.height / 2;
        const baseRadius = 60;

        circCtx.lineCap = "round";

        circCtx.beginPath();
        circCtx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        circCtx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        circCtx.lineWidth = 1;
        circCtx.stroke();

        const bars = 60;
        const step = Math.floor(dataArray.length / bars);

        for (let i = 0; i < bars; i++) {
            const dataIndex = i * step;
            let barHeight = dataArray[dataIndex] / 5;
            if (barHeight < 3) barHeight = 3;

            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
            const x1 = centerX + Math.cos(angle) * (baseRadius + 2);
            const y1 = centerY + Math.sin(angle) * (baseRadius + 2);
            const x2 = centerX + Math.cos(angle) * (baseRadius + 2 + barHeight);
            const y2 = centerY + Math.sin(angle) * (baseRadius + 2 + barHeight);

            circCtx.lineWidth = 2.5;
            circCtx.shadowBlur = 15;

            const intensity = dataArray[dataIndex] / 255;
            if (intensity > 0.6) {
                circCtx.strokeStyle = `rgba(255, 255, 255, ${intensity + 0.2})`;
                circCtx.shadowColor = "rgba(100, 200, 255, 0.8)";
            } else {
                circCtx.strokeStyle = `rgba(180, 220, 255, ${intensity + 0.1})`;
                circCtx.shadowColor = "rgba(255, 255, 255, 0.2)";
            }

            circCtx.beginPath();
            circCtx.moveTo(x1, y1);
            circCtx.lineTo(x2, y2);
            circCtx.stroke();
            circCtx.shadowBlur = 0;
        }
    }

    // Connect particles (Network Effect)
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                const opacity = (1 - distance / 100) * 0.2;
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity + (bassIntensity * 0.3)})`;
                ctx.lineWidth = 0.5 + (bassIntensity * 1);
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    hearts = hearts.filter(h => h.opacity > 0);
    hearts.forEach(h => {
        h.update();
        h.draw();
    });

    if (dataArray) {
        document.body.style.setProperty('--vignette-opacity', 0.6 + (bassIntensity * 0.3));

        if (bassIntensity > 0.8) {
            mainContainer.style.filter = `brightness(${1 + (bassIntensity - 0.8) * 0.5})`;
        } else {
            mainContainer.style.filter = 'none';
        }
    }

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

// Love Button Interaction
const loveBtn = document.getElementById('love-btn');
loveBtn.addEventListener('click', (e) => {
    const rect = loveBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    spawnHearts(x, y, 20);
});

// Music Control Buttons
const musicPrev = document.getElementById('music-prev');
const musicNext = document.getElementById('music-next');

musicPrev.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
    musicWidget.classList.remove('paused');
});

musicNext.addEventListener('click', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    musicToggle.innerHTML = '<i class="fa-solid fa-pause"></i>';
    musicWidget.classList.remove('paused');
});

// Auto-play next track
audio.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
});

// --- NEW PREMIUM FEATURES ---

// 1. Rotating Taglines (Typing Effect)
const typingText = document.getElementById('typing-text');
const taglines = [
    "maybe in another life you are mine 💗 👀",
    "living in a dream world... ✨",
    "making magic with code 💀",
    "lost in the music 🎵",
    "always vibing, never basic 🌊"
];
let taglineIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function typeEffect() {
    const currentTagline = taglines[taglineIndex];

    if (isDeleting) {
        typingText.textContent = currentTagline.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        typingText.textContent = currentTagline.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100;
    }

    if (!isDeleting && charIndex === currentTagline.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        taglineIndex = (taglineIndex + 1) % taglines.length;
        typeSpeed = 500;
    }

    setTimeout(typeEffect, typeSpeed);
}

// 2. Music Progress Bar Sync
const progressBar = document.getElementById('music-progress');
const progressContainer = document.getElementById('progress-container');

audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${percent}%`;
});

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});

// 4. Magnetic Social Icons
const socialItems = document.querySelectorAll('.social-item');
socialItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        item.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    item.addEventListener('mouseleave', () => {
        item.style.transform = `translate(0px, 0px)`;
    });
});

// Initialize new features
typeEffect();
