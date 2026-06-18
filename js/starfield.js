import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createSoftStarTexture } from './utils.js';

export function createStarfield(config, onOrbitChange) {
    const { camera: camCfg, stars: starCfg, controls: ctrlCfg } = config;

    const starTexture = createSoftStarTexture(THREE);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(starCfg.backgroundColor);

    const camera = new THREE.PerspectiveCamera(
        camCfg.fov,
        window.innerWidth / window.innerHeight,
        camCfg.near,
        camCfg.far
    );
    camera.position.set(0, 0, camCfg.introDistanceStart);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.touchAction = 'none';
    document.body.prepend(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'fixed';
    labelRenderer.domElement.style.inset = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '5';
    document.body.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = ctrlCfg.dampingFactor;
    controls.autoRotate = true;
    controls.autoRotateSpeed = ctrlCfg.autoRotateSpeed;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.zoomSpeed = ctrlCfg.zoomSpeed;
    controls.panSpeed = ctrlCfg.panSpeed;
    controls.minDistance = ctrlCfg.minDistance;
    controls.maxDistance = ctrlCfg.maxDistance;
    controls.addEventListener('start', () => onOrbitChange(true));
    controls.addEventListener('end', () => onOrbitChange(false));

    const starCount = starCfg.count;
    const geometry = new THREE.BufferGeometry();
    const position = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount * 3; i += 3) {
        position[i] = (Math.random() - 0.5) * starCfg.fieldSpread;
        position[i + 1] = (Math.random() - 0.5) * starCfg.fieldSpread;
        position[i + 2] = (Math.random() - 0.5) * starCfg.fieldSpread;
        sizes[i / 3] = Math.random() * 3 + 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: starCfg.defaultSize,
        map: starTexture,
        alphaMap: starTexture,
        sizeAttenuation: true,
        transparent: true,
        opacity: starCfg.defaultOpacity,
        alphaTest: 0.01,
        depthWrite: false
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    const wordStarsGroup = new THREE.Group();
    const linesGroup = new THREE.Group();
    const ghostConstellationsGroup = new THREE.Group();
    scene.add(wordStarsGroup);
    scene.add(linesGroup);
    scene.add(ghostConstellationsGroup);

    const wordGlimmerGeometry = new THREE.BufferGeometry();
    const wordGlimmerMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.4,
        map: starTexture,
        alphaMap: starTexture,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true,
        alphaTest: 0.01,
        depthWrite: false
    });
    const wordGlimmerPoints = new THREE.Points(wordGlimmerGeometry, wordGlimmerMaterial);
    wordStarsGroup.add(wordGlimmerPoints);

    const hoverGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: starTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    hoverGlow.scale.set(14, 14, 1);
    hoverGlow.visible = false;
    wordStarsGroup.add(hoverGlow);

    let introCameraZoom = null;
    let starsRotating = true;

    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onResize);

    function startIntroCameraZoom(durationMs = camCfg.introZoomDurationMs) {
        controls.enabled = false;
        introCameraZoom = {
            startTime: performance.now(),
            duration: durationMs,
            fromPos: new THREE.Vector3(0, 0, camCfg.introDistanceStart),
            toPos: new THREE.Vector3(0, 0, camCfg.introDistanceEnd),
            fromSize: starCfg.introSizeStart,
            toSize: starCfg.introSizeEnd,
            fromOpacity: starCfg.introOpacityStart,
            toOpacity: starCfg.introOpacityEnd
        };
        camera.position.copy(introCameraZoom.fromPos);
        controls.target.set(0, 0, 0);
    }

    function updateIntroCameraZoom(now) {
        if (!introCameraZoom) return;

        const t = Math.min((now - introCameraZoom.startTime) / introCameraZoom.duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        camera.position.lerpVectors(introCameraZoom.fromPos, introCameraZoom.toPos, eased);
        material.size = introCameraZoom.fromSize + (introCameraZoom.toSize - introCameraZoom.fromSize) * eased;
        material.opacity = introCameraZoom.fromOpacity + (introCameraZoom.toOpacity - introCameraZoom.fromOpacity) * eased;
        material.needsUpdate = true;

        if (t >= 1) {
            introCameraZoom = null;
            controls.enabled = true;
            controls.update();
        }
    }

    function clearIntroCameraZoom() {
        introCameraZoom = null;
    }

    return {
        THREE,
        scene,
        camera,
        renderer,
        labelRenderer,
        controls,
        stars,
        material,
        position,
        starCount,
        wordStarsGroup,
        linesGroup,
        ghostConstellationsGroup,
        wordGlimmerGeometry,
        wordGlimmerMaterial,
        wordGlimmerPoints,
        hoverGlow,
        starTexture,
        get starsRotating() { return starsRotating; },
        set starsRotating(v) { starsRotating = v; },
        get introCameraZoom() { return introCameraZoom; },
        set introCameraZoom(v) { introCameraZoom = v; },
        startIntroCameraZoom,
        updateIntroCameraZoom,
        clearIntroCameraZoom
    };
}
