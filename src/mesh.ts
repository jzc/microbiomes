import { Shader, getVertexSize, getVertexType, basicShader } from "./shader"
import { gl, createVertexArray, bindVertexArray } from "./webgl"
import { mat4, vec3 } from "gl-matrix"

export class Mesh {
    verticies: Array<number[]>;
    indicies: Array<number>;
    shader: Shader;
    vao: WebGLVertexArrayObjectOES;
    vbo: WebGLBuffer;
    ebo: WebGLBuffer;
    drawMode: number = gl.TRIANGLES;

    _transform: mat4
    get transform(): mat4 { return this._transform };
    set transform(x: mat4) { 
        this._transform = x;
        this._normal = null;
    }

    _normal: mat4 | null = null;
    get normal(): mat4 {
        if (this._normal == null) { 
            this._normal = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), this.transform)!)
        }
        return this._normal!;
    }

    constructor(verticies: Array<number[]>, indicies: Array<number>, shader: Shader) {
        this.verticies = verticies;
        this.indicies = indicies;
        this.shader = shader;
        this.vao = createVertexArray();
        this.vbo = gl.createBuffer()!;
        this.ebo = gl.createBuffer()!;
        this._transform = mat4.create();
        this.setupMesh();
    }

    setupMesh() {   
        bindVertexArray(this.vao);

        let verticies: Array<number> = [];
        for (let vert of this.verticies) {
            verticies.push(...vert);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indicies), gl.STATIC_DRAW);

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
        gl.drawElements(this.drawMode, this.indicies.length, gl.UNSIGNED_SHORT, 0);
    }
}

export function collate(...arrs: Array<Float32Array>) {
    return arrs.map(a => Array.from(a)).reduce((a, b) => a.concat(b), []);
}

export class NormalMesh extends Mesh {
    constructor(m: Mesh, color: vec3, length: number) {
        let verticies: Array<number[]> = [];
        let indicies: Array<number> = [];
        let idx = 0;
        let normalTransform = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), m.transform)!);
        for (let vertex of m.verticies) {
            let p1 = vec3.transformMat4(vec3.create(),vec3.fromValues(vertex[0], vertex[1], vertex[2]), m.transform);
            let n  = vec3.transformMat4(vec3.create(), vec3.fromValues(vertex[3], vertex[4], vertex[5]), normalTransform);
            vec3.scale(n, vec3.normalize(n, n), length);
            let p2 = vec3.add(vec3.create(), p1, n);

            verticies.push(collate(p1, color), collate(p2, color));
            indicies.push(idx, idx+1);
            idx += 2;
        }
        super(verticies, indicies, basicShader);
        this.drawMode = gl.LINES;
    }
}