import { Mesh, collate } from "./mesh"
import { vec3 } from "gl-matrix"
import { basicShader, colorShader, debugShader } from "./shader";
import { SSL_OP_TLS_ROLLBACK_BUG } from "constants";
import { stringify } from "querystring";

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
    constructor(color: vec3) {        
        super(verticies.map(v => v.position.concat(v.normal).concat(Array.from(color))), indices, colorShader);
    }
}

export class UnlitCube extends Mesh {
    constructor(color: number[]) {
        super(verticies.map(v => v.position.concat([0,0,0]).concat(color)), indices, basicShader);        
    }
}

export class Sphere extends Mesh {
    static cache = new Map<string, [Array<number[]>, Array<number>]>();

    constructor(n: number, color: vec3, rock: number|undefined=undefined) {
        let key = String(n)+String(color)+String(rock);
        let res = Sphere.cache.get(key);
        if (rock != undefined || res == undefined) {
            // Inspired by https://stackoverflow.com/questions/7687148/drawing-sphere-in-opengl-without-using-glusphere
            // Construct an octahedron centered around the origin.
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

            // This function takes a 3-tuple of indicies, with each tuple 
            // representing a triangle. this function returns 4 triangles
            // that when together represent the same triangle. it does so
            // by inscribing another triangle within the given triangle 
            // (i.e. if you have an equilateral triangle, subdividing it 
            // would be drawing a triangle inside of it to create a triforce)
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

            // Now, subdivide the faces of the octahedron n times, 
            // i.e. each iteration subdivides the previous iteration's triangles 
            // Takes O(4^n) time.
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

            let protrudeMap = new Map<string, number>();
            function protrude(v: vec3): number {
                let key = hash(v);
                let res = protrudeMap.get(key);
                if (res == undefined) {
                    res = (rock == undefined) ? 1 : 1+(Math.random()*rock-rock/2)
                    protrudeMap.set(key, res);
                }
                return res;
            }

            positions.forEach((v) => vec3.normalize(v, v));
            positions.forEach((v) => vec3.scale(v, v, protrude(v)));
            // positions = positions.map((v) => vec3.normalize(vec3.create(), v));
            
            // positions = positions.map((v) => vec3.scale(vec3.create(), vec3.normalize(vec3.create(), v), protrude()));

            let verticies = [];
            if (rock != undefined) {
                let newIndices = [];
                let idx = 0;
                for (let tri of tris) {
                    let a = positions[tri[0]];
                    let b = positions[tri[1]];
                    let c = positions[tri[2]];
                    let u = vec3.subtract(vec3.create(), b, a);
                    let v = vec3.subtract(vec3.create(), c, a);
                    let norm = vec3.cross(vec3.create(), u, v);
                    verticies.push(
                        collate(a, norm, color),
                        collate(b, norm, color),
                        collate(c, norm, color),
                    )
                    newIndices.push(idx, idx+1, idx+2);
                    idx+=3;
                }
                indices = newIndices;
            } else {
                // Now create the verticies, but normalizing each position vector.
                // Since the octahedron is centered about the origin, this will 
                // project all the verticies onto the unit sphere.
                for (let position of positions) {
                    verticies.push(collate(position, position, color));
                }
            }

            super(verticies, indices, colorShader);
            Sphere.cache.set(key, [verticies, indices]);
        }
        else {
            let [verticies, indices] = res;
            super(verticies, indices, colorShader);
            console.log("sphere cache hit");
        }
        
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

export class Cylinder extends Mesh {
    static cache = new Map<string, [Array<number[]>, Array<number>]>();
    constructor(cap: boolean, n: number, color: vec3) {
        let key = String(cap)+String(n)+String(color)
        let res = Cylinder.cache.get(key);
        if (res == undefined) {
            let verticies: Array<number[]> = [];
            let indices: Array<number> = [];
            let idx = 0;
            let np = n;
            let nVerticies = 2*n;
    
            for (let i = 0; i < n; i++) {
                let th = (i/np)*2*Math.PI;
                let x = Math.sin(th);
                let z = Math.cos(th);
                
                let a = vec3.fromValues(x, 1, z);
                let b = vec3.fromValues(x, -1, z);
                let n = vec3.fromValues(x, 0, z);
    
                verticies.push(
                    collate(a, n, color),
                    collate(b, n, color),
                )
    
                indices.push(
                    idx+0,
                    idx+1,
                    (idx+2)%nVerticies,
                    idx+1,
                    (idx+3)%nVerticies,
                    (idx+2)%nVerticies,
                );
                idx += 2;
            }
    
            if (cap) {
                let ca = vec3.fromValues(0, 1, 0);
                let cb = vec3.fromValues(0, -1, 0);
                let cai = verticies.length;
                verticies.push(collate(ca, ca, color));
                let cbi = verticies.length;
                verticies.push(collate(cb, cb, color));
    
                let initAi=-1, initBi=-1;
    
                for (let i = 0; i < n; i++) {
                    let th = i/n*2*Math.PI;
                    let x = Math.sin(th);
                    let z = Math.cos(th);
                    
                    let a = vec3.fromValues(x, 1, z);
                    let b = vec3.fromValues(x, -1, z);
    
                    let ai = verticies.length;
                    verticies.push(collate(a, ca, color));
                    let bi = verticies.length;
                    verticies.push(collate(b, cb, color));
                    
                    if (i == 0) {
                        initAi = ai;
                        initBi = bi;
                    } 
                    
                    if (i == n-1) {
                        indices.push(
                            ai, initAi, cai,
                            initBi, bi, cbi,
                        )
                    } else {
                        indices.push(
                            ai, ai+2, cai,
                            bi+2, bi, cbi,
                        )
                    }
                }            
            }
            super(verticies, indices, colorShader);
            Cylinder.cache.set(key, [verticies, indices]);
        } else {
            let [verticies, indices] = res;
            super(verticies, indices, colorShader);
            console.log("cylinder cache hit");
        }
    }
}

export class Cone extends Mesh {
    static cache = new Map<string, [Array<number[]>, Array<number>]>()
    constructor(cap: boolean, n: number, color: vec3) {
        let key = String(cap)+String(n)+String(vec3);
        let res = Cone.cache.get(key);
        if (res == undefined) {
            let verticies = [];
            let indices = [];
            let idx = 0;
            let nVerticies = n*2;
            let top = vec3.fromValues(0, 1, 0);
    
            for (let i = 0; i < n; i++) {
                let th1 = i/n*2*Math.PI;
                let th2 = (i+1)/n*2*Math.PI;
                let a = vec3.fromValues(Math.sin(th1), 0, Math.cos(th1))
                let b = vec3.fromValues(Math.sin(th2), 0, Math.cos(th2))
                let n1 = vec3.fromValues(Math.sin(th1), 1, Math.cos(th1));
                let n2 = vec3.fromValues(Math.sin(th2), 1, Math.cos(th2));
                verticies.push(
                    collate(a, n1, color),
                    collate(top, n1, color),
                    // collate(b, n2, color),
                    // collate(top, n2, color),
                )
                indices.push(
                    idx, (idx+3)%nVerticies, (idx+1)%nVerticies,
                    idx, (idx+2)%nVerticies, (idx+3)%nVerticies,
                )
                idx += 2;
            }
    
            if (cap) {
                let cidx = verticies.length;
                let norm = vec3.fromValues(0, -1, 0);
                verticies.push(collate(vec3.fromValues(0, 0, 0), norm, color));
                let idx = verticies.length;
                for (let i = 0; i < n; i++) {
                    let th1 = i/n*2*Math.PI;
                    let th2 = (i+1)/n*2*Math.PI;
                    let a = vec3.fromValues(Math.sin(th1), 0, Math.cos(th1))
                    let b = vec3.fromValues(Math.sin(th2), 0, Math.cos(th2))
                    verticies.push(
                        collate(a, norm, color),
                        collate(b, norm, color),
                    )
                    indices.push(cidx, idx+1, idx);
                    idx += 2;
                }
            }
            super(verticies, indices, colorShader);
            Cone.cache.set(key, [verticies, indices]);
        } else {
            let [verticies, indices] = res;
            super(verticies, indices, colorShader);
            console.log("cone cache hit");
        }
    }
}

function hash(...keys: any[]) {
    return keys.reduce((acc, k) => acc+","+String(k), "");
}