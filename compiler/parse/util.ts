import _ from "lodash";

import {LexToken, TokenType} from "./lex";
import {ParenthesisedExpression} from "./format";

export type IsToken<T> = T extends LexToken ? true : false;
export type GetTokenType<T extends LexToken> = T extends LexToken<infer K> ? K : never;

export function isToken<Types extends TokenType>(token: any, type?: Types[], source?: string): token is LexToken<Types> {
    if (typeof token === 'object')
        if ('src' in token && 'type' in token) {
            const tok: LexToken = token as unknown as LexToken;

            return (type && type.includes(tok.type as Types)) ? (source ? (tok.src === source) : true) : false;
        }

    return false;
}

export function split(tokens: ParenthesisedExpression, delimiter: TokenType, keep: boolean = false): ParenthesisedExpression[] {
    if (tokens.length <= 0)
        return [];

    let bcount: number = 0;

    return _.reduce(tokens, function (groups: ParenthesisedExpression[], token: LexToken): ParenthesisedExpression[] {
        bcount += isToken(token, ['OpenBracket']) ? 1 : isToken(token, ['CloseBracket']) ? -1 : 0;

        if (token.type === delimiter && bcount === 0)
            return groups.concat([keep ? [token] : []]);
        else
            return groups.slice(0, -1).concat([groups[groups.length - 1].concat([token])]);
    }, [[]]);
}