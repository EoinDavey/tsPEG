/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* Program    := Melody* _
* Melody     := _ 'melody' _ KID {_ KID}* _ 'start'
*                 Stmt*
*             _ 'end'
* Stmt       := KeyStmt | AssignStmt | ForStmt | IfStmt
* KeyStmt    := _ Funcs _ Expr
* AssignStmt := _ KID _ '=' _ Expr
* ForStmt    := _ 'for' _ KID _ 'from' _ Expr _ 'to' _ Expr
*                  Stmt*
*             _ 'end'
* IfStmt     := _ 'if' _ Expr _ 'then'
*                  Stmt*
*                { _ 'end' | _ 'else' Stmt* _ 'end' }
* FuncExpr   := Expr { _ Expr ' '* !'\n' }*
* Expr       := Eq
* Eq         := _ Comp { _ '==' Comp }*
* Comp       := _ Sum { _ Compare _ Sum }*
* Sum        := _ Product { _ PlusMinus _ Product }*
* Product    := _ Atom { _ MulDiv _ Atom }*
* Atom       := NoteLit | KID | INT | '\('  FuncExpr _ '\)'
* PlusMinus  := '\+' | '-'
* MulDiv     := '\*' | '\/' | '%'
* Compare    := '<=' | '>=' | '<' | '>'
* NoteLit    := '[A-G][#b]?\d'
* INT := '[0-9]+'
* Keyword := 'start' | 'end' | 'for' | 'else' | 'if' | 'then'
* Funcs   := 'play' | 'wait'
* KID := !Keyword ID
* ID := '[a-zA-Z_]+'
* _ := '\s'*
*/
type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    Program = "Program",
    Melody = "Melody",
    Melody_$0 = "Melody_$0",
    Stmt_1 = "Stmt_1",
    Stmt_2 = "Stmt_2",
    Stmt_3 = "Stmt_3",
    Stmt_4 = "Stmt_4",
    KeyStmt = "KeyStmt",
    AssignStmt = "AssignStmt",
    ForStmt = "ForStmt",
    IfStmt = "IfStmt",
    IfStmt_$0_1 = "IfStmt_$0_1",
    IfStmt_$0_2 = "IfStmt_$0_2",
    FuncExpr = "FuncExpr",
    FuncExpr_$0 = "FuncExpr_$0",
    Expr = "Expr",
    Eq = "Eq",
    Eq_$0 = "Eq_$0",
    Comp = "Comp",
    Comp_$0 = "Comp_$0",
    Sum = "Sum",
    Sum_$0 = "Sum_$0",
    Product = "Product",
    Product_$0 = "Product_$0",
    Atom_1 = "Atom_1",
    Atom_2 = "Atom_2",
    Atom_3 = "Atom_3",
    Atom_4 = "Atom_4",
    PlusMinus_1 = "PlusMinus_1",
    PlusMinus_2 = "PlusMinus_2",
    MulDiv_1 = "MulDiv_1",
    MulDiv_2 = "MulDiv_2",
    MulDiv_3 = "MulDiv_3",
    Compare_1 = "Compare_1",
    Compare_2 = "Compare_2",
    Compare_3 = "Compare_3",
    Compare_4 = "Compare_4",
    NoteLit = "NoteLit",
    INT = "INT",
    Keyword_1 = "Keyword_1",
    Keyword_2 = "Keyword_2",
    Keyword_3 = "Keyword_3",
    Keyword_4 = "Keyword_4",
    Keyword_5 = "Keyword_5",
    Keyword_6 = "Keyword_6",
    Funcs_1 = "Funcs_1",
    Funcs_2 = "Funcs_2",
    KID = "KID",
    ID = "ID",
    _ = "_",
}
export interface Program {
    kind: ASTKinds.Program;
}
export interface Melody {
    kind: ASTKinds.Melody;
}
export interface Melody_$0 {
    kind: ASTKinds.Melody_$0;
}
export type Stmt = Stmt_1 | Stmt_2 | Stmt_3 | Stmt_4;
export type Stmt_1 = KeyStmt;
export type Stmt_2 = AssignStmt;
export type Stmt_3 = ForStmt;
export type Stmt_4 = IfStmt;
export interface KeyStmt {
    kind: ASTKinds.KeyStmt;
}
export interface AssignStmt {
    kind: ASTKinds.AssignStmt;
}
export interface ForStmt {
    kind: ASTKinds.ForStmt;
}
export interface IfStmt {
    kind: ASTKinds.IfStmt;
}
export type IfStmt_$0 = IfStmt_$0_1 | IfStmt_$0_2;
export interface IfStmt_$0_1 {
    kind: ASTKinds.IfStmt_$0_1;
}
export interface IfStmt_$0_2 {
    kind: ASTKinds.IfStmt_$0_2;
}
export interface FuncExpr {
    kind: ASTKinds.FuncExpr;
}
export interface FuncExpr_$0 {
    kind: ASTKinds.FuncExpr_$0;
}
export type Expr = Eq;
export interface Eq {
    kind: ASTKinds.Eq;
}
export interface Eq_$0 {
    kind: ASTKinds.Eq_$0;
}
export interface Comp {
    kind: ASTKinds.Comp;
}
export interface Comp_$0 {
    kind: ASTKinds.Comp_$0;
}
export interface Sum {
    kind: ASTKinds.Sum;
}
export interface Sum_$0 {
    kind: ASTKinds.Sum_$0;
}
export interface Product {
    kind: ASTKinds.Product;
}
export interface Product_$0 {
    kind: ASTKinds.Product_$0;
}
export type Atom = Atom_1 | Atom_2 | Atom_3 | Atom_4;
export type Atom_1 = NoteLit;
export type Atom_2 = KID;
export type Atom_3 = INT;
export interface Atom_4 {
    kind: ASTKinds.Atom_4;
}
export type PlusMinus = PlusMinus_1 | PlusMinus_2;
export type PlusMinus_1 = string;
export type PlusMinus_2 = string;
export type MulDiv = MulDiv_1 | MulDiv_2 | MulDiv_3;
export type MulDiv_1 = string;
export type MulDiv_2 = string;
export type MulDiv_3 = string;
export type Compare = Compare_1 | Compare_2 | Compare_3 | Compare_4;
export type Compare_1 = string;
export type Compare_2 = string;
export type Compare_3 = string;
export type Compare_4 = string;
export type NoteLit = string;
export type INT = string;
export type Keyword = Keyword_1 | Keyword_2 | Keyword_3 | Keyword_4 | Keyword_5 | Keyword_6;
export type Keyword_1 = string;
export type Keyword_2 = string;
export type Keyword_3 = string;
export type Keyword_4 = string;
export type Keyword_5 = string;
export type Keyword_6 = string;
export type Funcs = Funcs_1 | Funcs_2;
export type Funcs_1 = string;
export type Funcs_2 = string;
export interface KID {
    kind: ASTKinds.KID;
}
export type ID = string;
export type _ = string[];
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    constructor(input: string) {
        this.pos = {overallPos: 0, line: 1, offset: 0};
        this.input = input;
    }
    public reset(pos: PosInfo) {
        this.pos = pos;
    }
    public finished(): boolean {
        return this.pos.overallPos === this.input.length;
    }
    public matchProgram($$dpth: number, $$cr?: ErrorTracker): Nullable<Program> {
        return this.runner<Program>($$dpth,
            () => {
                let $$res: Nullable<Program> = null;
                if (true
                    && this.loop<Melody>(() => this.matchMelody($$dpth + 1, $$cr), true) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Program, };
                }
                return $$res;
            })();
    }
    public matchMelody($$dpth: number, $$cr?: ErrorTracker): Nullable<Melody> {
        return this.runner<Melody>($$dpth,
            () => {
                let $$res: Nullable<Melody> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:melody)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchKID($$dpth + 1, $$cr) !== null
                    && this.loop<Melody_$0>(() => this.matchMelody_$0($$dpth + 1, $$cr), true) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:start)`, $$dpth + 1, $$cr) !== null
                    && this.loop<Stmt>(() => this.matchStmt($$dpth + 1, $$cr), true) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:end)`, $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Melody, };
                }
                return $$res;
            })();
    }
    public matchMelody_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<Melody_$0> {
        return this.runner<Melody_$0>($$dpth,
            () => {
                let $$res: Nullable<Melody_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchKID($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Melody_$0, };
                }
                return $$res;
            })();
    }
    public matchStmt($$dpth: number, $$cr?: ErrorTracker): Nullable<Stmt> {
        return this.choice<Stmt>([
            () => this.matchStmt_1($$dpth + 1, $$cr),
            () => this.matchStmt_2($$dpth + 1, $$cr),
            () => this.matchStmt_3($$dpth + 1, $$cr),
            () => this.matchStmt_4($$dpth + 1, $$cr),
        ]);
    }
    public matchStmt_1($$dpth: number, $$cr?: ErrorTracker): Nullable<Stmt_1> {
        return this.matchKeyStmt($$dpth + 1, $$cr);
    }
    public matchStmt_2($$dpth: number, $$cr?: ErrorTracker): Nullable<Stmt_2> {
        return this.matchAssignStmt($$dpth + 1, $$cr);
    }
    public matchStmt_3($$dpth: number, $$cr?: ErrorTracker): Nullable<Stmt_3> {
        return this.matchForStmt($$dpth + 1, $$cr);
    }
    public matchStmt_4($$dpth: number, $$cr?: ErrorTracker): Nullable<Stmt_4> {
        return this.matchIfStmt($$dpth + 1, $$cr);
    }
    public matchKeyStmt($$dpth: number, $$cr?: ErrorTracker): Nullable<KeyStmt> {
        return this.runner<KeyStmt>($$dpth,
            () => {
                let $$res: Nullable<KeyStmt> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchFuncs($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.KeyStmt, };
                }
                return $$res;
            })();
    }
    public matchAssignStmt($$dpth: number, $$cr?: ErrorTracker): Nullable<AssignStmt> {
        return this.runner<AssignStmt>($$dpth,
            () => {
                let $$res: Nullable<AssignStmt> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchKID($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:=)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.AssignStmt, };
                }
                return $$res;
            })();
    }
    public matchForStmt($$dpth: number, $$cr?: ErrorTracker): Nullable<ForStmt> {
        return this.runner<ForStmt>($$dpth,
            () => {
                let $$res: Nullable<ForStmt> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:for)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchKID($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:from)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:to)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                    && this.loop<Stmt>(() => this.matchStmt($$dpth + 1, $$cr), true) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:end)`, $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.ForStmt, };
                }
                return $$res;
            })();
    }
    public matchIfStmt($$dpth: number, $$cr?: ErrorTracker): Nullable<IfStmt> {
        return this.runner<IfStmt>($$dpth,
            () => {
                let $$res: Nullable<IfStmt> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:if)`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:then)`, $$dpth + 1, $$cr) !== null
                    && this.loop<Stmt>(() => this.matchStmt($$dpth + 1, $$cr), true) !== null
                    && this.matchIfStmt_$0($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.IfStmt, };
                }
                return $$res;
            })();
    }
    public matchIfStmt_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<IfStmt_$0> {
        return this.choice<IfStmt_$0>([
            () => this.matchIfStmt_$0_1($$dpth + 1, $$cr),
            () => this.matchIfStmt_$0_2($$dpth + 1, $$cr),
        ]);
    }
    public matchIfStmt_$0_1($$dpth: number, $$cr?: ErrorTracker): Nullable<IfStmt_$0_1> {
        return this.runner<IfStmt_$0_1>($$dpth,
            () => {
                let $$res: Nullable<IfStmt_$0_1> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:end)`, $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.IfStmt_$0_1, };
                }
                return $$res;
            })();
    }
    public matchIfStmt_$0_2($$dpth: number, $$cr?: ErrorTracker): Nullable<IfStmt_$0_2> {
        return this.runner<IfStmt_$0_2>($$dpth,
            () => {
                let $$res: Nullable<IfStmt_$0_2> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:else)`, $$dpth + 1, $$cr) !== null
                    && this.loop<Stmt>(() => this.matchStmt($$dpth + 1, $$cr), true) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:end)`, $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.IfStmt_$0_2, };
                }
                return $$res;
            })();
    }
    public matchFuncExpr($$dpth: number, $$cr?: ErrorTracker): Nullable<FuncExpr> {
        return this.runner<FuncExpr>($$dpth,
            () => {
                let $$res: Nullable<FuncExpr> = null;
                if (true
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                    && this.loop<FuncExpr_$0>(() => this.matchFuncExpr_$0($$dpth + 1, $$cr), true) !== null
                ) {
                    $$res = {kind: ASTKinds.FuncExpr, };
                }
                return $$res;
            })();
    }
    public matchFuncExpr_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<FuncExpr_$0> {
        return this.runner<FuncExpr_$0>($$dpth,
            () => {
                let $$res: Nullable<FuncExpr_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchExpr($$dpth + 1, $$cr) !== null
                    && this.loop<string>(() => this.regexAccept(String.raw`(?: )`, $$dpth + 1, $$cr), true) !== null
                    && this.negate(() => this.regexAccept(String.raw`(?:\n)`, $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.FuncExpr_$0, };
                }
                return $$res;
            })();
    }
    public matchExpr($$dpth: number, $$cr?: ErrorTracker): Nullable<Expr> {
        return this.matchEq($$dpth + 1, $$cr);
    }
    public matchEq($$dpth: number, $$cr?: ErrorTracker): Nullable<Eq> {
        return this.runner<Eq>($$dpth,
            () => {
                let $$res: Nullable<Eq> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchComp($$dpth + 1, $$cr) !== null
                    && this.loop<Eq_$0>(() => this.matchEq_$0($$dpth + 1, $$cr), true) !== null
                ) {
                    $$res = {kind: ASTKinds.Eq, };
                }
                return $$res;
            })();
    }
    public matchEq_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<Eq_$0> {
        return this.runner<Eq_$0>($$dpth,
            () => {
                let $$res: Nullable<Eq_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:==)`, $$dpth + 1, $$cr) !== null
                    && this.matchComp($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Eq_$0, };
                }
                return $$res;
            })();
    }
    public matchComp($$dpth: number, $$cr?: ErrorTracker): Nullable<Comp> {
        return this.runner<Comp>($$dpth,
            () => {
                let $$res: Nullable<Comp> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchSum($$dpth + 1, $$cr) !== null
                    && this.loop<Comp_$0>(() => this.matchComp_$0($$dpth + 1, $$cr), true) !== null
                ) {
                    $$res = {kind: ASTKinds.Comp, };
                }
                return $$res;
            })();
    }
    public matchComp_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<Comp_$0> {
        return this.runner<Comp_$0>($$dpth,
            () => {
                let $$res: Nullable<Comp_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchCompare($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchSum($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Comp_$0, };
                }
                return $$res;
            })();
    }
    public matchSum($$dpth: number, $$cr?: ErrorTracker): Nullable<Sum> {
        return this.runner<Sum>($$dpth,
            () => {
                let $$res: Nullable<Sum> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchProduct($$dpth + 1, $$cr) !== null
                    && this.loop<Sum_$0>(() => this.matchSum_$0($$dpth + 1, $$cr), true) !== null
                ) {
                    $$res = {kind: ASTKinds.Sum, };
                }
                return $$res;
            })();
    }
    public matchSum_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<Sum_$0> {
        return this.runner<Sum_$0>($$dpth,
            () => {
                let $$res: Nullable<Sum_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchPlusMinus($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchProduct($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Sum_$0, };
                }
                return $$res;
            })();
    }
    public matchProduct($$dpth: number, $$cr?: ErrorTracker): Nullable<Product> {
        return this.runner<Product>($$dpth,
            () => {
                let $$res: Nullable<Product> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchAtom($$dpth + 1, $$cr) !== null
                    && this.loop<Product_$0>(() => this.matchProduct_$0($$dpth + 1, $$cr), true) !== null
                ) {
                    $$res = {kind: ASTKinds.Product, };
                }
                return $$res;
            })();
    }
    public matchProduct_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<Product_$0> {
        return this.runner<Product_$0>($$dpth,
            () => {
                let $$res: Nullable<Product_$0> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchMulDiv($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.matchAtom($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Product_$0, };
                }
                return $$res;
            })();
    }
    public matchAtom($$dpth: number, $$cr?: ErrorTracker): Nullable<Atom> {
        return this.choice<Atom>([
            () => this.matchAtom_1($$dpth + 1, $$cr),
            () => this.matchAtom_2($$dpth + 1, $$cr),
            () => this.matchAtom_3($$dpth + 1, $$cr),
            () => this.matchAtom_4($$dpth + 1, $$cr),
        ]);
    }
    public matchAtom_1($$dpth: number, $$cr?: ErrorTracker): Nullable<Atom_1> {
        return this.matchNoteLit($$dpth + 1, $$cr);
    }
    public matchAtom_2($$dpth: number, $$cr?: ErrorTracker): Nullable<Atom_2> {
        return this.matchKID($$dpth + 1, $$cr);
    }
    public matchAtom_3($$dpth: number, $$cr?: ErrorTracker): Nullable<Atom_3> {
        return this.matchINT($$dpth + 1, $$cr);
    }
    public matchAtom_4($$dpth: number, $$cr?: ErrorTracker): Nullable<Atom_4> {
        return this.runner<Atom_4>($$dpth,
            () => {
                let $$res: Nullable<Atom_4> = null;
                if (true
                    && this.regexAccept(String.raw`(?:\()`, $$dpth + 1, $$cr) !== null
                    && this.matchFuncExpr($$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:\))`, $$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.Atom_4, };
                }
                return $$res;
            })();
    }
    public matchPlusMinus($$dpth: number, $$cr?: ErrorTracker): Nullable<PlusMinus> {
        return this.choice<PlusMinus>([
            () => this.matchPlusMinus_1($$dpth + 1, $$cr),
            () => this.matchPlusMinus_2($$dpth + 1, $$cr),
        ]);
    }
    public matchPlusMinus_1($$dpth: number, $$cr?: ErrorTracker): Nullable<PlusMinus_1> {
        return this.regexAccept(String.raw`(?:\+)`, $$dpth + 1, $$cr);
    }
    public matchPlusMinus_2($$dpth: number, $$cr?: ErrorTracker): Nullable<PlusMinus_2> {
        return this.regexAccept(String.raw`(?:-)`, $$dpth + 1, $$cr);
    }
    public matchMulDiv($$dpth: number, $$cr?: ErrorTracker): Nullable<MulDiv> {
        return this.choice<MulDiv>([
            () => this.matchMulDiv_1($$dpth + 1, $$cr),
            () => this.matchMulDiv_2($$dpth + 1, $$cr),
            () => this.matchMulDiv_3($$dpth + 1, $$cr),
        ]);
    }
    public matchMulDiv_1($$dpth: number, $$cr?: ErrorTracker): Nullable<MulDiv_1> {
        return this.regexAccept(String.raw`(?:\*)`, $$dpth + 1, $$cr);
    }
    public matchMulDiv_2($$dpth: number, $$cr?: ErrorTracker): Nullable<MulDiv_2> {
        return this.regexAccept(String.raw`(?:\/)`, $$dpth + 1, $$cr);
    }
    public matchMulDiv_3($$dpth: number, $$cr?: ErrorTracker): Nullable<MulDiv_3> {
        return this.regexAccept(String.raw`(?:%)`, $$dpth + 1, $$cr);
    }
    public matchCompare($$dpth: number, $$cr?: ErrorTracker): Nullable<Compare> {
        return this.choice<Compare>([
            () => this.matchCompare_1($$dpth + 1, $$cr),
            () => this.matchCompare_2($$dpth + 1, $$cr),
            () => this.matchCompare_3($$dpth + 1, $$cr),
            () => this.matchCompare_4($$dpth + 1, $$cr),
        ]);
    }
    public matchCompare_1($$dpth: number, $$cr?: ErrorTracker): Nullable<Compare_1> {
        return this.regexAccept(String.raw`(?:<=)`, $$dpth + 1, $$cr);
    }
    public matchCompare_2($$dpth: number, $$cr?: ErrorTracker): Nullable<Compare_2> {
        return this.regexAccept(String.raw`(?:>=)`, $$dpth + 1, $$cr);
    }
    public matchCompare_3($$dpth: number, $$cr?: ErrorTracker): Nullable<Compare_3> {
        return this.regexAccept(String.raw`(?:<)`, $$dpth + 1, $$cr);
    }
    public matchCompare_4($$dpth: number, $$cr?: ErrorTracker): Nullable<Compare_4> {
        return this.regexAccept(String.raw`(?:>)`, $$dpth + 1, $$cr);
    }
    public matchNoteLit($$dpth: number, $$cr?: ErrorTracker): Nullable<NoteLit> {
        return this.regexAccept(String.raw`(?:[A-G][#b]?\d)`, $$dpth + 1, $$cr);
    }
    public matchINT($$dpth: number, $$cr?: ErrorTracker): Nullable<INT> {
        return this.regexAccept(String.raw`(?:[0-9]+)`, $$dpth + 1, $$cr);
    }
    public matchKeyword($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword> {
        return this.choice<Keyword>([
            () => this.matchKeyword_1($$dpth + 1, $$cr),
            () => this.matchKeyword_2($$dpth + 1, $$cr),
            () => this.matchKeyword_3($$dpth + 1, $$cr),
            () => this.matchKeyword_4($$dpth + 1, $$cr),
            () => this.matchKeyword_5($$dpth + 1, $$cr),
            () => this.matchKeyword_6($$dpth + 1, $$cr),
        ]);
    }
    public matchKeyword_1($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_1> {
        return this.regexAccept(String.raw`(?:start)`, $$dpth + 1, $$cr);
    }
    public matchKeyword_2($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_2> {
        return this.regexAccept(String.raw`(?:end)`, $$dpth + 1, $$cr);
    }
    public matchKeyword_3($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_3> {
        return this.regexAccept(String.raw`(?:for)`, $$dpth + 1, $$cr);
    }
    public matchKeyword_4($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_4> {
        return this.regexAccept(String.raw`(?:else)`, $$dpth + 1, $$cr);
    }
    public matchKeyword_5($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_5> {
        return this.regexAccept(String.raw`(?:if)`, $$dpth + 1, $$cr);
    }
    public matchKeyword_6($$dpth: number, $$cr?: ErrorTracker): Nullable<Keyword_6> {
        return this.regexAccept(String.raw`(?:then)`, $$dpth + 1, $$cr);
    }
    public matchFuncs($$dpth: number, $$cr?: ErrorTracker): Nullable<Funcs> {
        return this.choice<Funcs>([
            () => this.matchFuncs_1($$dpth + 1, $$cr),
            () => this.matchFuncs_2($$dpth + 1, $$cr),
        ]);
    }
    public matchFuncs_1($$dpth: number, $$cr?: ErrorTracker): Nullable<Funcs_1> {
        return this.regexAccept(String.raw`(?:play)`, $$dpth + 1, $$cr);
    }
    public matchFuncs_2($$dpth: number, $$cr?: ErrorTracker): Nullable<Funcs_2> {
        return this.regexAccept(String.raw`(?:wait)`, $$dpth + 1, $$cr);
    }
    public matchKID($$dpth: number, $$cr?: ErrorTracker): Nullable<KID> {
        return this.runner<KID>($$dpth,
            () => {
                let $$res: Nullable<KID> = null;
                if (true
                    && this.negate(() => this.matchKeyword($$dpth + 1, $$cr)) !== null
                    && this.matchID($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.KID, };
                }
                return $$res;
            })();
    }
    public matchID($$dpth: number, $$cr?: ErrorTracker): Nullable<ID> {
        return this.regexAccept(String.raw`(?:[a-zA-Z_]+)`, $$dpth + 1, $$cr);
    }
    public match_($$dpth: number, $$cr?: ErrorTracker): Nullable<_> {
        return this.loop<string>(() => this.regexAccept(String.raw`(?:\s)`, $$dpth + 1, $$cr), true);
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchProgram(0);
        const ans = res !== null && this.finished();
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchProgram(0);
        if (res && this.finished()) {
            return new ParseResult(res, null);
        }
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchProgram(0, rec);
        return new ParseResult(res,
            rec.getErr() ?? new SyntaxErr(this.mark(), [{kind: "EOF", negated: false}]));
    }
    public mark(): PosInfo {
        return this.pos;
    }
    private loop<T>(func: $$RuleType<T>, star: boolean = false): Nullable<T[]> {
        const mrk = this.mark();
        const res: T[] = [];
        for (;;) {
            const t = func();
            if (t === null) {
                break;
            }
            res.push(t);
        }
        if (star || res.length > 0) {
            return res;
        }
        this.reset(mrk);
        return null;
    }
    private runner<T>($$dpth: number, fn: $$RuleType<T>): $$RuleType<T> {
        return () => {
            const mrk = this.mark();
            const res = fn()
            if (res !== null)
                return res;
            this.reset(mrk);
            return null;
        };
    }
    private choice<T>(fns: Array<$$RuleType<T>>): Nullable<T> {
        for (const f of fns) {
            const res = f();
            if (res !== null) {
                return res;
            }
        }
        return null;
    }
    private regexAccept(match: string, dpth: number, cr?: ErrorTracker): Nullable<string> {
        return this.runner<string>(dpth,
            () => {
                const reg = new RegExp(match, "y");
                const mrk = this.mark();
                reg.lastIndex = mrk.overallPos;
                const res = this.tryConsume(reg);
                if(cr) {
                    cr.record(mrk, res, {
                        kind: "RegexMatch",
                        // We substring from 3 to len - 1 to strip off the
                        // non-capture group syntax added as a WebKit workaround
                        literal: match.substring(3, match.length - 1),
                        negated: this.negating,
                    });
                }
                return res;
            })();
    }
    private tryConsume(reg: RegExp): Nullable<string> {
        const res = reg.exec(this.input);
        if (res) {
            let lineJmp = 0;
            let lind = -1;
            for (let i = 0; i < res[0].length; ++i) {
                if (res[0][i] === "\n") {
                    ++lineJmp;
                    lind = i;
                }
            }
            this.pos = {
                overallPos: reg.lastIndex,
                line: this.pos.line + lineJmp,
                offset: lind === -1 ? this.pos.offset + res[0].length : (res[0].length - lind - 1)
            };
            return res[0];
        }
        return null;
    }
    private noConsume<T>(fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    private negate<T>(fn: $$RuleType<T>): Nullable<boolean> {
        const mrk = this.mark();
        const oneg = this.negating;
        this.negating = !oneg;
        const res = fn();
        this.negating = oneg;
        this.reset(mrk);
        return res === null ? true : null;
    }
}
export function parse(s: string): ParseResult {
    const p = new Parser(s);
    return p.parse();
}
export class ParseResult {
    public ast: Nullable<Program>;
    public err: Nullable<SyntaxErr>;
    constructor(ast: Nullable<Program>, err: Nullable<SyntaxErr>) {
        this.ast = ast;
        this.err = err;
    }
}
export interface PosInfo {
    readonly overallPos: number;
    readonly line: number;
    readonly offset: number;
}
export interface RegexMatch {
    readonly kind: "RegexMatch";
    readonly negated: boolean;
    readonly literal: string;
}
export type EOFMatch = { kind: "EOF"; negated: boolean };
export type MatchAttempt = RegexMatch | EOFMatch;
export class SyntaxErr {
    public pos: PosInfo;
    public expmatches: MatchAttempt[];
    constructor(pos: PosInfo, expmatches: MatchAttempt[]) {
        this.pos = pos;
        this.expmatches = [...expmatches];
    }
    public toString(): string {
        return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Expected one of ${this.expmatches.map(x => x.kind === "EOF" ? " EOF" : ` ${x.negated ? 'not ': ''}'${x.literal}'`)}`;
    }
}
class ErrorTracker {
    private mxpos: PosInfo = {overallPos: -1, line: -1, offset: -1};
    private regexset: Set<string> = new Set();
    private pmatches: MatchAttempt[] = [];
    public record(pos: PosInfo, result: any, att: MatchAttempt) {
        if ((result === null) === att.negated)
            return;
        if (pos.overallPos > this.mxpos.overallPos) {
            this.mxpos = pos;
            this.pmatches = [];
        }
        if (this.mxpos.overallPos === pos.overallPos) {
            if(att.kind === "RegexMatch") {
                if(!this.regexset.has(att.literal))
                    this.pmatches.push(att);
                this.regexset.add(att.literal);
            } else {
                this.pmatches.push(att);
            }
        }
    }
    public getErr(): SyntaxErr | null {
        if (this.mxpos.overallPos !== -1)
            return new SyntaxErr(this.mxpos, this.pmatches);
        return null;
    }
}