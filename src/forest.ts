import { Scene, sceneParams } from "./scene"
import { Cube, Sphere, DebugQuad, Cylinder } from "./primitives"
import { PerlinTerrain } from "./terrain"
import { mat4, vec3 } from "gl-matrix"
import { randomPoisson } from "./random"

export class Forest extends Scene {
    setup() {
        super.setup();
        this.params.addRange("terrainNoiseResolution", sceneParams, 2, 10, 5, 1);
        this.params.addRange("terrainVertexResolution", sceneParams, 10, 500, 100, 10);
        this.params.addRange("terrainYScale", sceneParams, 1, 20, 5, 1);
        this.params.addRange("terrainNSmooth", sceneParams, 0, 10, 3, 1);
        this.params.addRange("terrainSmoothWidth", sceneParams, 3, 11, 3, 2);
        this.params.addRange("treeFrequency", sceneParams, 0, 100, 25, 1);
    }

    preGenerate() {
        super.preGenerate();

        // let c = new Cube(rgb(0,0,1));
        // mat4.fromTranslation(c.transform, [-25, 10, -25]);
        // this.meshes.push(c);

        // c = new Cube(rgb(0,0,1));
        // mat4.fromTranslation(c.transform, [25, 10, -25]);
        // this.meshes.push(c);

        // c = new Cube(rgb(0,0,1));
        // mat4.fromTranslation(c.transform, [-25, 10, 25]);
        // this.meshes.push(c);

        // c = new Cube(rgb(0,0,1));
        // mat4.fromTranslation(c.transform, [25, 10, 25]);
        // this.meshes.push(c);
        
        let noiseRes = <number>this.params.get("terrainNoiseResolution");
        let vertexRes = <number>this.params.get("terrainVertexResolution");
        let nsmooth = <number> this.params.get("terrainNSmooth");
        let smoothWidth =  <number> this.params.get("terrainSmoothWidth")
        let terrainYScale = <number> this.params.get("terrainYScale");
        let treeFrequency = <number> this.params.get("treeFrequency");
        let terrainSize = 50;
        let terrain = new PerlinTerrain(noiseRes, noiseRes, vertexRes, vertexRes, nsmooth, smoothWidth, rgb(34,139,34));
        mat4.multiply(terrain.transform, terrain.transform, mat4.fromScaling(mat4.create(), [terrainSize, terrainYScale, terrainSize]));
        mat4.multiply(terrain.transform, terrain.transform, mat4.fromTranslation(mat4.create(), [-0.5, 0, -0.5]));
        this.meshes.push(terrain);

        let ntrees = randomPoisson(treeFrequency);
        for (let i = 0; i < ntrees; i++) {
            let [trunk, top] = this.makeTree();
            let i = Math.floor(Math.random()*vertexRes);
            let j = Math.floor(Math.random()*vertexRes);
            let y = terrain.heightmap[i][j]*terrainYScale-1;
            let x = i/vertexRes*terrainSize-terrainSize/2;
            let z = j/vertexRes*terrainSize-terrainSize/2;
            let translate = mat4.fromTranslation(mat4.create(), [x, y, z]);
            mat4.multiply(trunk.transform, translate, trunk.transform);
            mat4.multiply(top.transform, translate, top.transform);
            this.meshes.push(trunk, top);
        }

        this.meshes.push(new DebugQuad());
        
    }

    makeTree() {
        let trunk = new Cylinder(true, 64, rgb(210, 180, 140));
        let height = 5;
        let width = .25;
        let id = mat4.create()
        let translate = mat4.fromTranslation(mat4.create(), [0, height/2, 0]);
        let scale = mat4.fromScaling(mat4.create(), [width, height/2, width]);
        trunk.setTransform(scale, id, translate);

        let top = new Sphere(4, rgb(60,179,113));
        let size = 1.5;
        translate = mat4.fromTranslation(mat4.create(), [0, height, 0]);
        scale = mat4.fromScaling(mat4.create(), [size, size, size]);
        top.setTransform(scale, id, translate);

        return [trunk, top];
        // this.meshes.push(trunk);
        // this.meshes.push(top);
    }
}

function rgb(r: number, g: number, b: number) {
    return vec3.fromValues(r/255, g/255, b/255);
}