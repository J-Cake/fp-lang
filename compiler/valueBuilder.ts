import _ from "lodash";

import {ParenthesisedExpression} from "./format";
import {Fn, parseParamList, Value} from "./parse";
import {isToken, split} from "./util";
import {LexToken, operators} from "./lex";

export enum ConstructTypes {
    Assertion, // To do later - allows the type system to be informed of a more specific type
    Chain,
    Call,
    Operation,
    Lambda,
}

export type ConstructType<T extends ConstructTypes | void = void> = { type: T } & T extends ConstructTypes ? T : keyof typeof ConstructTypes;

export const Rest = Symbol('rest');

namespace Types {
    export type Call = {
        value: Value,
        argList: { [name: string | symbol]: Value },
        type: 'Call'
    };
    export type Operation = { type: 'Operation', operation: Value | keyof typeof operators };
    export type Chain = { type: 'Chain', value: Value[] };
    export type Lambda = { type: 'Lambda' } & Fn;
}

type Builders = {
    Call(expr: ParenthesisedExpression): Types.Call,
    Operation(expr: ParenthesisedExpression): Types.Operation,
    Chain(expr: ParenthesisedExpression): Types.Chain,
    Lambda(expr: ParenthesisedExpression): Types.Lambda
};

const builders: Builders = {
    Call(expr: ParenthesisedExpression): Types.Call {
        const params: Types.Call['argList'] = {}; // Todo: Spread Syntax

        const paramList = expr[expr.length - 1];
        if (!Array.isArray(paramList))
            return null;

        for (const [a, i] of split(paramList.slice(1, -1), ',').entries())
            if (i.length >= 3 && isToken(i[0], ['Name']) && isToken(i[1], [':']))
                params[i[0].src] = valueBuilder(i.slice(2));
            else
                params[a] = valueBuilder(i);

        return {
            value: valueBuilder(expr.slice(0, -1)),
            argList: params,
            type: 'Call'
        };
    },
    Operation(expr: ParenthesisedExpression): Types.Operation {
        if (!expr.some(i => isToken(i, ['Operator'])))
            return null;

        const operands = split(expr, 'Operator', true).filter(i => i.length > 0);

        return {
            type: "Operation",
            operation: operands.map(i => isToken(i[0], ['Operator']) ? [_.findKey(operators, j => j[0] === (i[0] as LexToken).src), valueBuilder(i.slice(1))] : valueBuilder(i)).flat(1)
        };
    },
    Chain(expr: ParenthesisedExpression): Types.Chain {
        if (!expr.some(i => isToken(i, ['.'])))
            return null;

        return ({
            type: 'Chain',
            value: split(expr, '.').map(i => valueBuilder(i))
        });
    },
    Lambda(expr: ParenthesisedExpression): Types.Lambda {
        if (!expr.some(i => isToken(i, ['Lambda'])))
            return null;

        const pieces = split(expr, 'Lambda');
        const paramList = pieces[0];

        const fn: Types.Lambda = {
            body: valueBuilder(pieces[1]),
            name: '<Lambda>',
            signature: {
                genericArguments: [],
                arguments: [],
                returnType: '',
            },
            type: "Lambda"
        };

        if (Array.isArray(paramList[0]))
            fn.signature.arguments = split(paramList[0].slice(1, -1), ',').map(i => parseParamList(i));
        else if (isToken(paramList[0], ['Name']))
            fn.signature.arguments = [[paramList[0].src, {src: 'any', type: 'Name', origin: paramList[0].origin}]];
        else if (paramList[0])
            return null;

        return fn;
    }
}

const U = <T>(f: typeof U, ...args: T[]): ReturnType<typeof f> => f(f, ...args);
const getToken = (f, t: ParenthesisedExpression, index: number = 0): LexToken => t[index] ? (isToken(t[index]) ? t[index] : f(f, t[0], index)) : null;

export default function valueBuilder(expression: ParenthesisedExpression): Value {

    // console.log(expression, util.inspect(split(expression, '.'), false, null, true));

    if (expression.length === 1 && isToken(expression[0], ['Name', 'string', 'boolean', 'binary', 'octal', 'decimal', 'hexadecimal', 'floating', 'scientific']))
        return expression[0];
    else if (expression.length === 1 && Array.isArray(expression[0]))
        return valueBuilder(expression[0]);

    if (isToken(expression[0], ['OpenBracket']) && isToken(expression[expression.length - 1], ['CloseBracket']))
        return valueBuilder(expression.slice(1, -1));

    const attempts = _.pickBy(_.mapValues(builders, (value, key: keyof Builders) => builders[key](expression)), _.identity());
    const keys = _.keys(attempts);

    if (keys.length > 0)
        return attempts[_.reduce(keys, (a, i) => ConstructTypes[a] > ConstructTypes[i] ? a : i, keys[0]) as keyof Builders]

    console.error(`SyntaxError: Unexpected token ${U(getToken, expression, 0)?.src ?? '<unknown>'}`);
    throw ``;
}