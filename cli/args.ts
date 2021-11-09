import path from 'path';

export interface Options {
    entry: string
}

export function parseArgs(args: string[]): Options {
    const options: Options = {
        entry: args[0]
    };

    return options;
}