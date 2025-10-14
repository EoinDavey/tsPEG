import {
    ComputedAttribute, EOFMatch, Grammar, MatchDisjunction, MatchSequence, MatchSpec,
    PostfixExpression, PrefixExpression, RegexLiteral, Rule, RuleReference,
    SpecialMatch, SubExpression, Visitor,
} from './model';

// This interface represents a single item in the "expanded" grammar view.
export interface ExpandedItem {
    name: string;
    sequence: MatchSequence;
    type: 'alias' | 'interface' | 'class';
}

// This visitor walks the grammar and produces a flat list of all
// items that need a type definition in the generated code.
export class ExpansionVisitor implements Visitor<void> {
    public readonly items: ExpandedItem[] = [];

    private determineSequenceType(sequence: MatchSequence): 'alias' | 'interface' | 'class' {
        if (sequence.attributes.length > 0) {
            return 'class';
        }

        const hasNamedMatch = sequence.matches.some(m => m.name !== null);

        if (!hasNamedMatch && sequence.matches.length === 1) {
            return 'alias';
        }

        return 'interface';
    }

    // Visitor methods
    visitGrammar(grammar: Grammar): void {
        grammar.rules.forEach(r => r.accept(this));
    }
    visitRule(rule: Rule): void {
        rule.definition.accept(this);
    }
    visitMatchDisjunction(disjunction: MatchDisjunction): void {
        disjunction.alternatives.forEach(a => a.accept(this));
    }
    visitMatchSequence(sequence: MatchSequence): void {
        this.items.push({
            name: sequence.name,
            sequence: sequence,
            type: this.determineSequenceType(sequence),
        });
        // Continue traversal
        sequence.matches.forEach(m => m.accept(this));
        sequence.attributes.forEach(a => a.accept(this));
    }
    visitMatchSpec(spec: MatchSpec): void {
        spec.expression.accept(this);
    }
    visitSubExpression(expr: SubExpression): void {
        // The builder has already named the sequences within the sub-expression's
        // disjunction. We just need to traverse into it to find them.
        expr.disjunction.accept(this);
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
