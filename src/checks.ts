import { ASTKinds, PosInfo } from "./meta";
import { Grammar, altNames } from "./util";

// TODO Support returning multiple CheckErrors

export class CheckError extends Error {
    constructor(public s: string, public pos?: PosInfo) {
        super(s);
        this.name = "CheckError";
        this.message = pos
            ? `Error at line ${pos.line}:${pos.offset}: ${s}`
            : `Error: ${s}`;
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

// Check that all referenced rule name exist
export const RulesExistChecker: Checker = {
    Check: (g: Grammar): CheckError | null => {
        const ruleNames: Set<string> = new Set();
        for(const ruledef of g)
            ruleNames.add(ruledef.name);
        for(const ruledef of g) {
            for(const alt of ruledef.rule) {
                for(const match of alt.matches) {
                    if(match.rule.kind === ASTKinds.SPECIAL)
                        continue;
                    const at = match.rule.pre.at;
                    if(at.kind !== ASTKinds.ATOM_1)
                        continue;
                    if(!ruleNames.has(at.name))
                        return new CheckError(`'Rule '${at.name}' is not defined`, at.start);
                }
            }
        }
        return null;
    },
};

// get the correct rule collision name error, based on the
// name of the rule, if the rule is called `<rule>_<N>`, then
// we know that this is a collision of rule names and alternative names
// (It is possible that this could be triggered falsely, but they would
// have to declare >= 2 rules, both called `<rule>_<N>`, for same N,
// which I don't worry about
function ruleCollisionNameErr(ruleName: string) : CheckError {
    const match = ruleName.match(/^(.*)_([0-9])+$/);
    if(match === null)
        return new CheckError(`Rule already defined: "${ruleName}"`);
    const baseRule = match[1];
    const index = match[2];
    return new CheckError(`Rule "${baseRule}" declared with >= ${index} alternatives and rule "${ruleName}" should not both be declared`);
}

export const NoRuleNameCollisionChecker: Checker = {
    Check: (g: Grammar): CheckError | null => {
        const seen: Set<string> = new Set();
        for(const ruledef of g) {
            if(seen.has(ruledef.name))
                return ruleCollisionNameErr(ruledef.name);

            // Stop after adding ruledef.name if === 1 alternative
            // as altNames(ruledef) will only contain ruledef.name
            seen.add(ruledef.name);
            if(ruledef.rule.length === 1)
                continue;
            for(const name of altNames(ruledef)) {
                if(seen.has(name))
                    return ruleCollisionNameErr(ruledef.name);
                seen.add(name);
            }
        }
        return null;
    },
};

const keywords: string[] = [
    "break", "case", "catch", "class", "const", "continue", "debugger",
    "default", "delete", "do", "else", "enum", "export", "extends",
    "false", "finally", "for", "function", "if", "import", "in",
    "instanceof", "new", "null", "return", "super", "switch", "this",
    "throw", "true", "try", "typeof", "var", "void", "while", "with",
    "as", "implements", "interface", "let", "package", "private",
    "protected", "public", "static", "yield",
    "any", "boolean", "constructor", "declare", "get", "module",
    "require", "number", "set", "string", "symbol", "type", "from", "of",
];
export const NoKeywords: Checker = {
    Check: (g: Grammar): CheckError | null => {
        for(const ruledef of g){
            if(keywords.includes(ruledef.name)){
                return new CheckError(`Rule name "${ruledef.name}" is a reserved Typescript keyword`, ruledef.pos);
            }
        }
        return null;
    },
};
