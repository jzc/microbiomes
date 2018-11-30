export function randomNormal(mean: number, std: number) {
    let s = 0;
    for (let i = 0; i < 12; i++) {
        s += Math.random();
    }
    return std*(s-6)+mean;
}

export function randomPoisson(lambda: number) {
    let l = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
        k++;
        p *= Math.random();
    } while(p > l);
    return k-1;
}