import { atomType, preType } from "./types";
import { ASTKinds, ATOM, MATCH, PREOP, PosInfo } from "./meta";
import { Rule, Ruledef, assertValidRegex, escapeBackticks } from "./util";

export function matchRule(expr: MATCH): string {
    // Check if special rule
    if (expr.kind === ASTKinds.SPECIAL)
        return "this.mark()";
    if (expr.op && expr.op !== "?")
        return `this.loop<${preType(expr.pre)}>(() => ${preRule(expr.pre)}, ${expr.op === "+" ? "false" : "true"})`;
    return preRule(expr.pre);
}

export function preRule(expr: PREOP): string {
    if (expr.op && expr.op === "&")
        return `this.noConsume<${atomType(expr.at)}>(() => ${atomRule(expr.at)})`;
    if (expr.op && expr.op === "!")
        return `this.negate(() => ${atomRule(expr.at)})`;
    return atomRule(expr.at);
}

export function atomRule(at: ATOM): string {
    if (at.kind === ASTKinds.ATOM_1)
        return `this.match${at.name}($$dpth + 1, $$cr)`;
    if (at.kind === ASTKinds.ATOM_2) {
        // Ensure the regex is valid
        const mtch = at.match;
        assertValidRegex(mtch.val);
        const reg = "(?:" + mtch.val + ")";
        return `this.regexAccept(String.raw\`${escapeBackticks(reg)}\`, $$dpth + 1, $$cr)`;
    }
    const subname = at.name;
    if (subname)
        return `this.match${subname}($$dpth + 1, $$cr)`;
    return "ERR";
}

// extractRule does a traversal of the AST assigning names to
// subrules. It takes subrules and assigns
// them their own Ruledef in the grammar, effectively flattening the
// structure of the grammar.
export function extractRules(rule: Rule, name: string, pos?: PosInfo): Ruledef[] {
    let cnt = 0;
    const rules: Ruledef[] = [{name, rule, pos}];
    for (const alt of rule) {
        for (const match of alt.matches) {
            // Check if special rule
            if(match.rule.kind === ASTKinds.SPECIAL)
                continue;
            // Check if not a subrule
            const at = match.rule.pre.at;
            if (at === null || at.kind !== ASTKinds.ATOM_3)
                continue;
            const subrule = at.sub;
            const nm = `${name}_$${cnt}`;
            at.name = nm;
            const rdfs = extractRules(subrule.list, nm);
            rules.push(...rdfs);
            ++cnt;
        }
    }
    return rules;
}
