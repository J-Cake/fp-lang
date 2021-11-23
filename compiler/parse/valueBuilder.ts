import _ from "lodash";

import {ParenthesisedExpression} from "./format";
import {Fn, parseParamList} from "./index";
import {isToken, split} from "./util";
import {LexToken, operators} from "./lex";
import StaticChain = Types.StaticChain;

export type Value =
    LexToken<'Name' | 'string' | 'boolean' | 'binary' | 'octal' | 'decimal' | 'hexadecimal' | 'floating' | 'scientific'>
    | ReturnType<Builders[keyof Builders]>;

export enum ConstructTypes {
    Assertion, // To do later - allows the type system to be informed of a more specific type
    Chain,
    StaticChain,
    Call,
    Operation,
    Object,
    Lambda,
}

export const Rest = Symbol('rest');

namespace Types {
    export type Call = {
        value: Value,
        argList: { [name: string | symbol]: Value },
        type: 'Call'
    };
    export type Operation = { type: 'Operation', operation: (Value | keyof typeof operators)[] };
    export type Chain = { type: 'Chain', value: Value[] };
    export type Lambda = { type: 'Lambda' } & Fn;
    export type Object = { type: 'Object', keys: Map<Value, Value>, constructor: StaticChain };
    export type StaticChain = { type: 'StaticChain', value: LexToken<'Name'>[] };
}

type Builders = {
    Call(expr: ParenthesisedExpression): Types.Call,
    Operation(expr: ParenthesisedExpression): Types.Operation,
    Chain(expr: ParenthesisedExpression): Types.Chain,
    StaticChain(expr: ParenthesisedExpression): Types.StaticChain,
    Lambda(expr: ParenthesisedExpression): Types.Lambda,
    Object(expr: ParenthesisedExpression): Types.Object,
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

        try { // only pass if the `value` is actually valid
            return {
                value: valueBuilder(expr.slice(0, -1)),
                argList: params,
                type: 'Call'
            };
        } catch (err) {
            return null
        }
    },
    Operation(expr: ParenthesisedExpression): Types.Operation {
        if (!expr.some(i => isToken(i, ['Operator'])))
            return null;

        const operands = split(expr, 'Operator', true).filter(i => i.length > 0);

        if (!operands.some(i => isToken(i[0], ['Operator']) || isToken(i[i.length - 1], ['Operator']))) // ensure there is at least one top-level operator.
            return null;

        return {
            type: "Operation",
            operation: operands.map(i => isToken(i[0], ['Operator']) ? [_.findKey(operators, j => j[0] === (i[0] as LexToken).src), valueBuilder(i.slice(1))] : valueBuilder(i)).flat(1)
        };
    },
    Chain(expr: ParenthesisedExpression): Types.Chain {
        if (!expr.some(i => isToken(i, ['.'])))
            return null;

        const chain = split(expr, '.');
        if (chain.some(i => i.length === 0))
            return null;

        return ({
            type: 'Chain',
            value: chain.map(i => valueBuilder(i))
        });
    },
    StaticChain(expr: ParenthesisedExpression): Types.StaticChain {
        if (!expr.some(i => isToken(i, ['::'])))
            return null;

        if (!expr.every(i => isToken(i, ['Name', '::'])))
            return null;

        return {
            type: "StaticChain",
            value: split(expr, '::').map(i => isToken(i[0], ['Name']) && i[0]).filter(i => i)
        };
    },
    Lambda(expr: ParenthesisedExpression): Types.Lambda {
        if (!expr.some(i => isToken(i, ['Lambda'])))
            return null;

        const pieces = split(expr, 'Lambda');
        const paramList = pieces[0];

        const fn: Types.Lambda = {
            body: valueBuilder(pieces[1]),
            name: '<Lambda>',
            arguments: [],
            genericArguments: [],
            type: "Lambda",
            returnType: null
        };

        if (Array.isArray(paramList[0]))
            fn.arguments = split(paramList[0].slice(1, -1), ',').map(i => parseParamList(i));
        else if (isToken(paramList[0], ['Name']))
            fn.arguments = [[paramList[0].src]];
        else if (paramList[0])
            return null;

        return fn;
    },
    Object(expr: ParenthesisedExpression): Types.Object {
        const index = expr.findIndex(i => isToken(i, ['OpenBracket'], '{'));

        if (index <= 0 || !isToken(expr[expr.length - 1], ['CloseBracket'], '}'))
            return null;

        const constructor: StaticChain = builders.StaticChain(expr.slice(0, index));

        const keys: Map<Value, Value> = new Map();

        let used: number = 0;

        for (const [key, value] of split(expr.slice(index + 1, -1), ',').filter(i => i.length > 0).map(i => split(i, ':')))
            if (value)
                keys.set(valueBuilder(key), valueBuilder(value));
            else
                keys.set({type: "decimal", src: (used++).toString()}, valueBuilder(key));

        return {
            type: "Object",
            keys: keys,
            constructor: constructor,
        };
    }
}

const U = <T>(f: typeof U, ...args: T[]): ReturnType<typeof f> => f(f, ...args);
const getToken = (f, t: ParenthesisedExpression, index: number = 0): LexToken => t[index] ? (isToken(t[index]) ? t[index] : f(f, t[0], index)) : null;

export default function valueBuilder(expression: ParenthesisedExpression): Value {
    if (expression.length === 1 && isToken(expression[0], ['Name', 'string', 'boolean', 'binary', 'octal', 'decimal', 'hexadecimal', 'floating', 'scientific']))
        return expression[0];
    else if (expression.length === 1 && Array.isArray(expression[0]))
        return valueBuilder(expression[0]);

    if (isToken(expression[0], ['OpenBracket']) && isToken(expression[expression.length - 1], ['CloseBracket']))
        return valueBuilder(expression.slice(1, -1));

    const attempts = _.pickBy(_.mapValues(builders, (value, key: keyof Builders) => builders[key](expression)), _.identity());
    const keys = _.keys(attempts);

    if (keys.length > 0)
        return attempts[_.reduce(keys, (a, i) => ConstructTypes[a] > ConstructTypes[i] ? a : i, keys[0]) as keyof Builders];

    throw `SyntaxError: Unexpected token ${U(getToken, expression, 0)?.src ?? '<unknown>'}`;
}