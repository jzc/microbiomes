import { Scene, sceneParams } from "./scene"
import { Cone, Sphere, DebugQuad, Cylinder } from "./primitives"
import { PerlinTerrain } from "./terrain"
import { mat4, vec3 } from "gl-matrix"
import { randomPoisson, randomNormal } from "./random"

export class Forest extends Scene {
    setup() {
        super.setup();
        this.params.addRange("terrainNoiseResolution", sceneParams, 2, 10, 5, 1);
        this.params.addRange("terrainVertexResolution", sceneParams, 10, 500, 100, 10);
        this.params.addRange("terrainYScale", sceneParams, 1, 20, 5, 1);
        this.params.addRange("terrainNSmooth", sceneParams, 0, 10, 3, 1);
        this.params.addRange("terrainSmoothWidth", sceneParams, 3, 11, 3, 2);
        this.params.addRange("objectFrequency", sceneParams, 0, 100, 50, 1);
    }

    preGenerate() {
        super.preGenerate();
        
        let noiseRes = <number>this.params.get("terrainNoiseResolution");
        let vertexRes = <number>this.params.get("terrainVertexResolution");
        let nsmooth = <number> this.params.get("terrainNSmooth");
        let smoothWidth =  <number> this.params.get("terrainSmoothWidth")
        let terrainYScale = <number> this.params.get("terrainYScale");
        let objectFrequency = <number> this.params.get("objectFrequency");
        let terrainSize = 50;
        let terrain = new PerlinTerrain(noiseRes, noiseRes, vertexRes, vertexRes, nsmooth, smoothWidth, rgb(34,139,34));
        mat4.multiply(terrain.transform, terrain.transform, mat4.fromScaling(mat4.create(), [terrainSize, terrainYScale, terrainSize]));
        mat4.multiply(terrain.transform, terrain.transform, mat4.fromTranslation(mat4.create(), [-0.5, 0, -0.5]));
        this.meshes.push(terrain);

        let ntrees = randomPoisson(objectFrequency);
        for (let i = 0; i < ntrees; i++) {
            let parts = this.makeObject();
            let i = Math.floor(Math.random()*vertexRes);
            let j = Math.floor(Math.random()*vertexRes);
            let y = terrain.heightmap[i][j]*terrainYScale-1;
            let x = i/vertexRes*terrainSize-terrainSize/2;
            let z = j/vertexRes*terrainSize-terrainSize/2;
            let translate = mat4.fromTranslation(mat4.create(), [x, y, z]);
            for (let p of parts) {
                mat4.multiply(p.transform, translate, p.transform);
            }
            this.meshes.push(...parts);
        }

        this.meshes.push(new DebugQuad());
        // this.meshes.push(new Sphere(1, rgb(128,128,128),.1));
        
    }

    makeObject() {
        let object_fns = [
            this.makeRock,
            this.makeConeTree,
            this.makeSphereTree
        ]
        let choice = Math.floor(Math.random()*object_fns.length); 
        return object_fns[choice](); 
    }

    makeRock() {
        let rock = new Sphere(1, rgb(128, 128, 128), .7);   
        let scale = Math.random()*1.25+.75;
        rock.setTransform(
            mat4.fromScaling(mat4.create(), [1/scale, 1/scale, 1.5/scale]),
            mat4.fromYRotation(mat4.create(), Math.random()*2*Math.PI),
            mat4.fromTranslation(mat4.create(), [0, 0.75, 0])
        )
        return [rock];
    }


    makeSphereTree() {
        let trunk = new Cylinder(true, 64, rgb(210, 180, 140));
        let height = randomNormal(4, 1);
        let width = .25;
        let id = mat4.create()
        let translate = mat4.fromTranslation(mat4.create(), [0, height/2, 0]);
        let scale = mat4.fromScaling(mat4.create(), [width, height/2, width]);
        trunk.setTransform(scale, id, translate);

        let top = new Sphere(4, rgb(60,179,113));
        let size = randomNormal(1.5,0.2);
        translate = mat4.fromTranslation(mat4.create(), [0, height+size/3, 0]);
        scale = mat4.fromScaling(mat4.create(), [size, size, size]);
        top.setTransform(scale, id, translate);

        return [trunk, top];
    }

    makeConeTree() {
        let trunk = new Cylinder(true, 64, rgb(210, 180, 140));
        let height = randomNormal(5, 0.8);
        let width = .25;
        let id = mat4.create()
        let translate = mat4.fromTranslation(mat4.create(), [0, height/2, 0]);
        let scale = mat4.fromScaling(mat4.create(), [width, height/2, width]);
        trunk.setTransform(scale, id, translate);

        let n = Math.floor(Math.random()*2+2);
        let tops = [];
        for (let i = 0; i < n; i++) {
            let top = new Cone(true, Math.random()*5+5, rgb(0,randomNormal(110, 10),0));
            let size = randomNormal(1.5,0.05);
            translate = mat4.fromTranslation(mat4.create(), [0, height/2+i, 0]);
            scale = mat4.fromScaling(mat4.create(), [size, height/1.25, size]);
            top.setTransform(scale, id, translate);
            tops.push(top)
        }
        return [trunk, ...tops];
    }
}

function rgb(r: number, g: number, b: number) {
    return vec3.fromValues(r/255, g/255, b/255);
}

