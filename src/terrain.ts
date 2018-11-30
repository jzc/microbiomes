import { Mesh, collate } from "./mesh"
import { colorShader } from "./shader"
import { vec3, vec2 } from "gl-matrix"

export class Terrain extends Mesh {
    heightmap: number[][];
    height: number;
    width: number
    constructor(heightmap: number[][], color: vec3) {
        let height = heightmap.length;
        let width = heightmap[0].length;

        // Initialize a 2d grid of positions and normal lists
        // For each grid point, there will be up to 8 tri's
        // touching it. The normal list stores each of the
        // normals from these tri's.
        let positionGrid: vec3[][] = [];
        let normalListGrid: Array<vec3>[][] = [];
        let indexGrid: number[][] = [];
        for (let i = 0; i < height; i++) {
            let arr1: vec3[] = [];
            let arr2: Array<vec3>[] = [];
            let arr3: number[] = [];
            for (let j = 0; j < width; j++) {
                arr1.push(vec3.create());
                arr2.push([]);
                arr3.push(-1);
            }
            positionGrid.push(arr1);
            normalListGrid.push(arr2);
            indexGrid.push(arr3);
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

                if (indexGrid[i][j] == -1) {
                    verticies.push(collate(a, an, color));
                    indexGrid[i][j] = idx++;  
                } 
                if (indexGrid[i][j+1] == -1) {
                    verticies.push(collate(b, bn, color));
                    indexGrid[i][j+1] = idx++;  
                } 
                if (indexGrid[i+1][j+1] == -1) {
                    verticies.push(collate(c, cn, color));
                    indexGrid[i+1][j+1] = idx++;  
                } 
                if (indexGrid[i+1][j] == -1) {
                    verticies.push(collate(d, dn, color));
                    indexGrid[i+1][j] = idx++;  
                } 

                let aidx = indexGrid[i][j];
                let bidx = indexGrid[i][j+1];
                let cidx = indexGrid[i+1][j+1];
                let didx = indexGrid[i+1][j];
                indicies.push(aidx, bidx, cidx, aidx, cidx, didx);
            }
        }

        super(verticies, indicies, colorShader);
        this.height = height;
        this.width = width;
        this.heightmap =heightmap;
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
    constructor(ixmax: number, iymax: number, nx: number, ny: number, nsmooth: number, smoothWidth: number, color: vec3) {
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

        const halfKernel = Math.floor(smoothWidth/2);
        for (let ns = 0; ns < nsmooth; ns++) {
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

        super(heightmap, color);
    }
}