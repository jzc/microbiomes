import { Mesh, collate } from "./mesh"
import { vec3 } from "gl-matrix"
import { basicShader, colorShader, debugShader } from "./shader";

const verticies = [
    // front 
    {position: [-1, -1,  1], normal: [ 0,  0,  1]},
    {position: [ 1, -1,  1], normal: [ 0,  0,  1]},
    {position: [ 1,  1,  1], normal: [ 0,  0,  1]},
    {position: [-1,  1,  1], normal: [ 0,  0,  1]},
    // back
    {position: [-1, -1, -1], normal: [ 0,  0, -1]},
    {position: [-1,  1, -1], normal: [ 0,  0, -1]},
    {position: [ 1,  1, -1], normal: [ 0,  0, -1]},
    {position: [ 1, -1, -1], normal: [ 0,  0, -1]},
    //top
    {position: [-1,  1, -1], normal: [ 0,  1,  0]}, 
    {position: [-1,  1,  1], normal: [ 0,  1,  0]}, 
    {position: [ 1,  1,  1], normal: [ 0,  1,  0]}, 
    {position: [ 1,  1, -1], normal: [ 0,  1,  0]}, 
    //bottom
    {position: [-1, -1, -1], normal: [ 0, -1,  0]}, 
    {position: [ 1, -1, -1], normal: [ 0, -1,  0]}, 
    {position: [ 1, -1,  1], normal: [ 0, -1,  0]}, 
    {position: [-1, -1,  1], normal: [ 0, -1,  0]}, 
    //right
    {position: [ 1, -1, -1], normal: [ 1,  0,  0]},
    {position: [ 1,  1, -1], normal: [ 1,  0,  0]},
    {position: [ 1,  1,  1], normal: [ 1,  0,  0]},
    {position: [ 1, -1,  1], normal: [ 1,  0,  0]},
    //left
    {position: [-1, -1, -1], normal: [-1,  0,  0]},
    {position: [-1, -1,  1], normal: [-1,  0,  0]},
    {position: [-1,  1,  1], normal: [-1,  0,  0]},
    {position: [-1,  1, -1], normal: [-1,  0,  0]},
];

const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
];

export class Cube extends Mesh {
    constructor(color: number[]) {        
        super(verticies.map(v => v.position.concat(v.normal).concat(color)), indices, colorShader);
    }
}

export class UnlitCube extends Mesh {
    constructor(color: number[]) {
        super(verticies.map(v => v.position.concat([0,0,0]).concat(color)), indices, basicShader);        
    }
}

export class Sphere extends Mesh {
    constructor(n: number, color: vec3) {
        let i = 0;
        let a = vec3.fromValues(Math.sin(1*Math.PI/4), 0, Math.cos(1*Math.PI/4));
        let b = vec3.fromValues(Math.sin(3*Math.PI/4), 0, Math.cos(3*Math.PI/4));
        let c = vec3.fromValues(Math.sin(5*Math.PI/4), 0, Math.cos(5*Math.PI/4));
        let d = vec3.fromValues(Math.sin(7*Math.PI/4), 0, Math.cos(7*Math.PI/4));
        let e = vec3.fromValues(0, 1, 0);
        let f = vec3.fromValues(0, -1, 0);
        let ai, bi, ci, di, ei, fi;
        let positions = [
            (ai = i++, a),
            (bi = i++, b),
            (ci = i++, c),
            (di = i++, d),
            (ei = i++, e),
            (fi = i++, f),
        ];
        
        let tris: Array<[number, number, number]> = [
            [ei, ai, bi], [fi, bi, ai],
            [ei, di, ai], [fi, ai, di],
            [ei, ci, di], [fi, di, ci],
            [ei, bi, ci], [fi, ci, bi],
        ];

        function subdivide(triIdxs: [number, number, number]): Array<[number, number, number]> {
            let [ai, bi, ci] = triIdxs;
            let [a, b, c] = [positions[ai], positions[bi], positions[ci]];

            let ac = vec3.scale(vec3.create(), vec3.add(vec3.create(), a, c), 1/2);
            let ab = vec3.scale(vec3.create(), vec3.add(vec3.create(), a, b), 1/2);
            let bc = vec3.scale(vec3.create(), vec3.add(vec3.create(), b, c), 1/2);

            let aci = positions.length;
            positions.push(ac);
            let abi = positions.length;
            positions.push(ab);
            let bci = positions.length;
            positions.push(bc);

            return [
                [ai, abi, aci],
                [abi, bci, aci],
                [abi, bi, bci],
                [aci, bci, ci],
            ]
        }

        for (let i = 0; i < n; i++) {
            let newTris: Array<[number, number, number]>  = [];
            for (let tri of tris) {
                newTris.push(...subdivide(tri))
            }
            tris = newTris;
        }

        let indices = [];
        for (let tri of tris) {
            indices.push(...tri);
        }

        let verticies = [];
        for (let position of positions) {
            let p = vec3.normalize(vec3.create(), position);
            verticies.push(collate(p, p, color));
        }

        super(verticies, indices, colorShader);
    }
}

export class DebugQuad extends Mesh {
    constructor() {
        let verticies = [
            [-1, -1, 0, 0, 0, 0, 0, 0],
            [-.75, -1, 0, 0, 0, 0, 1, 0],
            [-.75, -.75, 0, 0, 0, 0, 1, 1],
            [-1, -.75, 0, 0, 0, 0, 0, 1],
        ]
        let indices = [
            0, 1, 2, 0, 2, 3
        ]
        super(verticies, indices, debugShader);
    }
}