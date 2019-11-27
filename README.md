[![Build Status](https://travis-ci.com/EoinDavey/ts-PEG.svg?branch=master)](https://travis-ci.com/EoinDavey/ts-PEG)

# ts-PEG : A PEG Parser Generator for TypeScript

ts-PEG is a PEG Parser generator for TypeScript. ts-peg takes in an intuitive description of a grammar and outputs a fully featured parser that takes full advantage of the typescript type system.

## Installation

`ts-peg` can be installed by running

```
npm install -g ts-peg
```

## Features

- Fully featured PEG grammar, more powerful than CFGs.
- Infinite lookahead parsing, no restrictions.
- Regex based lexing, implicit tokensiation in your grammar outline.
- Tight typing, generates classes for all production rules, differentiable using discriminated unions.

## Usage

The cli invocation syntax is as follows

`ts-peg <grammar-file> <output-file>`

This generates a TypeScript ES6 module that exports a parser class, as well as classes that represent your AST.

The `Parser` class has a method `parse`, that returns a `ParseResult` object, containing the outputted AST and any `SyntaxError` found.

## Example

Grammars are defined in a syntax similar to standard EBNF format.

Here is an example grammar to parse arithmetic expressions.

```
SUM  := head=FAC tail={ op='\+|-' sm=FAC }*
FAC  := head=ATOM tail={ op='\*|/' sm=ATOM }*
ATOM := val=INT
      | '\(' val=SUM '\)'
INT  := val='[0-9]+'
```

For each rule the generator will output classes, storing the named rules in it's member fields.
For example the class for rule `INT` will look something like

```
class INT {
    kind : ASTKinds.ATOM_2 = ASTKinds.ATOM_2;
    val : string;
    constructor(val : string){
        this.val = val;
    }
}
```

And for `ATOM` ts-peg would generate something like
```
type ATOM = ATOM_1 | ATOM_2;
class ATOM_1 {
    kind : ASTKinds.ATOM_1 = ASTKinds.ATOM_1;
    val : INT;
    constructor(val : INT){
        this.val = val;
    }
}
class ATOM_2 {
    kind : ASTKinds.ATOM_2 = ASTKinds.ATOM_2;
    val : SUM;
    constructor(val : SUM){
        this.val = val;
    }
}
```

Our code to evaluate our AST could look like this

```
function calcInt(at : Parser.INT) : number {
    return parseInt(at.val);
}

function calcAtom(at : Parser.ATOM) : number {
    if(at.kind === Parser.ASTKinds.ATOM_1)
        return calcInt(at.val);
    return calcSum(at.val);
}

function calcFac(at : Parser.FAC) : number {
    return at.tail.reduce((x, y) => {
        if(y.op === '*')
            return x * calcAtom(y.sm);
        return x / calcAtom(y.sm);
    }, calcAtom(at.head));
}

function calcSum(at : Parser.SUM) : number {
    return at.tail.reduce((x, y) => {
        if(y.op === '+')
            return x + calcFac(y.sm);
        return x - calcFac(y.sm);
    }, calcFac(at.head));
}
```

See the full example under demos/calculator
