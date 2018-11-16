import { Mesh, Vertex } from "./mesh"
import { Shader } from "./shader"
import { vec3 } from "gl-matrix"

export class Cube extends Mesh {
    constructor(shader: Shader) {
        const verticies: Array<{position: [number, number, number], normal: [number, number, number]}> = [
            // front 
            {position: [-1, -1,  1], normal: [ 0,  0,  1]}, 
            {position: [ 1, -1,  1], normal: [ 0,  0,  1]}, 
            {position: [ 1,  1,  1], normal: [ 0,  0,  1]}, 
            {position: [-1,  1,  1], normal: [ 0,  0,  1]}, 
            // back
            {position: [-1, -1, -1], normal: [ 0,  0, -1]}, 
            {position: [-1,  1, -1], normal: [ 0,  0, -1]}, 
            {position: [ 1,  1, -1], normal: [ 0,  0, -1]}, 
            {position: [ 1, -1, -1], normal: [ 0,  0, -1]}, 
            //top
            {position: [-1,  1, -1], normal: [ 0,  1,  0]}, 
            {position: [-1,  1,  1], normal: [ 0,  1,  0]}, 
            {position: [ 1,  1,  1], normal: [ 0,  1,  0]}, 
            {position: [ 1,  1, -1], normal: [ 0,  1,  0]}, 
            //bottom
            {position: [-1, -1, -1], normal: [ 0, -1,  0]}, 
            {position: [ 1, -1, -1], normal: [ 0, -1,  0]}, 
            {position: [ 1, -1,  1], normal: [ 0, -1,  0]}, 
            {position: [-1, -1,  1], normal: [ 0, -1,  0]}, 
            //right
            {position: [ 1, -1, -1], normal: [ 1,  0,  0]}, 
            {position: [ 1,  1, -1], normal: [ 1,  0,  0]}, 
            {position: [ 1,  1,  1], normal: [ 1,  0,  0]}, 
            {position: [ 1, -1,  1], normal: [ 1,  0,  0]}, 
            //left
            {position: [-1, -1, -1], normal: [-1,  0,  0]}, 
            {position: [-1, -1,  1], normal: [-1,  0,  0]}, 
            {position: [-1,  1,  1], normal: [-1,  0,  0]}, 
            {position: [-1,  1, -1], normal: [-1,  0,  0]}, 
        ];

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];
        
        super(verticies.map(value => <Vertex>{
            position: vec3.fromValues(...value.position),
            normal: vec3.fromValues(...value.normal),
        }), indices, shader);
    }
}

export class Triangle extends Mesh {
    constructor(shader: Shader) {
        const verticies = [
            {position: vec3.fromValues(-0.5, -0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
            {position: vec3.fromValues( 0.5, -0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
            {position: vec3.fromValues( 0.0,  0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
        ];
        const indicies = [0, 1, 2];
        super(verticies, indicies, shader);
    }
}