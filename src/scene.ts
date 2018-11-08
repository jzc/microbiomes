import { Shader } from "./shader"
import { mat4 } from "gl-matrix"
import { gl } from "./gl"

export class Scene {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext;
    constructor(canvasId: string) {
        this.canvas = <HTMLCanvasElement> document.getElementById(canvasId);
        this.gl = <WebGLRenderingContext> this.canvas.getContext("webgl");
    }

    draw() {
        const vertexSource = `
            attribute vec4 aVertexPosition;
            
            uniform mat4 uModel;
            uniform mat4 uView;
            uniform mat4 uProjection;

            void main() {
                gl_Position = uProjection * uView * uModel * aVertexPosition;
            }
        `;

        const fragSource = `
            void main() {
                gl_FragColor = vec4(1, 0, 0, 1);
            }
        `;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const shader = new Shader(vertexSource, fragSource);
        shader.use()
        shader.setMatrix4("uModel", mat4.create())
        shader.setMatrix4("uView", mat4.create())
        shader.setMatrix4("uProjection", mat4.create())

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0, 0, 0.5, 0, 0.5, -0.5, 0]), gl.STATIC_DRAW);
        const positionLocation = gl.getAttribLocation(shader.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
}