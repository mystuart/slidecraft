// Slidecraft Three.js bundle 入口
// 把 three core + OrbitControls + CSS2DRenderer 打成一个自包含的 IIFE
// 暴露到 window.__scThree / window.__scOrbitControls / window.__scCSS2D
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

window.__scThree = THREE;
window.__scOrbitControls = OrbitControls;
window.__scCSS2D = { CSS2DObject, CSS2DRenderer };
window.__scThreeReady = true;
