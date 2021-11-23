import {LexToken} from "./lex";
import {isToken, split} from "./util";
import {ParenthesisedExpression} from "./format";
import valueBuilder, {Value} from "./valueBuilder";
import TypeExpression = Types.TypeExpression;

export namespace Types {
    export type NamedType = {
        name: string,
        args: TypeExpression[],
    };
    export type FnType = {
        genericArguments: Types.Generic[],
        arguments: [name: string, type?: TypeExpression][],
        returnType: TypeExpression
    };
    export type TypeOperation = {
        operands: [TypeExpression, TypeExpression?],
        operator: LexToken<'Operator'>
    };
    export type MapType = {
        specified: {[key: string]: TypeExpression},
        fallback: [key: TypeExpression, value: TypeExpression]
    };

    export type TypeExpression = NamedType | FnType | TypeOperation | MapType;

    export type Generic = {
        name: string,
        constraint: TypeExpression,
    };
}

export type Import = {
    alias: string,
    symbols: string[],
    source: string
}

export type Const = {
    name: string,
    value: Value,
}

export type Fn = {
    name: string,
    body: Value,
    arguments: [name: string, type?: Types.TypeExpression][],
    genericArguments: Types.Generic[],
    returnType: TypeExpression
}

export type Type = {
    name: string,
    genericArguments: Types.Generic[],
    typeExpr: Types.TypeExpression
}

type Builders = {
    Fn(tokens: ParenthesisedExpression): Fn,
    Import(tokens: ParenthesisedExpression): Import,
    Type(tokens: ParenthesisedExpression): Type,
    Const(tokens: ParenthesisedExpression): Const
}

export function parseTypeExpression(expr: ParenthesisedExpression): Types.TypeExpression {

    console.warn('Parsing Type Expressions is not yet supported');

    // TODO: Eventually
    return;
}

export function parseParamList(argument: ParenthesisedExpression): Fn['arguments'][number] {
    const name = argument[0];

    if (!isToken(name, ['Name']))
        return null;

    if (argument.length === 3 && isToken(argument[1], [':']) && isToken(argument[2], ['Name']))
        return [name.src, parseTypeExpression(argument.slice(2))];

    return [name.src];
}

const builders: Builders = {
    Fn(tokens: ParenthesisedExpression): Fn {
        if (!isToken(tokens[0], ['Keyword'], 'fn'))
            return null;

        const fn: Fn = {
            body: undefined,
            name: '',
            genericArguments: [],
            arguments: [],
            returnType: null
        };

        if (isToken(tokens[1], ['Name']))
            fn.name = tokens[1].src;
        else return null;

        if (Array.isArray(tokens[2]))
            fn.arguments = split(tokens[2].slice(1, -1), ',').map(i => parseParamList(i));
        else return null;

        fn.body = valueBuilder(tokens.slice(3));

        return fn;

    },
    Import(tokens: ParenthesisedExpression): Import {
        if (!isToken(tokens[0], ['Keyword'], 'import'))
            return null;

        const source = tokens[1];

        if (!isToken(source, ['string']))
            return null;

        const marker = tokens[tokens.length - 2];

        const alias: LexToken<'Name'> = isToken(marker, ['Lambda']) && isToken(tokens[tokens.length - 1], ['Name']) && tokens[tokens.length - 1] as LexToken<'Name'> || void 0;

        if (tokens.length > 2) {
            const accessors = split(tokens.slice(2, alias && -2), ',');

            if (!accessors.every(i => isToken(i[0], ['Name'])))
                return null;

            return {
                symbols: accessors.map(i => isToken(i[0], ['Name']) && i[0].src),
                source: source.src,
                alias: alias && alias.src || null
            };
        } else return {
            symbols: null, // all
            source: source.src, // adds all symbols into current namespace
            alias: alias && alias.src || null
        };
    },
    Type(tokens: ParenthesisedExpression): Type {
        return;
    },
    Const(tokens: ParenthesisedExpression): Const {
        return;
    }
}

export default function Parse(group: ParenthesisedExpression): Fn | Import | Type | Const | Value {
    if (isToken(group[0], ['Keyword']))
        return (({
            'fn': builders.Fn,
            'import': builders.Import,
            'type': builders.Type,
            'const': builders.Const,
        })[group[0].src] ?? valueBuilder)(group);

    return valueBuilder(group);
}