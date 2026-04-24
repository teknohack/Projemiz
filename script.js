import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 1. DEĞİŞKENLER VE DURUM YÖNETİMİ ---
let model;
let score = 0;
let gameActive = false;
let totalSpawnedBalls = 0;
const maxBalls = 25; 
let balls = [];
let finalDiscountCode = ""; 
let isCodeGenerated = false;

// --- RESİM YÜKLEME ---

const basketImg = new Image();
basketImg.src = 'cubuk.png';

const imageSources = ['tus1.png', 'tus2.png', 'tus3.png']; 
const loadedImages = [];
let imagesToLoad = imageSources.length;

imageSources.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        loadedImages.push(img);
        imagesToLoad--;
        if (imagesToLoad === 0) gameBtn.disabled = false;
    };
});

// 3D Kurulum
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3d').appendChild(renderer.domElement);

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const gameBtn = document.getElementById('game-btn');
const gameOverlay = document.getElementById('game-overlay');
const closeGame = document.getElementById('close-game');
const scoreElement = document.getElementById('score');
const discountElement = document.getElementById('discount-text');

let basket = { x: 0, y: 0, w: 150, h: 80, r: 0 };

// --- 2. FONKSİYONLAR ---

function generateDiscountCode(length = 7) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = '';
    for (let i = 0; i < length; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
}

function drawBasket(x, y, w, h) {
    ctx.drawImage(basketImg, x, y, w, h);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h); // Resmin etrafına çerçeve çizer
}

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(1, 1, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
camera.position.z = 3;

// Model Yükleme (Dosya adını kontrol et!)
// script.js içinde bu kısmı bul ve güncelle
new GLTFLoader().load('./sample1.glb', (gltf) => {
    model = gltf.scene;
    scene.add(model);
    
    // Değeri 0.05 yaparak devasa modeli minicik hale getirdik
    model.scale.set(0.15, 0.15, 0.15); 
    model.rotation.x = 0.5; 
    // Z ekseninde -0.3 radyan hafif yana yatırır (estetik durur)
    model.rotation.z = -0.0; 
    // Y ekseninde başlangıç açısı
    model.rotation.y = 1.5;
    
}, undefined, (e) => console.error("Model hatası:", e));
    


function updateGame() {
    if (!gameActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBasket(basket.x, basket.y, basket.w, basket.h, basket.r);

    if (totalSpawnedBalls < maxBalls && loadedImages.length > 0 && Math.random() < 0.03) {
        const randomImg = loadedImages[Math.floor(Math.random() * loadedImages.length)];
        balls.push({ 
            x: Math.random() * (canvas.width - 60) + 30, 
            y: -50, 
            r: 25, 
            speed: 4 + Math.random() * 3,
            image: randomImg 
        });
        totalSpawnedBalls++;
    }

    balls.forEach((ball, index) => {
        ball.y += ball.speed;
        if (ball.image) {
            ctx.drawImage(ball.image, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
        }

        if (ball.y + ball.r > basket.y && ball.x > basket.x && ball.x < basket.x + basket.w) {
            balls.splice(index, 1);
            score++;
            scoreElement.innerText = score;
            discountElement.innerText = `İndirim: %${score}`;
        }
        if (ball.y > canvas.height + 50) balls.splice(index, 1);
    });

    if (totalSpawnedBalls >= maxBalls && balls.length === 0) {
        if (!isCodeGenerated) {
            finalDiscountCode = generateDiscountCode();
            isCodeGenerated = true;
        }
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 35px Arial";
        ctx.textAlign = "center";
        ctx.fillText("OYUN BİTTİ!", canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = "24px Arial";
        ctx.fillText(`Toplam İndirim: %${score}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = "#ffcc00"; 
        ctx.font = "bold 45px Courier New";
        ctx.fillText(finalDiscountCode, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillStyle = "#00ff00";
        ctx.font = "16px Arial";
        ctx.fillText("Kopyalamak için tıkla!", canvas.width / 2, canvas.height / 2 + 80);
    }
    requestAnimationFrame(updateGame);
}

// --- 3. OLAYLAR ---
window.addEventListener('scroll', () => {
   
    if (model) {
        const scrollY = window.scrollY;

        // 1. SINIRLI DÖNME (MAX 180 DERECE)
        // Math.min kullanarak 3.14 (180 derece) değerini geçmesini engelliyoruz.
        const rotationCalculation = scrollY * 0.005;
        model.rotation.y = Math.min(rotationCalculation, 3.14);

        // 2. GERİYE GİTME (UZAKLAŞMA)
        // Sayfa aşağı indikçe z ekseninde uzaklaşmaya devam eder.
        model.position.z = - (scrollY * 0.003);
    }
});


window.addEventListener('mousemove', (e) => {
   basket.x = e.clientX - basket.w / 2;

    basket.y = window.innerHeight - (basket.h + 20);
});

canvas.addEventListener('click', () => {
    if (isCodeGenerated && finalDiscountCode !== "") {
        navigator.clipboard.writeText(finalDiscountCode).then(() => {
            alert("Kod kopyalandı: " + finalDiscountCode);
        });
    }
});

gameBtn.onclick = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameOverlay.style.display = 'block';
    gameActive = true;
    score = 0;
    totalSpawnedBalls = 0;
    balls = [];
    isCodeGenerated = false;
    finalDiscountCode = "";
    scoreElement.innerText = "0";
    discountElement.innerText = "İndirim: %0";
    updateGame();
};

closeGame.onclick = () => {
    gameOverlay.style.display = 'none';
    gameActive = false;
};

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
