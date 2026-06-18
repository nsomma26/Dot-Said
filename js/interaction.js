export class InteractionManager {
    constructor(app) {
        this.app = app;
        this.sf = app.starfield;
        this.constellation = app.constellation;

        this.raycaster = new this.sf.THREE.Raycaster();
        this.pointer = new this.sf.THREE.Vector2();
        this.pointerDownPos = null;
        this.isOrbiting = false;
    }

    bind() {
        const { renderer } = this.sf;
        const cfg = this.app.config.interaction;

        renderer.domElement.addEventListener('pointerdown', (event) => {
            this.pointerDownPos = { x: event.clientX, y: event.clientY };
        });

        renderer.domElement.addEventListener('mousemove', (event) => {
            const c = this.constellation;
            if (!c.constellationMode || c.dispersingWords || c.viewOnlyMode || c.userConstellationLaunched || this.isOrbiting) {
                c.clearHoverState();
                return;
            }

            const starNode = this.pickStarFromPointer(event);
            if (starNode?.isWord) {
                c.setHoveredStar(starNode);
            } else {
                c.clearHoverState();
            }
        });

        renderer.domElement.addEventListener('mouseleave', () => {
            this.constellation.clearHoverState();
        });

        renderer.domElement.addEventListener('dblclick', (event) => {
            const c = this.constellation;
            if (c.dispersingWords || c.viewOnlyMode) return;
            if (!c.constellationMode && !c.userConstellationLaunched) return;

            const focusPoint = this.pickFocusPoint(event);
            if (focusPoint) {
                this.sf.controls.target.copy(focusPoint);
            }
        });

        renderer.domElement.addEventListener('pointerup', (event) => {
            const c = this.constellation;
            if (!c.constellationMode || c.dispersingWords || c.viewOnlyMode || c.userConstellationLaunched || !this.pointerDownPos) {
                return;
            }

            const dx = event.clientX - this.pointerDownPos.x;
            const dy = event.clientY - this.pointerDownPos.y;
            this.pointerDownPos = null;

            if (Math.hypot(dx, dy) > cfg.clickTolerance) return;

            const starNode = this.pickStarFromPointer(event);
            if (starNode) {
                c.onStarClick(starNode);
            }
        });
    }

    setOrbiting(value) {
        this.isOrbiting = value;
    }

    pickStarFromPointer(event) {
        const c = this.constellation;
        const cfg = this.app.config.interaction;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, this.sf.camera);

        const meshHits = this.raycaster.intersectObjects(c.clickableTargets, false);
        if (meshHits.length > 0 && meshHits[0].object.userData.starNode) {
            return meshHits[0].object.userData.starNode;
        }

        this.raycaster.params.Points.threshold = c.constellationMode && !c.userConstellationLaunched
            ? cfg.pointsThresholdEditing
            : cfg.pointsThresholdDefault;
        const pointHits = this.raycaster.intersectObject(this.sf.stars);
        if (pointHits.length > 0 && pointHits[0].index !== undefined) {
            return c.getOrCreateStarNode(pointHits[0].index);
        }

        return null;
    }

    pickFocusPoint(event) {
        const c = this.constellation;
        const cfg = this.app.config.interaction;
        const { THREE, stars, camera, ghostConstellationsGroup, position } = this.sf;

        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.pointer, camera);

        const ghostMeshes = [];
        ghostConstellationsGroup.traverse((child) => {
            if (child.isMesh) ghostMeshes.push(child);
        });

        const ghostHits = this.raycaster.intersectObjects(ghostMeshes, false);
        if (ghostHits.length > 0) {
            let group = ghostHits[0].object;
            while (group.parent && group.parent !== ghostConstellationsGroup) {
                group = group.parent;
            }
            return group.getWorldPosition(new THREE.Vector3());
        }

        const meshHits = this.raycaster.intersectObjects(c.clickableTargets, false);
        if (meshHits.length > 0 && meshHits[0].object.userData.starNode) {
            return meshHits[0].object.userData.starNode.target.clone();
        }

        this.raycaster.params.Points.threshold = c.constellationMode && !c.userConstellationLaunched
            ? cfg.pointsThresholdEditing
            : cfg.pointsThresholdDefault;
        const pointHits = this.raycaster.intersectObject(stars);
        if (pointHits.length > 0 && pointHits[0].index !== undefined) {
            const index = pointHits[0].index;
            return new THREE.Vector3(
                position[index * 3],
                position[index * 3 + 1],
                position[index * 3 + 2]
            );
        }

        return null;
    }
}
