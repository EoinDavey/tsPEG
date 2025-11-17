import { PosInfo } from "./parser.gen";
import * as model from './model';
import { SimpleVisitor } from "./simplevisitor";

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
    Check(g: model.Grammar, input: string): CheckError | null;
}

const bannedNames: Set<string> = new Set(['kind']);

class BannedNamesVisitor extends SimpleVisitor {
    private error: CheckError | null = null;

    public getError(): CheckError | null {
        return this.error;
    }

    visitMatchSpec(spec: model.MatchSpec): void {
        if (spec.name && bannedNames.has(spec.name)) {
            this.error = new CheckError(`'${spec.name}' is not an allowed match name`);
        }
    }
}

export const BannedNamesChecker: Checker = {
    Check: (g: model.Grammar): CheckError | null => {
        const visitor = new BannedNamesVisitor();
        g.accept(visitor);
        return visitor.getError();
    },
};

class RuleNameCollectorVisitor extends SimpleVisitor {
    public ruleNames: Set<string> = new Set();

    visitRule(rule: model.Rule): void {
        this.ruleNames.add(rule.name);
        // Also visit sub-expressions which are effectively rules
        super.visitRule(rule);
    }

    visitSubExpression(expr: model.SubExpression): void {
        this.ruleNames.add(expr.name);
        super.visitSubExpression(expr);
    }
}

class RuleReferenceCheckerVisitor extends SimpleVisitor {
    private error: CheckError | null = null;

    constructor(private ruleNames: Set<string>) {
        super();
    }

    public getError(): CheckError | null {
        return this.error;
    }

    visitRuleReference(expr: model.RuleReference): void {
        if (!this.ruleNames.has(expr.name)) {
            this.error = new CheckError(`'Rule '${expr.name}' is not defined`, expr.pos);
        }
    }
}

// Check that all referenced rule name exist
export const RulesExistChecker: Checker = {
    Check: (g: model.Grammar): CheckError | null => {
        const nameCollector = new RuleNameCollectorVisitor();
        g.accept(nameCollector);

        const referenceChecker = new RuleReferenceCheckerVisitor(nameCollector.ruleNames);
        g.accept(referenceChecker);

        return referenceChecker.getError();
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

class NameCollisionVisitor extends SimpleVisitor {
    private seen = new Set<string>();
    private error: CheckError | null = null;

    public getError(): CheckError | null {
        return this.error;
    }

    visitRule(rule: model.Rule): void {
        if (this.error) return;

        if (rule.definition.alternatives.length > 1) {
            if (this.seen.has(rule.name)) {
                this.error = ruleCollisionNameErr(rule.name);
                return;
            }
            this.seen.add(rule.name);
            super.visitRule(rule);
        } else {
            rule.definition.accept(this);
        }
    }

    visitMatchSequence(sequence: model.MatchSequence): void {
        if (this.error) return;
        if (this.seen.has(sequence.name)) {
            this.error = ruleCollisionNameErr(sequence.name);
            return;
        }
        this.seen.add(sequence.name);
        super.visitMatchSequence(sequence);
    }
    
    visitSubExpression(expr: model.SubExpression): void {
        if (this.error) return;

        if (expr.disjunction.alternatives.length > 1) {
            if (this.seen.has(expr.name)) {
                this.error = ruleCollisionNameErr(expr.name);
                return;
            }
            this.seen.add(expr.name);
            super.visitSubExpression(expr);
        } else {
            expr.disjunction.accept(this);
        }
    }
}

export const NoRuleNameCollisionChecker: Checker = {
    Check: (g: model.Grammar): CheckError | null => {
        const visitor = new NameCollisionVisitor();
        g.accept(visitor);
        return visitor.getError();
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
    "object",
];
class NoKeywordsVisitor extends SimpleVisitor {
    private error: CheckError | null = null;

    public getError(): CheckError | null {
        return this.error;
    }

    visitRule(rule: model.Rule): void {
        if (keywords.includes(rule.name)) {
            this.error = new CheckError(`Rule name "${rule.name}" is a reserved Typescript keyword`, rule.pos);
        }
        // Don't descend, we only care about top-level rule names
    }
}

export const NoKeywords: Checker = {
    Check: (g: model.Grammar): CheckError | null => {
        const visitor = new NoKeywordsVisitor();
        g.accept(visitor);
        return visitor.getError();
    },
};
