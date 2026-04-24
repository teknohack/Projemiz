import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * 1. ÜÇ BOYUTLU MODEL VE SAHNE AYARLARI
 */
let model;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3d').appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(1, 1, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 3;

const loader = new GLTFLoader();
loader.load('sample1.glb', (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.scale.set(1.5, 1.5, 1.5);
}, undefined, (error) => console.error("Model yükleme hatası:", error));

// Scroll Dönüşü
window.addEventListener('scroll', () => {
    if (model) {
        const scrollY = window.scrollY;
        model.rotation.y = scrollY * 0.005;
        model.rotation.x = scrollY * 0.002;
    }
});

/**
 * 2. OYUN MANTIĞI VE CANVAS AYARLARI
 */
const gameBtn = document.getElementById('game-btn');
const gameOverlay = document.getElementById('game-overlay');
const closeGame = document.getElementById('close-game');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const discountElement = document.getElementById('discount-text');

let score = 0;
let gameActive = false;
let totalSpawnedBalls = 0;
const maxBalls = 25;
let balls = [];

let basket = { 
    x: window.innerWidth / 2 - 60, 
    y: window.innerHeight - 80, 
    w: 120, 
    h: 25, 
    cornerRadius: 15 
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Yuvarlatılmış Mavi Çubuk Çizimi
function drawBasket(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = '#007bff'; // Mavi
    ctx.fill();
    ctx.strokeStyle = 'black'; // Siyah Border
    ctx.lineWidth = 4;
    ctx.stroke();
}

function updateGame() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBasket(basket.x, basket.y, basket.w, basket.h, basket.cornerRadius);

    // Top Üretimi (25 Sınırı)
    if (totalSpawnedBalls < maxBalls && Math.random() < 0.03) {
        balls.push({ 
            x: Math.random() * (canvas.width - 60) + 30, 
            y: -30, 
            r: 22.5, // 1.5x Büyütüldü
            speed: 5 + Math.random() * 3 
        });
        totalSpawnedBalls++;
    }

    balls.forEach((ball, index) => {
        ball.y += ball.speed;

        // Topu Çiz
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4444';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Yakalama (Hitbox)
        if (ball.y + ball.r > basket.y && 
            ball.x > basket.x && 
            ball.x < basket.x + basket.w) {
            balls.splice(index, 1);
            score++;
            scoreElement.innerText = score;
            discountElement.innerText = `İndirim: %${score * 1}`; // %1 İndirim Oranı
        }

        if (ball.y > canvas.height + 50) balls.splice(index, 1);
    });

    // Oyun Sonu Bilgisi
    if (totalSpawnedBalls >= maxBalls && balls.length === 0) {
        ctx.fillStyle = "white";
        ctx.font = "bold 35px Arial";
        ctx.textAlign = "center";
        ctx.fillText("OYUN BİTTİ!", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText(`Kazanılan Toplam İndirim: %${score * 1}`, canvas.width / 2, canvas.height / 2 + 50);
    }

    requestAnimationFrame(updateGame);
}

/**
 * 3. OLAY DİNLEYİCİLER VE ANA DÖNGÜ
 */
window.addEventListener('mousemove', (e) => {
    basket.x = e.clientX - basket.w / 2;
});

gameBtn.onclick = () => {
    gameOverlay.style.display = 'block';
    gameActive = true;
    score = 0;
    totalSpawnedBalls = 0;
    balls = [];
    scoreElement.innerText = "0";
    discountElement.innerText = "İndirim: %0";
    updateGame();
};

closeGame.onclick = () => {
    gameOverlay.style.display = 'none';
    gameActive = false;
};

// Pencere Boyutu Değişince Her Şeyi Güncelle
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    basket.y = canvas.height - 80;
});

// Three.js Render Döngüsü (Bağımsız)
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
