import { mat4, vec3 } from "gl-matrix"
import { gl } from "./webgl"
import { Mesh } from "./mesh"
import { Cube } from "./primitives"
import { Terrain, PerlinTerrain } from "./terrain"

function sin(x: number) {
    return Math.sin(x*Math.PI/180);
}

function cos(x: number) {
    return Math.cos(x*Math.PI/180);
}

function anglesToPosition(yaw: number, pitch: number, r: number) {
    return vec3.fromValues(r*sin(yaw)*cos(pitch),
                           r*sin(pitch),
                           r*cos(yaw)*cos(pitch))
}

const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;        

export class Scene {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    meshes: Array<Mesh> = [];

    cameraPitch: number = 45;
    cameraYaw: number = 45;
    cameraRadius: number = 10;
    get cameraPos(): vec3 {
        return anglesToPosition(this.cameraYaw, this.cameraPitch, this.cameraRadius);
    }

    lightColor: vec3 = vec3.fromValues(1, 1, 1);
    lightYaw: number = 0;
    lightPitch: number = 45;
    get lightDir(): vec3 {
        return vec3.scale(vec3.create(), anglesToPosition(this.lightYaw, this.lightPitch, 1), -1);
    }

    prevX: number | undefined = undefined;
    prevY: number | undefined = undefined;
    ismousedown: boolean = false;

    projection: mat4 = mat4.perspective(mat4.create(), 45, aspect, .1, 100);;
    view: mat4 = mat4.create();


    constructor(canvasId: string) {
        this.canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        this.gl = <WebGLRenderingContext> this.canvas.getContext("webgl");
        this.addEventListeners()

        // Add objects
        let cube = new Cube();
        mat4.translate(cube.transform, mat4.create(), [0, 7, 0]);
        this.meshes.push(cube);
        
        let heightmap = [
            [0, 0, 0, 0],
            [0, 5, 5, 0],
            [0, 5, 5, 0],
            [0, 0, 5, 5],
        ];
        // let terrain = new Terrain(heightmap);
        let terrain = new PerlinTerrain(5, 5, 25, 25);
        mat4.scale(terrain.transform, mat4.create(), [4, 1, 4]);new Cube()
        mat4.translate(terrain.transform, terrain.transform, [-0.5, 0, -0.5]);
        this.meshes.push(terrain);

    }

    addEventListeners() {
        let scene = this;
        this.canvas.addEventListener("mousedown", function(e: MouseEvent) {
            scene.ismousedown = true;
            scene.prevX = e.clientX;
            scene.prevY = e.clientY;
        });
        this.canvas.addEventListener("mouseup",  function() {
            scene.ismousedown = false;
        });
        this.canvas.addEventListener("mousemove", function(e: MouseEvent) {
            if (scene.prevX == undefined) scene.prevX = e.clientX;
            if (scene.prevY == undefined) scene.prevY = e.clientY;
            if (!scene.ismousedown) return;
            scene.cameraYaw -= (e.clientX - scene.prevX);
            scene.cameraPitch += (e.clientY - scene.prevY);
            if (scene.cameraPitch >= 90) scene.cameraPitch = 89.9;
            if (scene.cameraPitch <= -90) scene.cameraPitch = -89.9;
            scene.prevX = e.clientX;
            scene.prevY = e.clientY;
        });
        this.canvas.addEventListener("wheel", function(e: WheelEvent) {
            scene.cameraRadius += e.deltaY > 0 ? 1 : -1;
            if (scene.cameraRadius < 1) scene.cameraRadius = 1;
        });
    }

    

    update(dt: number) {
        mat4.lookAt(this.view, this.cameraPos, [0, 0, 0], [0, 1, 0]);
        this.lightYaw += dt/10;
    }

    draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
        for (let mesh of this.meshes) {
            mesh.shader.use();
            mesh.shader.setVec3("uViewPos", this.cameraPos);
            mesh.shader.setVec3("uLightDir", this.lightDir);
            mesh.shader.setVec3("uLightColor", this.lightColor);
            mesh.shader.setMatrix4("uModel", mesh.transform);
            mesh.shader.setMatrix4("uView", this.view);
            mesh.shader.setMatrix4("uProjection", this.projection);
            mesh.shader.setMatrix4("uNormal", mesh.normal);
            mesh.draw();
        }
    }

    loop() {
        let then = Date.now();
        const interval = 1000/60;
        let scene = this;
        function animate() {
            requestAnimationFrame(animate);
            let now = Date.now();
            let delta = now-then;
            if (delta > interval) {
                scene.update(delta);
                scene.draw();
                then = now - (delta % interval);
            }
        }
        animate()
    }
}