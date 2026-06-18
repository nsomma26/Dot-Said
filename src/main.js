import ScreenManager from "./scene";
import { scene,camera,renderer } from "./scene";
import Stars from "./stars.js";
import { controls } from "./controls.js";
const solarSystem = new ScreenManager();
const stars=new Stars(scene);
function animate(){
    requestAnimationFrame(animate);
    stars.update();
    controls.update();
    renderer.render(scene,camera)
}

animate()