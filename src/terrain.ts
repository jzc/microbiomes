import { Mesh } from "./mesh"
import { colorShader, basicShader } from "./shader"
import { vec3, vec2 , mat4 } from "gl-matrix"

function collate(...arrs: Array<Float32Array>) {
    return arrs.map(a => Array.from(a)).reduce((a, b) => a.concat(b), []);
}

export class Terrain extends Mesh {
    constructor(heightmap: number[][]) {
        let height = heightmap.length;
        let width = heightmap[0].length;

        // Initialize a 2d grid of positions and normal lists
        // For each grid point, there will be up to 8 tri's
        // touching it. The normal list stores each of the
        // normals from these tri's.
        let positionGrid: vec3[][] = [];
        let normalListGrid: Array<vec3>[][] = [];
        for (let i = 0; i < height; i++) {
            let arr1: vec3[] = [];
            let arr2: Array<vec3>[] = [];
            for (let j = 0; j < width; j++) {
                arr1.push(vec3.create());
                arr2.push([]);
            }
            positionGrid.push(arr1);
            normalListGrid.push(arr2);
        }

        // Add the positions and normals for each grid point.
        for (let i = 0; i < height-1; i++) {
            for (let j = 0; j < width-1; j++) {
                let a = vec3.fromValues(i/height, heightmap[i][j], j/width);
                let b = vec3.fromValues(i/height, heightmap[i][j+1], (j+1)/width);
                let c = vec3.fromValues((i+1)/height, heightmap[i+1][j+1], (j+1)/width);
                let d = vec3.fromValues((i+1)/height, heightmap[i+1][j], j/width);
                let u = vec3.sub(vec3.create(), b, a);
                let v = vec3.sub(vec3.create(), c, a);
                let w = vec3.sub(vec3.create(), d, a);
                let abcNorm = vec3.cross(vec3.create(), u, v);
                let acdNorm = vec3.cross(vec3.create(), v, w);

                let norms = [abcNorm, acdNorm];
                for (let [ii, jj] of [[i, j], [i, j+1], [i+1, j+1], [i+1, j]]) {
                    normalListGrid[ii][jj].push(...norms);
                }

                positionGrid[i][j] = a;
                positionGrid[i][j+1] = b;
                positionGrid[i+1][j+1] = c;
                positionGrid[i+1][j] = d;
            }
        }

        // Take each of the normals from each grid point and average them.
        let averageNormalGrid = normalListGrid.map(function (arr) {
            return arr.map(function (norms) {
                let sum = norms.reduce((acc, n) => vec3.add(acc, acc, n), vec3.fromValues(0, 0, 0));
                let average = vec3.scale(vec3.create(), sum, 1/norms.length);
                return average;
            })
        })


        // Now construct all the verticies for the mesh.
        let idx = 0;
        let indicies: Array<number> = [];
        let verticies: Array<number[]> = [];
        for (let i = 0; i < height-1; i++) {
            for (let j = 0; j < width-1; j++) {
                let a = positionGrid[i][j];
                let b = positionGrid[i][j+1];
                let c = positionGrid[i+1][j+1];
                let d = positionGrid[i+1][j];

                let an = averageNormalGrid[i][j];
                let bn = averageNormalGrid[i][j+1];
                let cn = averageNormalGrid[i+1][j+1];
                let dn = averageNormalGrid[i+1][j];

                let color = vec3.fromValues(0, 0, 0.75);

                verticies.push(
                    collate(a, an, color),
                    collate(b, bn, color),
                    collate(c, cn, color),
                    collate(d, dn, color),
                )
                indicies.push(idx, idx+1, idx+2, idx, idx+2, idx+3);
                idx += 4;
            }
        }

        super(verticies, indicies, colorShader);
    }
}

function lerp(a0: number, a1: number, w: number) {
    return (1 - w)*a0 + w*a1;
}

class PerlinNoise {
    ixmax: number;
    iymax: number;
    grads: vec2[][];

    constructor(ixmax: number, iymax: number) {
        this.ixmax = ixmax;
        this.iymax = iymax;
        this.grads = [];
        for (let i = 0; i < iymax; i++) {
            let arr = [];
            for (let j = 0; j < ixmax; j++) {
                let theta = 2*Math.PI*Math.random();
                arr.push(vec2.fromValues(Math.cos(theta), Math.sin(theta)));
            }
            this.grads.push(arr);
        }
    }

    dotGridGradient(ix: number, iy: number, x: number, y: number) {
        let d = vec2.fromValues(x - ix, y - iy);
        return vec2.dot(d, this.grads[iy][ix]);
    }

    noise(x: number, y: number) {
        let x0 = Math.floor(x);
        let x1 = x0 + 1;
        let y0 = Math.floor(y);
        let y1 = y0 + 1;

        let sx = x - x0;
        let sy = y - y0;
        
        let n0 = this.dotGridGradient(x0, y0, x, y);
        let n1 = this.dotGridGradient(x1, y0, x, y);
        let ix0 = lerp(n0, n1, sx);
        let n2 = this.dotGridGradient(x0, y1, x, y);
        let n3 = this.dotGridGradient(x1, y1, x, y);
        let ix1 = lerp(n2, n3, sx);
        let value = lerp(ix0, ix1, sy);

        return value;
    }

}

export class PerlinTerrain extends Terrain {
    constructor(ixmax: number, iymax: number, nx: number, ny: number) {
        let gen = new PerlinNoise(ixmax, iymax);
        let heightmap = [];
        let dx = (ixmax-1)/nx;
        let dy = (iymax-1)/ny;
        for (let y = 0; y < ny; y++) {
            let arr = [];
            for (let x = 0; x < nx; x++) {
                arr.push(gen.noise(x*dx, y*dy));
            }
            heightmap.push(arr)
        }

        const kernelWidth = 5;
        const halfKernel = Math.floor(kernelWidth/2);
        const smoothIters = 4;
        for (let ns = 0; ns < smoothIters; ns++) {
            for (let y = 0; y < ny; y++) {
                for (let x = 0; x < nx; x++) {
                    let sum = 0;
                    let n = 0;
                    for (let i = x-halfKernel; i < x+halfKernel; i++) {
                        if (i < 0 || i >= nx) continue;
                        for (let j = y-halfKernel; j < y+halfKernel; j++) {
                            if (j < 0 || j >= ny) continue;
                            sum += heightmap[j][i];
                            n += 1;
                        }
                    }
                    heightmap[y][x] = sum/n;
                }
            }
        }

        super(heightmap);
    }
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
        // this.transform = m.transform;
    }
}