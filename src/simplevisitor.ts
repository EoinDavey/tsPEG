import {
    ComputedAttribute, EOFMatch, Grammar, MatchDisjunction, MatchSequence, MatchSpec,
    PostfixExpression, PrefixExpression, RegexLiteral, Rule, RuleReference,
    SpecialMatch, SubExpression, Visitor,
} from './model';

export abstract class SimpleVisitor implements Visitor<void> {
    visitGrammar(grammar: Grammar): void {
        for (const rule of grammar.rules) {
            rule.accept(this);
        }
    }
    visitRule(rule: Rule): void {
        rule.definition.accept(this);
    }
    visitMatchDisjunction(disjunction: MatchDisjunction): void {
        for (const alt of disjunction.alternatives) {
            alt.accept(this);
        }
    }
    visitMatchSequence(sequence: MatchSequence): void {
        for (const matchSpec of sequence.matches) {
            matchSpec.accept(this);
        }
        for (const attribute of sequence.attributes) {
            attribute.accept(this);
        }
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
    visitSubExpression(expr: SubExpression): void {
        expr.disjunction.accept(this);
    }

    // Leaf nodes
    visitComputedAttribute(_attribute: ComputedAttribute): void {}
    visitRuleReference(_expr: RuleReference): void {}
    visitRegexLiteral(_expr: RegexLiteral): void {}
    visitSpecialMatch(_expr: SpecialMatch): void {}
    visitEOFMatch(_expr: EOFMatch): void {}
}