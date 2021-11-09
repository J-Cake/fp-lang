import {LexToken} from "./lex";
import {isToken, split} from "./util";
import {ParenthesisedExpression} from "./format";
import valueBuilder from "./valueBuilder";

namespace Types {
    export type Fn_Type = {
        genericArguments: [name: string, type?: string][],
        arguments: [name: string, type: LexToken<'Name'>][] | [...args: [name: string, type: LexToken<'Name'>][], rest: [name: string, type: LexToken<'Name'>]],
        returnType: string,
    };
    export type Named_Type = { genericArguments: [name: string, type?: string], name: string };
    export type Union_Type = [Named_Type, Named_Type];
    export type Intersection_Type = [Named_Type, Named_Type];
    export type Map_Type = {};
}

export type Type = Types.Fn_Type | Types.Named_Type | Types.Union_Type | Types.Intersection_Type | Types.Map_Type;

export type Import = {
    symbols: string[],
    source: string
}

export type Const = {
    name: string,
    value: Value
}

export type Fn = {
    name: string,
    signature: Types.Fn_Type,
    body: Value
}

export type Value =
    LexToken<'Name' | 'string' | 'boolean' | 'binary' | 'octal' | 'decimal' | 'hexadecimal' | 'floating' | 'scientific'>
    | ReturnType<Builders[keyof Builders]>;

type Builders = {
    Fn(tokens: ParenthesisedExpression): Fn,
    Import(tokens: ParenthesisedExpression): Import,
    Type(tokens: ParenthesisedExpression): Type,
    Const(tokens: ParenthesisedExpression): Const
}

export function parseParamList(argument: ParenthesisedExpression): Types.Fn_Type['arguments'][number] {
    const name = argument[0];

    if (!isToken(name, ['Name']))
        return null;

    if (argument.length === 3 && isToken(argument[1], [':']) && isToken(argument[2], ['Name']))
        return [name.src, argument[2]];

    return [name.src, {src: 'any', type: 'Name', origin: name.origin}];
}

const builders: Builders = {
    Fn(tokens: ParenthesisedExpression): Fn {
        if (!isToken(tokens[0], ['Keyword'], 'fn'))
            return null;

        const fn: Fn = {
            body: undefined,
            name: '',
            signature: {
                genericArguments: [],
                arguments: [],
                returnType: '',
            }
        };

        if (isToken(tokens[1], ['Name']))
            fn.name = tokens[1].src;
        else return null;

        if (Array.isArray(tokens[2]))
            fn.signature.arguments = split(tokens[2].slice(1, -1), ',').map(i => parseParamList(i));
        else return null;

        fn.body = valueBuilder(tokens.slice(3));

        return fn;

    },
    Import(tokens: ParenthesisedExpression): Import {
        return;
    },
    Type(tokens: ParenthesisedExpression): Type {
        return;
    },
    Const(tokens: ParenthesisedExpression): Const {
        return;
    }
}

export default function Parse(group: ParenthesisedExpression): Fn | Import | Type | Const {
    const _0 = group[0];

    if (isToken(_0, ['Keyword']))
        return (({
            'fn': builders.Fn,
            'import': builders.Import,
            'type': builders.Type,
            'const': builders.Const,
        })[(_0 as LexToken<'Keyword'>).src] ?? valueBuilder)(group);

    return valueBuilder(group);
}