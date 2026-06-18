import * as THREE from 'three';

export class Stars{
    constructor(scene){
        this.scene=scene;
        this.mesh=this.createStars();
        this.scene.add(this.mesh);
    }

    createStars(){
        const starCount=10000;
        const geometry=new THREE.BufferGeometry();
        const position=new Float32Array(starCount*3);
        const sizes= new Float32Array(starCount)
        // random points
        for(let i=0;i<starCount*3;i+=3){
            position[i]=(Math.random()-0.5)*2000;
            position[i+1]=(Math.random()-0.5)*2000;
            position[i+2]=(Math.random()-0.5)*2000;
            sizes[i]=Math.random()*3+10;
        }
        geometry.setAttribute('position',new THREE.BufferAttribute(position,3));
        geometry.setAttribute('size',new THREE.BufferAttribute(sizes,1))
        const material=new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true,
            transparent:true,
            opacity:0.8

        })
        return new THREE.Points(geometry,material)
    }
    update() {
        if (this.mesh) {
            this.mesh.rotation.y += 0.0003;
        }
    }
}
export default Stars;