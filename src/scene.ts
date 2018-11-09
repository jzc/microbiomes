import { Shader } from "./shader"
import { mat4 } from "gl-matrix"
import { gl, bindVertexArray, createVertexArray } from "./webgl"
import { Mesh } from "./mesh"
import { Triangle, Cube } from "./cube"

export class Scene {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    meshes: Array<Mesh>;
    shader: Shader;
    constructor(canvasId: string) {
        this.canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        this.gl = <WebGLRenderingContext> this.canvas.getContext("webgl");

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
        this.shader = new Shader(vertexSource, fragSource);
        this.meshes = [];
    }

    draw() {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.meshes.push(new Cube(this.shader));

        let model = mat4.create();
        let view = mat4.create();
        let projection = mat4.create();
        mat4.lookAt(view, [0, 2, 2], [0, 0, 0], [0, 1, 0]);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;        
        mat4.perspective(projection, 45, aspect, .1, 10);

        for (let mesh of this.meshes) {
            mesh.shader.use();
            mesh.shader.setMatrix4("uModel", model);
            mesh.shader.setMatrix4("uView", view);
            mesh.shader.setMatrix4("uProjection", projection);
            mesh.draw();
        }
    }
}