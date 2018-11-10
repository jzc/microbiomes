import { vec3 } from "gl-matrix"
import { Shader } from "./shader"
import { gl, createVertexArray, bindVertexArray } from "./webgl"

export interface Vertex {
    position: vec3
    normal: vec3
}

export class Mesh {
    verticies: Array<Vertex>;
    indicies: Array<number>;
    shader: Shader;
    vao: WebGLVertexArrayObjectOES;
    vbo: WebGLBuffer;
    ebo: WebGLBuffer;
    constructor(verticies: Array<Vertex>, indicies: Array<number>, shader: Shader) {
        this.verticies = verticies;
        this.indicies = indicies;
        this.shader = shader;
        this.vao = createVertexArray();
        this.vbo = gl.createBuffer()!;
        this.ebo = gl.createBuffer()!;
        this.setupMesh();
    }

    setupMesh() {   
        this.shader.use();   
        bindVertexArray(this.vao);

        let verticies:Array<number> = [];
        for (let vert of this.verticies) {
            verticies.push(...Array.from(vert.position));
            verticies.push(...Array.from(vert.normal));
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), gl.STATIC_DRAW);

        // TODO: dynamic calculate strides and offsets
        const stride = 2*3*4
        const positionLocation = gl.getAttribLocation(this.shader.shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, stride, 0);

        const normalLocation = gl.getAttribLocation(this.shader.shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(normalLocation);
        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, stride, 3*4);
    }

    draw() {
        bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indicies.length, gl.UNSIGNED_SHORT, 0);
    }

}