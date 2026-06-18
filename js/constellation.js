import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { deriveEmotionName, getNextEmotionName, resetEmotionNames } from './emotions.js';

export class ConstellationManager {
    constructor(app) {
        this.app = app;
        const sf = app.starfield;
        const cfg = app.config.constellation;

        this.THREE = sf.THREE;
        this.scene = sf.scene;
        this.camera = sf.camera;
        this.controls = sf.controls;
        this.position = sf.position;
        this.starCount = sf.starCount;
        this.stars = sf.stars;
        this.wordStarsGroup = sf.wordStarsGroup;
        this.linesGroup = sf.linesGroup;
        this.ghostConstellationsGroup = sf.ghostConstellationsGroup;
        this.wordGlimmerGeometry = sf.wordGlimmerGeometry;
        this.wordGlimmerMaterial = sf.wordGlimmerMaterial;
        this.hoverGlow = sf.hoverGlow;

        this.GHOST_SPREAD = cfg.ghostSpread;
        this.CONSTELLATION_MIN_DISTANCE = cfg.minDistance;
        this.LAUNCH_ANIMATION_MS = cfg.launchAnimationMs;
        this.DISPERSION_MS = cfg.dispersionMs;

        this.clickableTargets = [];
        this.ghostLines = [];
        this.placedConstellationCenters = [];

        this.totalWords = 0;
        this.constellationComplete = false;
        this.viewOnlyMode = false;
        this.clickedStars = new Set();
        this.wordStars = [];
        this.wordStarByIndex = new Map();
        this.anonymousNodes = new Map();

        this.userConstellationLaunched = false;
        this.launchAnimation = null;
        this.userLaunchCenter = null;
        this.userConstellationName = '';
        this.userNameLabel = null;

        this.constellationMode = false;
        this.selectedStar = null;
        this.dispersingWords = false;
        this.dispersionStart = 0;
        this.constellationCameraFrame = null;

        this.hoveredStar = null;

        this.wordCounter = document.getElementById('word-counter');
        this.constellationHint = document.getElementById('constellation-hint');
        this.downloadButton = document.getElementById('download-constellation');
        this.promptScreen = document.getElementById('prompt-screen');
    }

    pickConstellationCenter() {
        const cfg = this.app.config.constellation;
        const minDist = this.CONSTELLATION_MIN_DISTANCE;

        for (let attempt = 0; attempt < cfg.centerPickAttempts; attempt += 1) {
            const center = new this.THREE.Vector3(
                (Math.random() - 0.5) * cfg.centerSpreadX,
                (Math.random() - 0.5) * cfg.centerSpreadY,
                (Math.random() - 0.5) * cfg.centerSpreadZ
            );

            const tooClose = this.placedConstellationCenters.some((placed) => placed.distanceTo(center) < minDist);
            if (!tooClose) {
                this.placedConstellationCenters.push(center.clone());
                return center;
            }
        }

        const fallback = new this.THREE.Vector3(
            (Math.random() - 0.5) * cfg.centerFallbackSpreadX,
            (Math.random() - 0.5) * cfg.centerFallbackSpreadY,
            (Math.random() - 0.5) * cfg.centerFallbackSpreadZ
        );
        this.placedConstellationCenters.push(fallback.clone());
        return fallback;
    }

    createConstellationNameLabel(name, parent, isMine = false) {
        const labelEl = document.createElement('div');
        labelEl.className = `constellation-name${isMine ? ' mine' : ''}`;
        labelEl.textContent = name;
        const label = new CSS2DObject(labelEl);
        label.position.set(0, 22, 0);
        parent.add(label);

        requestAnimationFrame(() => {
            setTimeout(() => labelEl.classList.add('visible'), 120);
        });

        return label;
    }

    pickStarIndices(count) {
        const cfg = this.app.config.constellation;
        const indices = [];
        const anchor = new this.THREE.Vector3(0, 0, 0);
        const minDist = cfg.pickStarMinDist;
        const maxRadius = cfg.pickStarMaxRadius;
        const candidates = Array.from({ length: this.starCount }, (_, i) => i)
            .filter((i) => {
                const x = this.position[i * 3];
                const y = this.position[i * 3 + 1];
                const z = this.position[i * 3 + 2];
                return anchor.distanceTo(new this.THREE.Vector3(x, y, z)) < maxRadius;
            })
            .sort(() => Math.random() - 0.5);

        for (const idx of candidates) {
            if (indices.length >= count) break;

            const x = this.position[idx * 3];
            const y = this.position[idx * 3 + 1];
            const z = this.position[idx * 3 + 2];

            const tooClose = indices.some((other) => {
                const dx = this.position[other * 3] - x;
                const dy = this.position[other * 3 + 1] - y;
                const dz = this.position[other * 3 + 2] - z;
                return Math.hypot(dx, dy, dz) < minDist;
            });

            if (!tooClose) indices.push(idx);
        }

        while (indices.length < count) {
            const idx = Math.floor(Math.random() * this.starCount);
            if (!indices.includes(idx)) indices.push(idx);
        }

        return indices;
    }

    createWordStar(word, starIndex, wordOrderIndex = 0) {
        const x = this.position[starIndex * 3];
        const y = this.position[starIndex * 3 + 1];
        const z = this.position[starIndex * 3 + 2];
        const target = new this.THREE.Vector3(x, y, z);

        const labelEl = document.createElement('div');
        labelEl.className = 'word-star-label';
        labelEl.textContent = word;
        const label = new CSS2DObject(labelEl);
        label.position.set(0, 0, 0);
        this.wordStarsGroup.add(label);

        const hitArea = new this.THREE.Mesh(
            new this.THREE.SphereGeometry(38, 10, 10),
            new this.THREE.MeshBasicMaterial({ visible: false })
        );
        hitArea.position.copy(target);
        this.wordStarsGroup.add(hitArea);

        const wordStar = {
            word,
            starIndex,
            wordOrderIndex,
            isWord: true,
            label,
            labelEl,
            hitArea,
            target,
            glimmerPhase: Math.random() * Math.PI * 2
        };
        hitArea.userData.starNode = wordStar;
        this.clickableTargets.push(hitArea);
        this.wordStarByIndex.set(starIndex, wordStar);
        this.wordStars.push(wordStar);
    }

    getOrCreateStarNode(starIndex) {
        if (this.wordStarByIndex.has(starIndex)) {
            return this.wordStarByIndex.get(starIndex);
        }

        if (!this.anonymousNodes.has(starIndex)) {
            const target = new this.THREE.Vector3(
                this.position[starIndex * 3],
                this.position[starIndex * 3 + 1],
                this.position[starIndex * 3 + 2]
            );

            const hitArea = new this.THREE.Mesh(
                new this.THREE.SphereGeometry(20, 8, 8),
                new this.THREE.MeshBasicMaterial({ visible: false })
            );
            hitArea.position.copy(target);
            this.wordStarsGroup.add(hitArea);

            const node = {
                starIndex,
                isWord: false,
                target,
                hitArea
            };
            hitArea.userData.starNode = node;
            this.clickableTargets.push(hitArea);
            this.anonymousNodes.set(starIndex, node);
        }

        return this.anonymousNodes.get(starIndex);
    }

    updateWordCounter() {
        const copy = this.app.copy;
        this.wordCounter.textContent = copy.wordCounter
            .replace('{clicked}', this.clickedStars.size)
            .replace('{total}', this.totalWords);
        this.wordCounter.classList.toggle('complete', this.constellationComplete);

        if (this.constellationComplete && !this.userConstellationLaunched) {
            this.constellationHint.textContent = copy.constellationHintComplete;
        }
    }

    finalizeConstellationEditing() {
        this.constellationComplete = true;
        this.clearHoverState();

        if (this.selectedStar) {
            this.highlightStar(this.selectedStar, false);
            this.selectedStar = null;
        }

        this.updateWordCounter();

        setTimeout(() => {
            this.launchConstellation();
        }, this.app.config.constellation.finalizeDelayMs);
    }

    disperseWords(words) {
        const copy = this.app.copy;
        const fadeMs = this.app.config.ui.fadeMs;

        this.app.audio.unlockAudio();
        this.promptScreen.classList.remove('visible');
        this.promptScreen.classList.add('fade-out');

        setTimeout(() => {
            this.promptScreen.style.display = 'none';
        }, fadeMs);

        this.totalWords = words.length;
        this.userConstellationName = deriveEmotionName(words);
        this.clickedStars.clear();
        this.constellationComplete = false;
        this.viewOnlyMode = false;
        this.userConstellationLaunched = false;
        this.selectedStar = null;
        this.userLaunchCenter = null;
        this.userNameLabel = null;
        this.placedConstellationCenters.length = 0;
        resetEmotionNames();
        this.downloadButton.classList.remove('visible');

        const starIndices = this.pickStarIndices(words.length);
        words.forEach((word, i) => {
            this.createWordStar(word, starIndices[i], i);
            this.wordStars[this.wordStars.length - 1].labelEl.classList.add('editing-hint');
        });
        this.updateWordGlimmerGeometry();
        this.frameConstellationForEditing();

        this.constellationMode = true;
        this.dispersingWords = true;
        this.dispersionStart = performance.now();
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.wordGlimmerMaterial.size = 5.8;
        this.wordGlimmerMaterial.opacity = 0.48;
        this.hoverGlow.scale.set(24, 24, 1);

        this.wordCounter.textContent = copy.wordCounter
            .replace('{clicked}', '0')
            .replace('{total}', this.totalWords);
        this.constellationHint.textContent = copy.constellationHintEditing;

        setTimeout(() => {
            this.wordCounter.classList.add('visible');
            this.constellationHint.classList.add('visible');
            this.updateWordCounter();
        }, fadeMs + this.DISPERSION_MS);
    }

    addGhostLine(from, to, parent, targetOpacity) {
        const lineGeo = new this.THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
        const lineMat = new this.THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthTest: false,
            depthWrite: false
        });
        const line = new this.THREE.Line(lineGeo, lineMat);
        line.renderOrder = 8;
        parent.add(line);
        this.ghostLines.push({ material: lineMat, targetOpacity });
        return line;
    }

    spawnGhostConstellation() {
        const group = new this.THREE.Group();
        const pointCount = 3 + Math.floor(Math.random() * 4);
        const center = this.pickConstellationCenter();
        group.position.copy(center);
        this.createConstellationNameLabel(getNextEmotionName(), group);
        const points = [];

        for (let i = 0; i < pointCount; i++) {
            points.push(new this.THREE.Vector3(
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150,
                (Math.random() - 0.5) * 150
            ));

            const dot = new this.THREE.Mesh(
                new this.THREE.SphereGeometry(1.1, 6, 6),
                new this.THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0
                })
            );
            dot.position.copy(points[points.length - 1]);
            dot.userData.targetOpacity = 0.38 + Math.random() * 0.18;
            group.add(dot);
        }

        for (let i = 0; i < pointCount - 1; i++) {
            this.addGhostLine(points[i], points[i + 1], group, 0.42 + Math.random() * 0.16);
        }

        if (pointCount > 3 && Math.random() > 0.4) {
            this.addGhostLine(points[0], points[pointCount - 1], group, 0.36);
        }

        this.ghostConstellationsGroup.add(group);

        group.children.forEach((child) => {
            if (child.isMesh && child.userData.targetOpacity) {
                this.ghostLines.push({ material: child.material, targetOpacity: child.userData.targetOpacity });
            }
        });
    }

    getConstellationCentroid() {
        const centroid = new this.THREE.Vector3();
        this.wordStars.forEach((ws) => centroid.add(ws.target));
        if (this.wordStars.length > 0) {
            centroid.divideScalar(this.wordStars.length);
        }
        return centroid;
    }

    prepareLaunchAnimation() {
        const centroid = this.getConstellationCentroid();
        let maxSpread = 1;

        this.wordStars.forEach((ws) => {
            const distance = ws.target.clone().sub(centroid).length();
            if (distance > maxSpread) maxSpread = distance;
        });

        this.anonymousNodes.forEach((node) => {
            const distance = node.target.clone().sub(centroid).length();
            if (distance > maxSpread) maxSpread = distance;
        });

        const scale = this.GHOST_SPREAD / maxSpread;
        const launchCenter = this.pickConstellationCenter();
        this.userLaunchCenter = launchCenter.clone();

        this.wordStars.forEach((ws) => {
            ws.startPos = ws.target.clone();
            ws.endPos = launchCenter.clone().add(
                ws.target.clone().sub(centroid).multiplyScalar(scale)
            );
        });

        this.anonymousNodes.forEach((node) => {
            node.startPos = node.target.clone();
            node.endPos = launchCenter.clone().add(
                node.target.clone().sub(centroid).multiplyScalar(scale)
            );
        });

        this.linesGroup.children.forEach((line) => {
            const positions = line.geometry.attributes.position.array;
            const startA = new this.THREE.Vector3(positions[0], positions[1], positions[2]);
            const startB = new this.THREE.Vector3(positions[3], positions[4], positions[5]);

            line.userData.startA = startA;
            line.userData.startB = startB;
            line.userData.endA = launchCenter.clone().add(startA.clone().sub(centroid).multiplyScalar(scale));
            line.userData.endB = launchCenter.clone().add(startB.clone().sub(centroid).multiplyScalar(scale));
        });

        const userLabelStart = this.getConstellationCentroid().clone().add(new this.THREE.Vector3(0, 22, 0));
        const userLabelEnd = launchCenter.clone().add(new this.THREE.Vector3(0, 22, 0));

        this.launchAnimation = {
            start: performance.now(),
            duration: this.LAUNCH_ANIMATION_MS,
            cameraStart: this.camera.position.clone(),
            cameraEnd: new this.THREE.Vector3(0, 0, this.app.config.camera.launchEndDistance),
            targetStart: this.controls.target.clone(),
            targetEnd: new this.THREE.Vector3(0, 0, 0),
            userLabelStart,
            userLabelEnd
        };

        const ctrlCfg = this.app.config.controls;
        this.controls.minDistance = ctrlCfg.minDistance;
        this.controls.maxDistance = ctrlCfg.launchMaxDistance;
        this.controls.zoomSpeed = ctrlCfg.zoomSpeed;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
    }

    addUserConstellationNameLabel() {
        if (this.userNameLabel || !this.userLaunchCenter) return;

        const labelEl = document.createElement('div');
        labelEl.className = 'constellation-name mine';
        labelEl.textContent = this.userConstellationName;
        this.userNameLabel = new CSS2DObject(labelEl);
        this.userNameLabel.position.copy(
            this.launchAnimation?.userLabelStart || this.userLaunchCenter.clone().add(new this.THREE.Vector3(0, 22, 0))
        );
        this.scene.add(this.userNameLabel);
    }

    updateWordGlimmerGeometry() {
        const positions = new Float32Array(this.wordStars.length * 3);
        this.wordStars.forEach((ws, index) => {
            positions[index * 3] = ws.target.x;
            positions[index * 3 + 1] = ws.target.y;
            positions[index * 3 + 2] = ws.target.z;
        });
        this.wordGlimmerGeometry.setAttribute('position', new this.THREE.BufferAttribute(positions, 3));
    }

    applyStarNodePosition(node, pos) {
        node.target.copy(pos);
        if (node.hitArea) node.hitArea.position.copy(pos);
        if (node.label) node.label.position.copy(pos);
        if (node.isWord) this.updateWordGlimmerGeometry();
    }

    updateLaunchAnimation(now) {
        if (!this.launchAnimation) return;

        const progress = Math.min((now - this.launchAnimation.start) / this.launchAnimation.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = new this.THREE.Vector3();

        this.wordStars.forEach((ws) => {
            current.lerpVectors(ws.startPos, ws.endPos, eased);
            this.applyStarNodePosition(ws, current);
        });

        this.wordGlimmerMaterial.size = this.THREE.MathUtils.lerp(2.2, 1.35, eased);

        this.anonymousNodes.forEach((node) => {
            current.lerpVectors(node.startPos, node.endPos, eased);
            this.applyStarNodePosition(node, current);
        });

        this.linesGroup.children.forEach((line) => {
            if (!line.userData.endA) return;

            const pointA = new this.THREE.Vector3().lerpVectors(line.userData.startA, line.userData.endA, eased);
            const pointB = new this.THREE.Vector3().lerpVectors(line.userData.startB, line.userData.endB, eased);
            line.geometry.setFromPoints([pointA, pointB]);
        });

        this.camera.position.lerpVectors(this.launchAnimation.cameraStart, this.launchAnimation.cameraEnd, eased);
        this.controls.target.lerpVectors(this.launchAnimation.targetStart, this.launchAnimation.targetEnd, eased);

        if (this.userNameLabel && this.launchAnimation.userLabelStart && this.launchAnimation.userLabelEnd) {
            this.userNameLabel.position.lerpVectors(this.launchAnimation.userLabelStart, this.launchAnimation.userLabelEnd, eased);
        }

        if (progress >= 1) {
            this.wordGlimmerMaterial.size = 1.35;
            if (this.userNameLabel) {
                this.userNameLabel.element.classList.add('visible');
            }
            this.launchAnimation = null;
        }
    }

    getWordConstellationBounds() {
        const box = new this.THREE.Box3();
        this.wordStars.forEach((ws) => box.expandByPoint(ws.target));
        if (box.isEmpty()) {
            box.setFromCenterAndSize(new this.THREE.Vector3(0, 0, 0), new this.THREE.Vector3(72, 72, 72));
        }
        return box;
    }

    frameConstellationForEditing(durationMs = this.DISPERSION_MS) {
        const bounds = this.getWordConstellationBounds();
        const center = bounds.getCenter(new this.THREE.Vector3());
        const size = Math.max(bounds.getSize(new this.THREE.Vector3()).length(), 34);
        const viewDistance = size * 0.58 + 14;

        this.constellationCameraFrame = {
            startTime: performance.now(),
            duration: durationMs,
            fromCamera: this.camera.position.clone(),
            toCamera: center.clone().add(new this.THREE.Vector3(0, size * 0.08, viewDistance)),
            fromTarget: this.controls.target.clone(),
            toTarget: center.clone()
        };

        this.controls.minDistance = Math.max(0.006, size * 0.008);
        this.controls.maxDistance = Math.max(viewDistance * 3.4, size * 2.6);
        this.controls.zoomSpeed = 4.5;
    }

    updateConstellationCameraFrame(now) {
        if (!this.constellationCameraFrame) return;

        const t = Math.min((now - this.constellationCameraFrame.startTime) / this.constellationCameraFrame.duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        this.camera.position.lerpVectors(
            this.constellationCameraFrame.fromCamera,
            this.constellationCameraFrame.toCamera,
            eased
        );
        this.controls.target.lerpVectors(
            this.constellationCameraFrame.fromTarget,
            this.constellationCameraFrame.toTarget,
            eased
        );

        if (t >= 1) {
            this.constellationCameraFrame = null;
        }
    }

    getUserConstellationBounds() {
        const box = new this.THREE.Box3();

        this.wordStars.forEach((ws) => box.expandByPoint(ws.target));
        this.anonymousNodes.forEach((node) => box.expandByPoint(node.target));

        this.linesGroup.children.forEach((line) => {
            const positions = line.geometry.attributes.position.array;
            box.expandByPoint(new this.THREE.Vector3(positions[0], positions[1], positions[2]));
            box.expandByPoint(new this.THREE.Vector3(positions[3], positions[4], positions[5]));
        });

        if (box.isEmpty() && this.userLaunchCenter) {
            box.setFromCenterAndSize(this.userLaunchCenter, new this.THREE.Vector3(80, 80, 80));
        }

        return box;
    }

    launchConstellation() {
        if (this.userConstellationLaunched || !this.constellationComplete) return;

        const cfg = this.app.config.constellation;
        const copy = this.app.copy;

        this.userConstellationLaunched = true;
        this.viewOnlyMode = true;

        if (this.selectedStar) {
            this.highlightStar(this.selectedStar, false);
            this.selectedStar = null;
        }

        this.prepareLaunchAnimation();
        this.addUserConstellationNameLabel();
        this.constellationHint.textContent = copy.constellationHintLaunched.replace('{name}', this.userConstellationName);

        for (let i = 0; i < cfg.ghostCount; i++) {
            setTimeout(() => this.spawnGhostConstellation(), i * cfg.ghostSpawnIntervalMs);
        }

        setTimeout(() => {
            this.downloadButton.classList.add('visible');
        }, cfg.downloadButtonDelayMs);
    }

    updateGhostConstellations() {
        this.ghostLines.forEach((entry) => {
            entry.material.opacity += (entry.targetOpacity - entry.material.opacity) * 0.05;
        });
    }

    updateDispersion(now) {
        if (!this.dispersingWords) return;

        const t = Math.min((now - this.dispersionStart) / this.DISPERSION_MS, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        this.wordStars.forEach((ws) => {
            ws.label.position.lerpVectors(new this.THREE.Vector3(0, 0, 0), ws.target, eased);
            ws.hitArea.position.copy(ws.label.position);
            this.updateWordGlimmerGeometry();
        });

        this.wordGlimmerMaterial.opacity = 0.3 * eased;

        if (t >= 1) {
            this.dispersingWords = false;
            this.wordStars.forEach((ws) => {
                ws.label.position.copy(ws.target);
                ws.hitArea.position.copy(ws.target);
            });
            this.updateWordGlimmerGeometry();
            this.app.audio.stopIntroSound(this.app.config.audio.stopIntroOnDispersionMs);
        }
    }

    clearHoverState() {
        if (this.hoveredStar?.isWord) {
            this.hoveredStar.labelEl.classList.remove('hover-reveal');
        }
        this.hoveredStar = null;
        this.hoverGlow.visible = false;
        this.hoverGlow.material.opacity = 0;
    }

    setHoveredStar(starNode) {
        if (this.hoveredStar === starNode) return;

        if (this.hoveredStar?.isWord) {
            this.hoveredStar.labelEl.classList.remove('hover-reveal');
        }

        this.hoveredStar = starNode;

        if (!this.hoveredStar?.isWord) {
            this.hoverGlow.visible = false;
            this.hoverGlow.material.opacity = 0;
            return;
        }

        this.hoveredStar.labelEl.classList.add('hover-reveal');
        this.hoverGlow.position.copy(this.hoveredStar.target);
        this.hoverGlow.visible = true;
        this.hoverGlow.material.opacity = 0.42;
    }

    updateWordGlimmer(now) {
        if (this.dispersingWords || this.userConstellationLaunched || this.launchAnimation) return;

        const breathe = Math.sin(now * 0.0009) * 0.03;
        const isHoveringWord = this.hoveredStar?.isWord;
        const isSelectedWord = this.selectedStar?.isWord;

        if (isHoveringWord) {
            this.hoverGlow.material.opacity = 0.48 + Math.sin(now * 0.003) * 0.1;
            this.wordGlimmerMaterial.opacity = 0.62 + breathe;
            this.wordGlimmerMaterial.size = 8.5;
            return;
        }

        this.hoverGlow.visible = false;
        this.wordGlimmerMaterial.opacity = isSelectedWord ? 0.56 + breathe : 0.46 + breathe;
        this.wordGlimmerMaterial.size = isSelectedWord ? 7.2 : 5.8;
    }

    highlightStar(starNode, active) {
        if (!starNode?.isWord) return;

        if (active) {
            starNode.labelEl.classList.add('selected');
        } else {
            starNode.labelEl.classList.remove('selected');
        }
    }

    drawLineBetween(a, b) {
        const points = [a.target.clone(), b.target.clone()];
        const lineGeo = new this.THREE.BufferGeometry().setFromPoints(points);
        const isCertain = a.isWord && b.isWord;
        const lineMat = new this.THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: isCertain ? 0.52 : 0.28,
            depthTest: false,
            depthWrite: false
        });
        const line = new this.THREE.Line(lineGeo, lineMat);
        line.renderOrder = 10;
        this.linesGroup.add(line);
    }

    onStarClick(starNode) {
        if (this.dispersingWords || this.viewOnlyMode || this.userConstellationLaunched) return;

        const previousSelected = this.selectedStar;
        const soundType = this.app.audio.getTouchSoundType(starNode, previousSelected);
        this.app.audio.playStarTouchSound(soundType, starNode);

        const isNewStar = !this.clickedStars.has(starNode.starIndex);
        if (isNewStar) {
            this.clickedStars.add(starNode.starIndex);
            this.updateWordCounter();
        }

        if (!this.constellationComplete) {
            if (this.selectedStar && this.selectedStar !== starNode) {
                this.drawLineBetween(this.selectedStar, starNode);
                this.highlightStar(this.selectedStar, false);
                this.selectedStar = starNode;
                this.highlightStar(this.selectedStar, true);
            } else {
                if (this.selectedStar) {
                    this.highlightStar(this.selectedStar, false);
                }
                this.selectedStar = starNode;
                this.highlightStar(this.selectedStar, true);
            }
        }

        if (isNewStar && this.clickedStars.size >= this.totalWords) {
            this.finalizeConstellationEditing();
        }
    }
}
