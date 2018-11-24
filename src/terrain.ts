import { Mesh, Vertex } from "./mesh"
import { Shader } from "./shader"
import { vec3 } from "gl-matrix"

export class Terrain extends Mesh {
    constructor(heightmap: number[][], shader: Shader) {
        let height = heightmap.length;
        let width = heightmap[0].length;
        let idx = 0;
        let verticies: Array<Vertex> = [];
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
                    {position: a, normal: abcNorm},
                    {position: b, normal: abcNorm},
                    {position: c, normal: abcNorm},
                    {position: a, normal: acdNorm},
                    {position: c, normal: acdNorm},
                    {position: d, normal: acdNorm},
                )
                indicies.push(idx, idx+1, idx+2, idx+3, idx+4, idx+5, idx+6);
                idx += 6;
            }
        }
        super(verticies, indicies, shader);
    }
}