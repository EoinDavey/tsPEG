import { ASTKinds, parse } from './parser';
test(`dummy test`, () => {
    const parsed = parse('a9');
    if (parsed.ast === null) {
        throw new Error("Failed to parse");
    }
    let type: string;
    switch (parsed.ast.kind) {
        case ASTKinds.Choice_$ID_Int:
            type = "id_int";
            break;
        case ASTKinds.Choice_$ID_Word:
            type = "id_word";
            break;
        case ASTKinds.Choice_Operator:
            type = "id_operator";
            break;
    }
    if (type.length === 0) {
        throw new Error("Must be one of the allowed kinds.");
    }
});