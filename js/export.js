import { cleanWord } from './utils.js';

export function downloadConstellationImage(app) {
    const sf = app.starfield;
    const c = app.constellation;
    const { camera, controls, renderer, labelRenderer, scene, material, ghostConstellationsGroup, wordGlimmerMaterial } = sf;
    const { linesGroup, wordStars, userConstellationName, userNameLabel, getUserConstellationBounds } = c;

    const wordCounter = document.getElementById('word-counter');
    const constellationHint = document.getElementById('constellation-hint');
    const downloadButton = document.getElementById('download-constellation');

    const savedCameraPosition = camera.position.clone();
    const savedControlsTarget = controls.target.clone();
    const savedCameraFov = camera.fov;
    const savedGhostVisible = ghostConstellationsGroup.visible;
    const savedDownloadVisibility = downloadButton.style.visibility;
    const savedHintVisibility = constellationHint.style.visibility;
    const savedCounterVisibility = wordCounter.style.visibility;
    const savedLabelRendererVisibility = labelRenderer.domElement.style.visibility;
    const savedStarOpacity = material.opacity;
    const savedStarSize = material.size;
    const savedWordLabelVisibility = wordStars.map((ws) => {
        const visibility = ws.labelEl.style.visibility;
        ws.labelEl.style.visibility = 'hidden';
        return visibility;
    });
    const savedGlimmerOpacity = wordGlimmerMaterial.opacity;
    const savedGlimmerSize = wordGlimmerMaterial.size;
    const savedLineOpacities = linesGroup.children.map((line) => line.material.opacity);
    const savedUserNameVisibility = userNameLabel
        ? userNameLabel.element.style.visibility
        : '';

    ghostConstellationsGroup.visible = false;
    downloadButton.style.visibility = 'hidden';
    constellationHint.style.visibility = 'hidden';
    wordCounter.style.visibility = 'hidden';
    labelRenderer.domElement.style.visibility = 'hidden';
    if (userNameLabel) userNameLabel.element.style.visibility = 'hidden';

    material.opacity = 0.92;
    material.size = 2.1;
    material.needsUpdate = true;

    wordGlimmerMaterial.opacity = 0.55;
    wordGlimmerMaterial.size = 1.35;

    linesGroup.children.forEach((line) => {
        line.material.opacity = Math.max(line.material.opacity, 0.46);
    });

    const bounds = getUserConstellationBounds();
    const center = bounds.getCenter(new sf.THREE.Vector3());
    const size = Math.max(bounds.getSize(new sf.THREE.Vector3()).length(), 60);

    camera.fov = app.config.export.fov;
    camera.position.copy(center).add(new sf.THREE.Vector3(0, size * 0.18, size * 2.1 + 55));
    camera.lookAt(center);
    controls.target.copy(center);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    renderer.render(scene, camera);

    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const composite = document.createElement('canvas');
    composite.width = width;
    composite.height = height;
    const context = composite.getContext('2d');
    context.drawImage(renderer.domElement, 0, 0);

    const labelPosition = center.clone().add(new sf.THREE.Vector3(0, 22, 0)).project(camera);
    if (labelPosition.z < 1) {
        const x = (labelPosition.x * 0.5 + 0.5) * width;
        const y = (-labelPosition.y * 0.5 + 0.5) * height;
        context.font = '12px "Andale Mono", monospace';
        context.fillStyle = 'rgba(255, 255, 255, 0.58)';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.fillText(userConstellationName, x, y);
    }

    const link = document.createElement('a');
    const safeName = cleanWord(userConstellationName) || 'sestosenso';
    link.download = `costellazione-${safeName}.png`;
    link.href = composite.toDataURL('image/png');
    link.click();

    camera.position.copy(savedCameraPosition);
    controls.target.copy(savedControlsTarget);
    camera.fov = savedCameraFov;
    camera.updateProjectionMatrix();
    material.opacity = savedStarOpacity;
    material.size = savedStarSize;
    material.needsUpdate = true;
    wordGlimmerMaterial.opacity = savedGlimmerOpacity;
    wordGlimmerMaterial.size = savedGlimmerSize;
    linesGroup.children.forEach((line, index) => {
        line.material.opacity = savedLineOpacities[index];
    });
    ghostConstellationsGroup.visible = savedGhostVisible;
    downloadButton.style.visibility = savedDownloadVisibility;
    constellationHint.style.visibility = savedHintVisibility;
    wordCounter.style.visibility = savedCounterVisibility;
    labelRenderer.domElement.style.visibility = savedLabelRendererVisibility;
    wordStars.forEach((ws, index) => {
        ws.labelEl.style.visibility = savedWordLabelVisibility[index];
    });
    if (userNameLabel) {
        userNameLabel.element.style.visibility = savedUserNameVisibility;
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}
