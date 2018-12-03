import { Shader, basicShader } from "./shader";
import { gl } from "./webgl"
import { mat4, mat3, vec3 } from "gl-matrix"

const colorVertexLength = 9;
const textureVertexLength = 8;

export class Mesh {
    verticies: Array<number[]>;
    indices: Array<number>;
    vao: WebGLVertexArrayObject;
    vbo: WebGLBuffer;
    ebo: WebGLBuffer;
    drawMode: number = gl.TRIANGLES;
    shader: Shader;

    _transform: mat4
    get transform(): mat4 { return this._transform };
    set transform(x: mat4) { 
        this._transform = x;
        this._normal = null;
    }

    setTransform(scale: mat4, rotate: mat4, translate: mat4) {
        let transform = mat4.create()
        mat4.multiply(transform, transform, translate);
        mat4.multiply(transform, transform, rotate);
        mat4.multiply(transform, transform, scale);
        this.transform = transform;
    }

    _normal: mat4 | null = null;
    get normal(): mat4 {
        if (this._normal == null) { 
            this._normal = mat4.transpose(mat4.create(), mat4.invert(mat4.create(), this.transform)!)
        }
        return this._normal!;
    }

    constructor(verticies: Array<number[]>, indices: Array<number>, shader: Shader) {
        this.verticies = verticies;
        this.indices = indices;
        this.vao = gl.createVertexArray()!;
        this.vbo = gl.createBuffer()!;
        this.ebo = gl.createBuffer()!;
        this._transform = mat4.create();
        this.shader = shader;
        this.setupMesh();
    }

    setupMesh() {   
        gl.bindVertexArray(this.vao);

        let verticies: Array<number> = [];
        for (let vert of this.verticies) {
            verticies.push(...vert);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticies), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);

        let isColorVertex = this.verticies[0].length == colorVertexLength;
        let stride =  isColorVertex ? colorVertexLength*4 : textureVertexLength*4;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3*4);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, isColorVertex ? 3 : 2, gl.FLOAT, false, stride, 6*4);

        gl.bindVertexArray(null);
    }

    draw() {
        gl.bindVertexArray(this.vao);
        gl.drawElements(this.drawMode, this.indices.length, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }
}

export function collate(...arrs: Array<Float32Array>) {
    return arrs.map(a => Array.from(a)).reduce((a, b) => a.concat(b), []);
}

export class NormalMesh extends Mesh {
    constructor(m: Mesh, color: vec3, length: number) {
        let verticies: Array<number[]> = [];
        let indices: Array<number> = [];
        let idx = 0;
        let normalTransform = mat3.normalFromMat4(mat3.create(),  m.transform)!;
        for (let vertex of m.verticies) {
            let p1 = vec3.transformMat4(vec3.create(),vec3.fromValues(vertex[0], vertex[1], vertex[2]), m.transform);
            let n  = vec3.transformMat3(vec3.create(), vec3.fromValues(vertex[3], vertex[4], vertex[5]), normalTransform);
            vec3.scale(n, vec3.normalize(n, n), length);
            let p2 = vec3.add(vec3.create(), p1, n);

            let dn = vec3.fromValues(0,0,0);
            verticies.push(collate(p1, dn, color), collate(p2, dn, color));
            indices.push(idx, idx+1);
            idx += 2;
        }
        super(verticies, indices, basicShader);
        this.drawMode = gl.LINES;
    }
}