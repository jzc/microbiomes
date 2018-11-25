import { Mesh } from "./mesh"
import { colorShader } from "./shader"
import { vec3 } from "gl-matrix"

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