import * as ast from './parser.gen';
import * as model from './model';

export class ModelBuilder {
    private input: string;

    constructor(input: string) {
        this.input = input;
    }

    public build(grammarAst: ast.GRAM): model.Grammar {
        const rules = grammarAst.rules.map(ruleDef => this.buildRule(ruleDef));
        const header = grammarAst.header ? grammarAst.header.content : null;
        return new model.Grammar(rules, header);
    }

    private buildRule(ruleDef: ast.RULEDEF): model.Rule {
        const definition = this.buildMatchDisjunction(ruleDef.rule, ruleDef.name, ruleDef.name);
        return new model.Rule(ruleDef.name, definition, ruleDef.namestart);
    }

    private buildMatchDisjunction(rule: ast.RULE, parentName: string, namingParent: string): model.MatchDisjunction {
        let subExprCounter = 0;
        const getSubExprId = () => subExprCounter++;

        const alternatives = rule.list.map((alt, i) => {
            const altName = rule.list.length === 1 ? parentName : `${parentName}_${i + 1}`;
            return this.buildMatchSequence(alt, altName, namingParent, getSubExprId);
        });
        return new model.MatchDisjunction(alternatives);
    }

    private buildMatchSequence(alt: ast.ALT, name: string, namingParent: string, getSubExprId: () => number): model.MatchSequence {
        const matches = alt.matches.map(matchSpec => this.buildMatchSpec(matchSpec, namingParent, getSubExprId));
        const attributes = alt.attrs.map(attr => this.buildComputedAttribute(attr));
        return new model.MatchSequence(name, matches, attributes);
    }

    private buildComputedAttribute(attr: ast.ATTR): model.ComputedAttribute {
        const type = this.getOriginalText(attr.type);
        const code = this.getOriginalText(attr.code);
        return new model.ComputedAttribute(attr.name, type, code, attr.type.start);
    }

    private buildMatchSpec(matchSpec: ast.MATCHSPEC, namingParent: string, getSubExprId: () => number): model.MatchSpec {
        const name = matchSpec.named ? matchSpec.named.name : null;
        const expression = this.buildMatchExpression(matchSpec.rule, namingParent, getSubExprId);
        return new model.MatchSpec(name, expression);
    }

    private buildMatchExpression(match: ast.MATCH, namingParent: string, getSubExprId: () => number): model.MatchExpression {
        if (match.kind === ast.ASTKinds.SPECIAL) {
            return new model.SpecialMatch();
        }

        const postop = match;
        const preExpression = this.buildPrefixExpression(postop.pre, namingParent, getSubExprId);

        if (!postop.op) {
            return preExpression;
        }

        let op: model.PostfixOp;

        if (postop.op.kind === ast.ASTKinds.POSTOP_$0_1) {
            switch (postop.op.op) {
                case '*':
                    op = { kind: model.PostfixOpKind.Star };
                    break;
                case '+':
                    op = { kind: model.PostfixOpKind.Plus };
                    break;
                case '?':
                    op = { kind: model.PostfixOpKind.Optional };
                    break;
                default:
                    throw new Error(`Unexpected postfix operator: ${postop.op.op}`);
            }
        } else { // RANGESPEC
            op = {
                kind: model.PostfixOpKind.Range,
                min: postop.op.lb,
                max: postop.op.ub === -1 ? undefined : postop.op.ub,
            };
        }

        return new model.PostfixExpression(preExpression, op, postop.pre.start);
    }

    private buildPrefixExpression(preop: ast.PREOP, namingParent: string, getSubExprId: () => number): model.MatchExpression {
        const atomExpression = this.buildAtom(preop.at, namingParent, getSubExprId);

        if (!preop.op) {
            return atomExpression;
        }

        return new model.PrefixExpression(atomExpression, preop.op as model.PrefixOperator, preop.start);
    }

    private buildAtom(atom: ast.ATOM, namingParent: string, getSubExprId: () => number): model.MatchExpression {
        switch (atom.kind) {
            case ast.ASTKinds.ATOM_1: // RuleReference
                return new model.RuleReference(atom.name, atom.start);
            case ast.ASTKinds.ATOM_2: // RegexLiteral
                return new model.RegexLiteral(atom.match.val, atom.match.mods, atom.match.start);
            case ast.ASTKinds.ATOM_3: {
                const subExprName = `${namingParent}_$${getSubExprId()}`;
                // For the recursion, the new naming parent is the name we just generated.
                // This will create a new counter scope.
                const disjunction = this.buildMatchDisjunction(atom.sub, subExprName, subExprName);
                return new model.SubExpression(subExprName, disjunction);
            }
            case ast.ASTKinds.EOF: // EOF
                return new model.EOFMatch();
        }
    }

    private getOriginalText(node: { start: ast.PosInfo, end: ast.PosInfo }): string {
        return this.input.substring(node.start.overallPos, node.end.overallPos);
    }
}