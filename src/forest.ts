import { Scene } from "./scene"
import { Cube } from "./primitives"
import { PerlinTerrain } from "./terrain"
import { mat4, vec3 } from "gl-matrix"

export class Forest extends Scene {
    preGenerate() {
        super.preGenerate();
        
        let cube = new Cube([0, 0, 0.75]);
        mat4.translate(cube.transform, mat4.create(), [0, 7, 0]);
        this.meshes.push(cube);
        
        // let terrain = new Terrain(heightmap);
        let terrain = new PerlinTerrain(5, 5, 100, 100);
        mat4.scale(terrain.transform, mat4.create(), [20, 3, 20]);
        mat4.translate(terrain.transform, terrain.transform, [-0.5, 0, -0.5]);
        this.meshes.push(terrain);
    }
}