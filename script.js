import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 3D MODEL VE SCROLL AYARLARI ---
let model;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('container3d').appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(1, 1, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
camera.position.z = 3;

new GLTFLoader().load('./sample1.glb', (gltf) => {
    model = gltf.scene;
    scene.add(model);
    model.scale.set(0.15, 0.15, 0.15); 
    model.rotation.x = 0.5; 
    model.rotation.y = 1.5;
}, undefined, (e) => console.error("Model hatası:", e));

window.addEventListener('scroll', () => {
    if (model) {
        const scrollY = window.scrollY;
        const rotationCalculation = scrollY * 0.005;
        model.rotation.y = Math.min(rotationCalculation, 3.14);
        model.position.z = - (scrollY * 0.003);
    }
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
