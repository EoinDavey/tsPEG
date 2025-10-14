import { PosInfo } from './parser.gen';

export interface Visitor<T> {
    visitGrammar(grammar: Grammar): T;
    visitRule(rule: Rule): T;
    visitMatchDisjunction(disjunction: MatchDisjunction): T;
    visitMatchSequence(sequence: MatchSequence): T;
    visitMatchSpec(spec: MatchSpec): T;
    visitComputedAttribute(attribute: ComputedAttribute): T;

    // For the MatchExpression union
    visitRuleReference(expr: RuleReference): T;
    visitRegexLiteral(expr: RegexLiteral): T;
    visitSpecialMatch(expr: SpecialMatch): T;
    visitPostfixExpression(expr: PostfixExpression): T;
    visitPrefixExpression(expr: PrefixExpression): T;
    visitSubExpression(expr: SubExpression): T;
    visitEOFMatch(expr: EOFMatch): T;
}

// The root of the semantic model
export class Grammar {
    constructor(
        public rules: Rule[],
        public header: string | null,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitGrammar(this);
    }
}

// Rule := name ':=' MatchDisjunction
export class Rule {
    constructor(
        public name: string,
        public definition: MatchDisjunction,
        public pos: PosInfo,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitRule(this);
    }
}

// MatchDisjunction := MatchSequence ('|' MatchSequence)*
export class MatchDisjunction {
    constructor(public alternatives: MatchSequence[]) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitMatchDisjunction(this);
    }
}

// MatchSequence := MatchSpec+ ComputedAttribute*
export class MatchSequence {
    constructor(
        public name: string,
        public matches: MatchSpec[],
        public attributes: ComputedAttribute[],
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitMatchSequence(this);
    }
}

// ComputedAttribute := '.' name '=' type code
export class ComputedAttribute {
    constructor(
        public name: string,
        public type: string,
        public code: string,
        public pos: PosInfo,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitComputedAttribute(this);
    }
}

// MatchSpec := name? '=' MatchExpression
export class MatchSpec {
    constructor(
        public name: string | null,
        public expression: MatchExpression,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitMatchSpec(this);
    }
}

// Discriminated union for all match expression variants
export type MatchExpression =
    | RuleReference
    | RegexLiteral
    | SpecialMatch
    | PostfixExpression
    | PrefixExpression
    | SubExpression
    | EOFMatch;

export enum MatchExpressionKind {
    RuleReference,
    RegexLiteral,
    SpecialMatch,
    PostfixExpression,
    PrefixExpression,
    SubExpression,
    EOFMatch,
}

// e.g., anotherRule
export class RuleReference {
    readonly kind = MatchExpressionKind.RuleReference;
    constructor(public name: string, public pos: PosInfo) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitRuleReference(this);
    }
}

// e.g., '...'
export class RegexLiteral {
    readonly kind = MatchExpressionKind.RegexLiteral;
    constructor(public value: string, public mods: string, public pos: PosInfo) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitRegexLiteral(this);
    }
}

// e.g., @
export class SpecialMatch {
    readonly kind = MatchExpressionKind.SpecialMatch;
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitSpecialMatch(this);
    }
}

export enum PostfixOpKind {
    Star,      // *
    Plus,      // +
    Optional,  // ?
    Range,     // [n,m]
}

export type PostfixOp =
    | { kind: PostfixOpKind.Star }
    | { kind: PostfixOpKind.Plus }
    | { kind: PostfixOpKind.Optional }
    | { kind: PostfixOpKind.Range, min: number, max?: number };

// e.g., expr*, expr+, expr?, expr[n,m]
export class PostfixExpression {
    readonly kind = MatchExpressionKind.PostfixExpression;
    constructor(
        public expression: MatchExpression,
        public op: PostfixOp,
        public pos?: PosInfo,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitPostfixExpression(this);
    }
}

export type PrefixOperator = '&' | '!';

// e.g., &expr, !expr
export class PrefixExpression {
    readonly kind = MatchExpressionKind.PrefixExpression;
    constructor(
        public expression: MatchExpression,
        public operator: PrefixOperator,
        public pos: PosInfo,
    ) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitPrefixExpression(this);
    }
}

// e.g., { ... }
export class SubExpression {
    readonly kind = MatchExpressionKind.SubExpression;
    constructor(public name: string, public disjunction: MatchDisjunction) {}
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitSubExpression(this);
    }
}

// e.g., $
export class EOFMatch {
    readonly kind = MatchExpressionKind.EOFMatch;
    accept<T>(visitor: Visitor<T>): T {
        return visitor.visitEOFMatch(this);
    }
}
