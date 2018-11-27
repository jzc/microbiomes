import { Mesh } from "./mesh"
import { colorShader } from "./shader"
import { vec3, vec2 } from "gl-matrix"

function collate(...arrs: Array<Float32Array>) {
    return arrs.map(a => Array.from(a)).reduce((a, b) => a.concat(b), []);
}

export class Terrain extends Mesh {
    constructor(heightmap: number[][]) {
        let height = heightmap.length - 1;
        let width = heightmap[0].length - 1;
        let idx = 0;
        let verticies: Array<number[]> = [];
        let indicies: Array<number> = [];
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let a = vec3.fromValues(i/height, heightmap[i][j], j/width);
                let b = vec3.fromValues(i/height, heightmap[i][j+1], (j+1)/width);
                let c = vec3.fromValues((i+1)/height, heightmap[i+1][j+1], (j+1)/width);
                let d = vec3.fromValues((i+1)/height, heightmap[i+1][j], j/width);
                let u = vec3.sub(vec3.create(), b, a);
                let v = vec3.sub(vec3.create(), c, a);
                let w = vec3.sub(vec3.create(), d, a);
                let abcNorm = vec3.cross(vec3.create(), u, v);
                let acdNorm = vec3.cross(vec3.create(), v, w);
                let color = vec3.fromValues(0, 0, 0.75);

                verticies.push(
                    collate(a, abcNorm, color), 
                    collate(b, abcNorm, color),
                    collate(c, abcNorm, color),
                    collate(a, acdNorm, color),
                    collate(c, acdNorm, color),
                    collate(d, acdNorm, color),
                )
                indicies.push(idx, idx+1, idx+2, idx+3, idx+4, idx+5);
                idx += 6;
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
        super(heightmap);
    }
}