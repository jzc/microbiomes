import { Shader } from "./shader"
import { mat4, vec3 } from "gl-matrix"
import { gl, bindVertexArray, createVertexArray } from "./webgl"
import { Mesh } from "./mesh"
import { Triangle, Cube } from "./primitives"

const vertexSource = `
            attribute vec3 aVertexPosition;
            attribute vec3 aVertexNormal;
            
            uniform mat4 uModel;
            uniform mat4 uView;
            uniform mat4 uProjection;

            varying lowp vec3 vNormal;

            void main() {
                gl_Position = uProjection * uView * uModel * vec4(aVertexPosition, 1);
                vNormal = aVertexNormal;
            }
        `;

const fragSource = `
    varying lowp vec3 vNormal;
    void main() {
        lowp vec3 color = abs(vNormal);
        gl_FragColor = vec4(color, 1);
    }
`;

function sin(x: number) {
    return Math.sin(x*Math.PI/180);
}

function cos(x: number) {
    return Math.cos(x*Math.PI/180);
}

export class Scene {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    meshes: Array<Mesh> = [];
    shader: Shader = new Shader(vertexSource, fragSource);
    cameraPosition: vec3 | null = null;
    cameraPitch: number = 45;
    cameraYaw: number = 45;
    cameraRadius: number = 10;
    prevX: number | undefined = undefined;
    prevY: number | undefined = undefined;
    ismousedown: boolean = false;

    constructor(canvasId: string) {
        this.canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        this.gl = <WebGLRenderingContext> this.canvas.getContext("webgl");
        this.addEventListeners()
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

    draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.meshes.push(new Cube(this.shader));

        let model = mat4.create();
        let view = mat4.create();
        let projection = mat4.create();

        if (this.cameraPosition == null) {
            let pos = vec3.fromValues(this.cameraRadius*sin(this.cameraYaw)*cos(this.cameraPitch),
                                      this.cameraRadius*sin(this.cameraPitch),
                                      this.cameraRadius*cos(this.cameraYaw)*cos(this.cameraPitch))
            mat4.lookAt(view, pos, [0, 0, 0], [0, 1, 0]);
        }

        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;        
        mat4.perspective(projection, 45, aspect, .1, 100);

        for (let mesh of this.meshes) {
            mesh.shader.use();
            mesh.shader.setMatrix4("uModel", model);
            mesh.shader.setMatrix4("uView", view);
            mesh.shader.setMatrix4("uProjection", projection);
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
                scene.draw();
                then = now - (delta % interval);
            }
        }
        animate()
    }
}