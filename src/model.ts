import { PosInfo } from './parser.gen';

// The root of the semantic model
export class Grammar {
    constructor(
        public rules: Rule[],
        public header: string | null,
    ) {}
}

// Rule := name ':=' MatchDisjunction
export class Rule {
    constructor(
        public name: string,
        public definition: MatchDisjunction,
        public pos: PosInfo,
    ) {}
}

// MatchDisjunction := MatchSequence ('|' MatchSequence)*
export class MatchDisjunction {
    constructor(public alternatives: MatchSequence[]) {}
}

// MatchSequence := MatchSpec+ ComputedAttribute*
export class MatchSequence {
    constructor(
        public matches: MatchSpec[],
        public attributes: ComputedAttribute[],
    ) {}
}

// ComputedAttribute := '.' name '=' type code
export class ComputedAttribute {
    constructor(
        public name: string,
        public type: string,
        public code: string,
        public pos: PosInfo,
    ) {}
}

// MatchSpec := name? '=' MatchExpression
export class MatchSpec {
    constructor(
        public name: string | null,
        public expression: MatchExpression,
    ) {}
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
}

// e.g., '...'
export class RegexLiteral {
    readonly kind = MatchExpressionKind.RegexLiteral;
    constructor(public value: string, public mods: string, public pos: PosInfo) {}
}

// e.g., @
export class SpecialMatch {
    readonly kind = MatchExpressionKind.SpecialMatch;
    constructor() {}
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
}

// e.g., { ... }
export class SubExpression {
    readonly kind = MatchExpressionKind.SubExpression;
    constructor(public disjunction: MatchDisjunction) {}
}

// e.g., $
export class EOFMatch {
    readonly kind = MatchExpressionKind.EOFMatch;
    constructor() {}
}
