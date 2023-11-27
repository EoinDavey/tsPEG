import { parse, SyntaxErr } from './parser';

function failWithErrs(errs: SyntaxErr[]) {
    console.error('Failed');
    for(const err of errs){
        console.error(err.toString());
    }
    process.exit(1);
}

function failWithString(s: string) {
    console.error('Failed', s);
    process.exit(1);
}

console.log('First check the happy path:');
const t1 = parse('abc');
if(t1.errs.length > 0){
    failWithErrs(t1.errs);
}
const t2 = parse('aabbcc');
if(t2.errs.length > 0){
    failWithErrs(t1.errs);
}
const t3 = parse('aaabbbccc');
if(t3.errs.length > 0){
    failWithErrs(t1.errs);
}
console.log('Happy path succeeded.');
console.log('Now check unhappy path');
if(parse('ab').errs.length === 0){
    failWithString('"ab" Shouldn\'t succeed');
}
if(parse('bc').errs.length === 0){
    failWithString('"bc" Shouldn\'t succeed');
}
if(parse('aabc').errs.length === 0){
    failWithString('"aabc" Shouldn\'t succeed');
}
if(parse('aabbc').errs.length === 0){
    failWithString('"aabbc" Shouldn\'t succeed');
}
if(parse('aabbccc').errs.length === 0){
    failWithString('"aabccc" Shouldn\'t succeed');
}
console.log('Unhappy path succeeded.');
