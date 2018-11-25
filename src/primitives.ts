import { Mesh } from "./mesh"
import { colorShader } from "./shader"

export class Cube extends Mesh {
    constructor() {
        const verticies = [
            // front 
            {position: [-1, -1,  1], normal: [ 0,  0,  1], color: [0, 0, 0.75]},
            {position: [ 1, -1,  1], normal: [ 0,  0,  1], color: [0, 0, 0.75]},
            {position: [ 1,  1,  1], normal: [ 0,  0,  1], color: [0, 0, 0.75]},
            {position: [-1,  1,  1], normal: [ 0,  0,  1], color: [0, 0, 0.75]},
            // back
            {position: [-1, -1, -1], normal: [ 0,  0, -1], color: [0, 0, 0.75]},
            {position: [-1,  1, -1], normal: [ 0,  0, -1], color: [0, 0, 0.75]},
            {position: [ 1,  1, -1], normal: [ 0,  0, -1], color: [0, 0, 0.75]},
            {position: [ 1, -1, -1], normal: [ 0,  0, -1], color: [0, 0, 0.75]},
            //top
            {position: [-1,  1, -1], normal: [ 0,  1,  0], color: [0, 0, 0.75]}, 
            {position: [-1,  1,  1], normal: [ 0,  1,  0], color: [0, 0, 0.75]}, 
            {position: [ 1,  1,  1], normal: [ 0,  1,  0], color: [0, 0, 0.75]}, 
            {position: [ 1,  1, -1], normal: [ 0,  1,  0], color: [0, 0, 0.75]}, 
            //bottom
            {position: [-1, -1, -1], normal: [ 0, -1,  0], color: [0, 0, 0.75]}, 
            {position: [ 1, -1, -1], normal: [ 0, -1,  0], color: [0, 0, 0.75]}, 
            {position: [ 1, -1,  1], normal: [ 0, -1,  0], color: [0, 0, 0.75]}, 
            {position: [-1, -1,  1], normal: [ 0, -1,  0], color: [0, 0, 0.75]}, 
            //right
            {position: [ 1, -1, -1], normal: [ 1,  0,  0], color: [0, 0, 0.75]},
            {position: [ 1,  1, -1], normal: [ 1,  0,  0], color: [0, 0, 0.75]},
            {position: [ 1,  1,  1], normal: [ 1,  0,  0], color: [0, 0, 0.75]},
            {position: [ 1, -1,  1], normal: [ 1,  0,  0], color: [0, 0, 0.75]},
            //left
            {position: [-1, -1, -1], normal: [-1,  0,  0], color: [0, 0, 0.75]},
            {position: [-1, -1,  1], normal: [-1,  0,  0], color: [0, 0, 0.75]},
            {position: [-1,  1,  1], normal: [-1,  0,  0], color: [0, 0, 0.75]},
            {position: [-1,  1, -1], normal: [-1,  0,  0], color: [0, 0, 0.75]},
        ];

        const indices = [
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23,   // left
        ];
        
        super(verticies.map(v => v.position.concat(v.normal).concat(v.color)), indices, colorShader);
    }
}

// export class Triangle extends Mesh {
//     constructor(shader: Shader) {
//         const verticies = [
//             {position: vec3.fromValues(-0.5, -0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
//             {position: vec3.fromValues( 0.5, -0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
//             {position: vec3.fromValues( 0.0,  0.5, 0.0), normal: vec3.fromValues(0, 0, 1)},
//         ];
//         const indicies = [0, 1, 2];
//         super(verticies, indicies, shader);
//     }
// }