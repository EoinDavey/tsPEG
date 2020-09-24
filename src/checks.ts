import { PosInfo } from "./meta";

export class CheckError extends Error {
    constructor(public s: string, public pos: PosInfo) {
        super(s);
        this.name = "CheckError";
        this.message = `Error at line ${pos.line}:${pos.offset}: ${s}`;
    }
}
