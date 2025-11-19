import {
    ComputedAttribute, EOFMatch, Grammar, MatchDisjunction, MatchSequence, MatchSpec,
    PostfixExpression, PrefixExpression, RegexLiteral, Rule, RuleReference,
    SpecialMatch, SubExpression, Visitor,
} from './model';

// This visitor walks the grammar and produces a flat list of all
// rules and sub-rules, analogous to the old `expandedGram` structure.
export class ExpansionVisitor implements Visitor<void> {
    public readonly rules: Rule[] = [];

    visitGrammar(grammar: Grammar): void {
        grammar.rules.forEach(r => r.accept(this));
    }

    visitRule(rule: Rule): void {
        // Add the top-level rule to our list
        this.rules.push(rule);
        // Continue traversal to find sub-expressions within this rule
        rule.definition.accept(this);
    }

    visitSubExpression(expr: SubExpression): void {
        // Create a new Rule object from the SubExpression's properties
        const rule = new Rule(expr.name, expr.disjunction, expr.pos);
        // Add the new pseudo-rule to our list
        this.rules.push(rule);
        // Continue traversal to find nested sub-expressions
        expr.disjunction.accept(this);
    }

    // Default traversal for non-rule-like nodes
    visitMatchDisjunction(disjunction: MatchDisjunction): void {
        disjunction.alternatives.forEach(a => a.accept(this));
    }
    visitMatchSequence(sequence: MatchSequence): void {
        sequence.matches.forEach(m => m.accept(this));
    }
    visitMatchSpec(spec: MatchSpec): void {
        spec.expression.accept(this);
    }
    visitPostfixExpression(expr: PostfixExpression): void {
        expr.expression.accept(this);
    }
    visitPrefixExpression(expr: PrefixExpression): void {
        expr.expression.accept(this);
    }

    // Leaf nodes - no traversal needed
    visitComputedAttribute(_attribute: ComputedAttribute): void {}
    visitRuleReference(_expr: RuleReference): void {}
    visitRegexLiteral(_expr: RegexLiteral): void {}
    visitSpecialMatch(_expr: SpecialMatch): void {}
    visitEOFMatch(_expr: EOFMatch): void {}
}