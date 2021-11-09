import {LexToken} from "./lex";
import {isToken} from "./util";

export function lines(tokens: LexToken[]): LexToken[][] {
    return tokens.reduce(function (lines: LexToken[][], token: LexToken): LexToken[][] {
        if (token.type === 'Whitespace' && token.src.includes('\n'))
            return lines.concat([[token]]);
        else if (token.type !== 'Whitespace')
            return lines.slice(0, -1).concat([lines[lines.length - 1].concat([token])]);
        else
            return lines;
    }, [[]]);
}

export type ParenthesisedExpression = (LexToken | ParenthesisedExpression)[];

export function group(tokens: LexToken[]): ParenthesisedExpression[] {
    return lines(tokens).reduce(function (groups: LexToken[][], line: LexToken[]): LexToken[][] {
        if (line.length <= 0)
            return groups;

        if (line[0].type === 'Whitespace' && /\n+$/.test(line[0].src))
            return groups.concat([line.filter(i => i.type !== 'Whitespace')]);

        return groups.slice(0, -1).concat([groups[groups.length - 1].concat(line.filter(i => i.type !== 'Whitespace'))])
    }, [[]]).filter(i => i.length > 0).map(i => parenthesise(i));
}

export function parenthesise(tokens: LexToken[]): ParenthesisedExpression {
    let parentheses: number = 0;
    const out: ParenthesisedExpression = [];
    const nested: LexToken[] = [];

    for (const i of tokens) {
        if (isToken(i, ['OpenBracket'], '('))
            parentheses++;

        if (parentheses === 0) out.push(i);
        else nested.push(i);

        if (isToken(i, ['CloseBracket'], ')'))
            if (--parentheses === 0)
                out.push([nested.shift(), ...parenthesise(nested.splice(0, nested.length - 1)), nested.pop()]);
    }

    return out;
}