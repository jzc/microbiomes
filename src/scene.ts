import { mat4, vec3 } from "gl-matrix"
import { gl } from "./webgl"
import { Mesh, NormalMesh } from "./mesh"
import { UnlitCube } from "./primitives"
import { colorShader, hasNormals } from "./shader";

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
const sceneParams = "sceneParams";
const renderParams = "renderParams";

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
    lightRadius = 25;
    lightMesh: Mesh|null = null;
    get lightTransform() {
        let pos = vec3.scale(vec3.create(), this.lightDir, -this.lightRadius);
        let transform = mat4.translate(mat4.create(), mat4.create(), pos);
        return transform;
    }
    get lightDir()  {
        let yaw = <number> this.params.get("lightYaw");
        let pitch = <number> this.params.get("lightPitch");
        return vec3.scale(vec3.create(), anglesToPosition(yaw, pitch, 1), -1);
    }
    
    prevX: number | undefined = undefined;
    prevY: number | undefined = undefined;
    ismousedown: boolean = false;

    projection: mat4 = mat4.perspective(mat4.create(), 45, aspect, .1, 100);;
    view: mat4 = mat4.create();

    params: HTMLInputMap = new HTMLInputMap();


    constructor(canvasId: string) {
        this.canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        this.gl = <WebGLRenderingContext> this.canvas.getContext("webgl");
        this.addEventListeners()
    }

    setup() {
        let sceneParamDiv = document.getElementById(sceneParams)!;
        while (sceneParamDiv.firstChild) {
            sceneParamDiv.removeChild(sceneParamDiv.firstChild);
        }

        let scene = this;
        let generateButton = document.createElement("button");
        generateButton.innerText
        generateButton.addEventListener("click", function () {
            scene.generate();
        })
        sceneParamDiv.appendChild(generateButton);

        let renderParamsDiv = document.getElementById(renderParams)!;
        while (renderParamsDiv.firstChild) {
            renderParamsDiv.removeChild(renderParamsDiv.firstChild);
        }

        this.params = new HTMLInputMap();
        this.params.addRange("lightYaw", sceneParams, 0, 360, 0, 1);
        this.params.addRange("lightPitch", sceneParams, 0, 180, 45, 1);
        this.params.addCheckbox("drawNormals", sceneParams, false);
        this.generate();
    }

    generate() {
        this.meshes = [];
        this.preGenerate();
        this.postGenerate();
    }

    preGenerate() {
        this.lightMesh = new UnlitCube([1, 1, 1]);
        this.meshes.push(this.lightMesh);
    }

    postGenerate() {
        for (let mesh of this.meshes) {
            if (hasNormals(mesh.shader)) {
                let color = vec3.fromValues(1, 0, 0);
                this.meshes.push(new NormalMesh(mesh, color, .1));
            }
        }
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
        this.lightMesh!.transform = this.lightTransform;
    }

    draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
        for (let mesh of this.meshes) {
            if (!(<boolean> this.params.get("drawNormals")) &&
                mesh instanceof NormalMesh) continue;
                
            mesh.shader.use();
            if (mesh.shader == colorShader) {
                mesh.shader.setVec3("uViewPos", this.cameraPos);
                mesh.shader.setVec3("uLightDir", this.lightDir);
                mesh.shader.setVec3("uLightColor", this.lightColor);
                mesh.shader.setMatrix4("uNormal", mesh.normal);
            }
            mesh.shader.setMatrix4("uModel", mesh.transform);
            mesh.shader.setMatrix4("uView", this.view);
            mesh.shader.setMatrix4("uProjection", this.projection);
            mesh.draw();
        }
    }
}

class HTMLInputMap {
    map: Map<string, ()=>number|boolean>;

    constructor() {
        this.map = new Map();
    }

    addRange(key: string, divId: string, min: number, max: number, init: number, step: number) {
        let range = document.createElement("input");
        range.type = "range";
        range.name = key;
        range.min = String(min);
        range.max = String(max);
        range.defaultValue = String(init);
        range.step = String(step);
        let div = document.getElementById(divId)!;
        div.appendChild(range);
        this.map.set(key, () => Number(range.value))
    }

    addCheckbox(key: string, divId: string, init: boolean) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = key;
        checkbox.checked = init;
        let div = document.getElementById(divId)!;
        div.appendChild(checkbox);
        this.map.set(key, () => checkbox.checked);
    }

    get(key: string) {
        return this.map.get(key)!();
    }
}