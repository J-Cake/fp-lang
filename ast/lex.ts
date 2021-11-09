import _ from "lodash";

export const operators: Record<string, readonly [source: string, precedence: number, left: boolean]> = {
    add: ['+', 1, false],
    subtract: ['-', 1, false],
    multiply: ['*', 2, false],
    divide: ['/', 2, false],
    modulo: ['mod', 2, false],
    exponent: ['**', 3, true],
    and: ['and', 0, false],
    or: ['or', 0, false],
    xor: ['xor', 0, false],
    not: ['not', 0, true],
} as const;
export const keywords: readonly string[] = [
    "fn",
    "type",
    "const",
    "return"
] as const;

enum TokenTypes {
    Name,
    OpenBracket,
    CloseBracket,
    Keyword,
    Operator,
    Lambda,
    Comment,
    Whitespace,

    '.',
    ',',
    ':',
    '...',

    string,
    boolean,
    binary,
    octal,
    decimal,
    hexadecimal,
    floating,
    scientific,
}

export type TokenType<T extends TokenTypes | void = void> = T extends TokenTypes ? T : keyof typeof TokenTypes;

export type LexToken<T extends TokenType = TokenType> = {
    src: string,
    type: T,

    origin?: {
        charIndex: number,
        resource: string,
        line: number,
        char: number
    }
}

const matchers: Record<TokenType, string | readonly string[] | RegExp | ((token: string) => boolean)> = {
    Keyword: keywords,
    Name: /^[a-zA-Z$_][a-zA-Z0-9$_]*$/,
    OpenBracket: ['(', '[', '{', '<'],
    CloseBracket: [')', ']', '}', '>'],
    Operator: token => _.some(operators, i => i[0] === token),
    Lambda: '=>',
    Comment: token => token.startsWith('#') && !token.includes('\n'),
    Whitespace: /^\s+$/,
    '.': '.',
    ',': ',',
    ':': ':',
    '...': '...',
    string: token => token.startsWith('"') && token.endsWith('"') && !token.slice(1, -1).includes('"'),
    boolean: ['true', 'false'],
    binary: /^-?0b[01]+$/,
    octal: /^-?0o[01234567]+$/,
    decimal: /^-?(0d)?[0123456789]+$/,
    hexadecimal: /^-?0x[0123456789a-fA-F]+$/,
    floating: /^-?\d+\.\d+$/,
    scientific: /^-?\d+(\.\d+)?[eE]\d+$/, // Doesn't work due to technical reasons. Can't fix.
};

const getMatch = function (acc: string): TokenType {
    const potential = _.keys(_.pickBy(matchers, matcher =>
        (matcher instanceof RegExp && matcher.test(acc)) ||
        (Array.isArray(matcher) && matcher.includes(acc)) ||
        (typeof matcher === 'string' && acc === matcher) ||
        (typeof matcher === 'function' && matcher(acc))));

    if (potential.length > 0)
        return potential.reduce((a, i) => TokenTypes[a] > TokenTypes[i] ? a : i) as TokenType;
    return null;
}

export default function Lex(input: string, origin: string): LexToken[] {
    const tokens: LexToken[] = [];

    let index: number = 0;
    let source: string[] = Array.from(input);
    while (source.length > 0) {
        let token: LexToken = null;

        const acc = source.reduce(function (acc: string, i: string): string {
            const match = getMatch(acc + i);

            if (match !== null)
                token = {
                    src: acc + i,
                    type: match,
                    get origin() {
                        return {
                            resource: origin,
                            charIndex: index,
                            line: input.slice(0, index).split('\n').length,
                            char: index - input.slice(0, index).split('\n').slice(0, -1).join('\n').length
                        };
                    }
                }

            return acc + i;
        }, '');

        if (token && token.src.length > 0) {
            source = source.slice(token.src.length);
            tokens.push(token);
            index += token.src.length
        } else {
            console.error(`SyntaxError: Invalid Token '${acc.split(/(\s+)/).shift()}'`);
            return [];
        }
    }

    return tokens;
}