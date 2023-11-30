import { parse, Parser } from './parser';

const obj = {
    'number': 12.57e-1,
    'boolean': true,
    'string': "astring",
    'array': [1,2,3],
    'obj': {'a': 1, 'b': 2, 'c': 3},
    'nested array:': [[1,2,3], [4,5,6]],
    'nested objects': {'a': {'b': {'c': 1}}}
};

const json = JSON.stringify(obj);
if(json !== JSON.stringify(parse(JSON.stringify(obj)).ast!.value)){
    console.error('JSON parsing test failed');
    process.exit(1);
}
