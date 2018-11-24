import { Mesh } from "./mesh"
import { colorShader } from "./shader"
import { vec3 } from "gl-matrix"

function collate(...arrs: Array<Float32Array>) {
    return arrs.map(a => Array.from(a)).reduce((a, b)=>a.concat(b), []);
}

export class Terrain extends Mesh {
    constructor(heightmap: number[][]) {
        let height = heightmap.length;
        let width = heightmap[0].length;
        let idx = 0;
        let verticies: Array<number[]> = [];
        let indicies: Array<number> = [];
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                let a = vec3.fromValues(i/height, heightmap[i][j], j/width);
                let b = vec3.fromValues(i/height, heightmap[i][j+1], j/width);
                let c = vec3.fromValues(i/height, heightmap[i+1][j+1], j/width);
                let d = vec3.fromValues(i/height, heightmap[i+1][j], j/width);
                let u = vec3.create();
                vec3.sub(u, b, a);
                let v = vec3.create();
                vec3.sub(v, c, a);
                let w = vec3.create();
                vec3.sub(w, d, a);
                let abcNorm = vec3.create();
                vec3.cross(abcNorm, u, v);
                let acdNorm = vec3.create();
                vec3.cross(acdNorm, v, w);
                verticies.push(
                    collate(a, abcNorm), 
                    collate(b, abcNorm),
                    collate(c, abcNorm),
                    collate(a, acdNorm),
                    collate(c, acdNorm),
                    collate(d, acdNorm),
                )
                indicies.push(idx, idx+1, idx+2, idx+3, idx+4, idx+5, idx+6);
                idx += 6;
            }
        }
        super(verticies, indicies, colorShader);
    }
}