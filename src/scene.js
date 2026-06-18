import * as THREE from 'three';

// step 1 create a scene

export const scene= new THREE.Scene();
scene.background = new THREE.Color(0x000000);
export const camera= new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.z=5;

export const renderer=new THREE.WebGLRenderer({antialias:true});

export default class ScreenManager{
    constructor(){
        this.init()
    }

    init(){
        renderer.setSize(window.innerWidth,window.innerHeight); 
        document.body.appendChild(renderer.domElement);

    }
}


window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight)
})