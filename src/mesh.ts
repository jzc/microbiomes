import { Shader, getVertexSize, getVertexType } from "./shader"
import { gl, createVertexArray, bindVertexArray } from "./webgl"
import { mat4 } from "gl-matrix"

export class Mesh {
    verticies: Array<number[]>;
    indicies: Array<number>;
    shader: Shader;
    vao: WebGLVertexArrayObjectOES;
    vbo: WebGLBuffer;
    ebo: WebGLBuffer;
    transform: mat4;

    constructor(verticies: Array<number[]>, indicies: Array<number>, shader: Shader) {
        this.verticies = verticies;
        this.indicies = indicies;
        this.shader = shader;
        this.vao = createVertexArray();
        this.vbo = gl.createBuffer()!;
        this.ebo = gl.createBuffer()!;
        this.transform = mat4.create();
        this.setupMesh();
    }

    setupMesh() {   
        // this.shader.use();   
        bindVertexArray(this.vao);

        let verticies: Array<number> = [];
        for (let vert of this.verticies) {
            verticies.push(...vert);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), gl.STATIC_DRAW);

        // TODO: dynamic calculate strides and offsets
        const stride = this.shader.vertexAttributes.map(getVertexSize).reduce((a, b) => a+b, 0);
        let offset = 0;
        for (let va of this.shader.vertexAttributes) {
            const vertexPosition = gl.getAttribLocation(this.shader.shaderProgram, va.name);
            gl.enableVertexAttribArray(vertexPosition);
            gl.vertexAttribPointer(vertexPosition, va.components, getVertexType(va), false, stride, offset);
            offset += getVertexSize(va);
        }
    }

    draw() {
        bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indicies.length, gl.UNSIGNED_SHORT, 0);
    }

}