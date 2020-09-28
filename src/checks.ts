import { PosInfo } from "./meta";
import { Grammar } from "./util";

export class CheckError extends Error {
    constructor(public s: string, public pos: PosInfo) {
        super(s);
        this.name = "CheckError";
        this.message = `Error at line ${pos.line}:${pos.offset}: ${s}`;
    }
}

export interface Checker {
    Check(g: Grammar, input: string): CheckError | null;
}

const bannedNames: Set<string> = new Set(['kind']);
export const BannedNamesChecker: Checker = {
    Check: (g: Grammar): CheckError | null => {
        for(const ruledef of g) {
            for(const alt of ruledef.rule) {
                for(const matchspec of alt.matches) {
                    if(!matchspec.named)
                        continue;
                    if(bannedNames.has(matchspec.named.name))
                        return new CheckError(`'${matchspec.named.name}' is not` +
                            ' an allowed match name', matchspec.named.start);
                }
            }
        }
        return null;
    },
};
