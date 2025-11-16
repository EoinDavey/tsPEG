import { atomType, matchTypeFromModel, preType } from "./types";
import { ASTKinds, ATOM, MATCH, PREOP, PosInfo } from "./parser.gen";
import { Rule, Ruledef, assertValidRegex, escapeBackticks } from "./util";
import * as model from "./model";

export function matchRule(expr: MATCH): string {
    // Check if special rule
    if (expr.kind === ASTKinds.SPECIAL)
        return "this.mark()";
    if (expr.op === null)
        return preRule(expr.pre);
    if (expr.op.kind === ASTKinds.RANGESPEC)
        return `this.loop<${preType(expr.pre)}>(() => ${preRule(expr.pre)}, ${expr.op.lb}, ${expr.op.ub})`;
    if (expr.op.kind === ASTKinds.POSTOP_$0_1 && expr.op.op === "*")
        return `this.loop<${preType(expr.pre)}>(() => ${preRule(expr.pre)}, 0, -1)`;
    if (expr.op.kind === ASTKinds.POSTOP_$0_1 && expr.op.op === "+")
        return `this.loopPlus<${preType(expr.pre)}>(() => ${preRule(expr.pre)})`;
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
    if(at.kind === ASTKinds.EOF)
        return 'this.match$EOF($$cr)';
    if (at.kind === ASTKinds.ATOM_2) {
        // Ensure the regex is valid
        const mtch = at.match;
        assertValidRegex(mtch.val);
        const reg = "(?:" + mtch.val + ")";
        return `this.regexAccept(String.raw\`${escapeBackticks(reg)}\`, "${mtch.mods}", $$dpth + 1, $$cr)`;
    }
    const subname = at.name;
    if (subname)
        return `this.match${subname}($$dpth + 1, $$cr)`;
    return "ERR";
}

export function matchRuleFromModel(expr: model.MatchExpression): string {
    switch (expr.kind) {
        case model.MatchExpressionKind.SpecialMatch:
            return "this.mark()";
        case model.MatchExpressionKind.PostfixExpression: {
            const innerRule = preRuleFromModel(expr.expression);
            switch (expr.op.kind) {
                case model.PostfixOpKind.Range:
                    return `this.loop<${matchTypeFromModel(expr.expression)}>(() => ${innerRule}, ${expr.op.min}, ${expr.op.max ?? -1})`;
                case model.PostfixOpKind.Star:
                    return `this.loop<${matchTypeFromModel(expr.expression)}>(() => ${innerRule}, 0, -1)`;
                case model.PostfixOpKind.Plus:
                    return `this.loopPlus<${matchTypeFromModel(expr.expression)}>(() => ${innerRule})`;
                case model.PostfixOpKind.Optional:
                    return innerRule; // Optionality handled by type system, no change in rule generation
            }
            break;
        }
        case model.MatchExpressionKind.PrefixExpression:
            return preRuleFromModel(expr);
        default:
            return atomRuleFromModel(expr);
    }
}

export function preRuleFromModel(expr: model.MatchExpression): string {
    if (expr.kind === model.MatchExpressionKind.PrefixExpression) {
        if (expr.operator === "&")
            return `this.noConsume<${matchTypeFromModel(expr.expression)}>(() => ${atomRuleFromModel(expr.expression)})`;
        if (expr.operator === "!")
            return `this.negate(() => ${atomRuleFromModel(expr.expression)})`;
    }
    return atomRuleFromModel(expr);
}

export function atomRuleFromModel(expr: model.MatchExpression): string {
    switch (expr.kind) {
        case model.MatchExpressionKind.RuleReference:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case model.MatchExpressionKind.EOFMatch:
            return 'this.match$EOF($$cr)';
        case model.MatchExpressionKind.RegexLiteral: {
            assertValidRegex(expr.value);
            const reg = "(?:" + expr.value + ")";
            return `this.regexAccept(String.raw\`${escapeBackticks(reg)}\`, "${expr.mods}", $$dpth + 1, $$cr)`;
        }
        case model.MatchExpressionKind.SubExpression:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case model.MatchExpressionKind.SpecialMatch:
            return `this.mark()`;
        default:
            throw new Error(`Unknown atom rule type: ${expr.kind}`);
    }
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
