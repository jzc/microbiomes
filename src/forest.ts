import { Scene } from "./scene"
import { Cube, Sphere, DebugQuad, Cylinder } from "./primitives"
import { PerlinTerrain } from "./terrain"
import { mat4, vec3 } from "gl-matrix"

export class Forest extends Scene {
    preGenerate() {
        super.preGenerate();
        
        let cube = new Cube([0, 0, 0.75]);
        let translate: mat4, rotate: mat4, scale: mat4;
        translate = mat4.fromTranslation(mat4.create(), [-10, 7, 10]);
        rotate = mat4.fromYRotation(mat4.create(), Math.PI/4);
        scale = mat4.fromScaling(mat4.create(), [1, 5, 1]);
        mat4.multiply(cube.transform, cube.transform, translate);
        mat4.multiply(cube.transform, cube.transform, rotate);
        mat4.multiply(cube.transform, cube.transform, scale);
        this.meshes.push(cube);

        let sphere = new Sphere(4, vec3.fromValues(0, 0, 0.75));
        translate = mat4.fromTranslation(mat4.create(), [10, 10, 10]);
        rotate = mat4.fromZRotation(mat4.create(), Math.PI/4);
        scale = mat4.fromScaling(mat4.create(), [5, 1, 1]);
        mat4.multiply(sphere.transform, sphere.transform, translate);
        mat4.multiply(sphere.transform, sphere.transform, rotate);
        mat4.multiply(sphere.transform, sphere.transform, scale);
        this.meshes.push(sphere);

        let cylinder = new Cylinder(true, 64, vec3.fromValues(0, 0, 0.75));
        translate = mat4.fromTranslation(mat4.create(), [-10, 10, -10])
        mat4.multiply(cylinder.transform, cylinder.transform, translate);
        this.meshes.push(cylinder)
        
        let terrain = new PerlinTerrain(5, 5, 100, 100);
        mat4.scale(terrain.transform, mat4.create(), [25, 8, 25]);
        mat4.translate(terrain.transform, terrain.transform, [-0.5, 0, -0.5]);
        this.meshes.push(terrain);

        this.meshes.push(new DebugQuad());
    }
}