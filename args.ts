type Option<Parser extends (arg: string) => any> =
    ({ long?: string, short: string } | { long: string, short?: string })
    & { format?: Parser, default?: ReturnType<Parser>, description?: string };

export type Parameters<Names extends { [name: string]: any }> = { [name in keyof Names]: Option<Names[name]> };

export type Options<Main, Names extends { [name: string]: any }, Config extends Parameters<Names>> = { default: Main }
    & { [Parameter in keyof Config]: Config[Parameter] extends Option<(arg: string) => infer Type> ? Type : boolean };

export default function parse<Main, Names extends { [name: string]: any }>(parameters: Parameters<Names>, main?: (arg: string) => Main): (args: string[]) => Options<Main, Names, typeof parameters> {
    return function (args: string[]): Options<Main, Names, typeof parameters> {
        const options: Options<Main, Names, typeof parameters> = {} as Options<Main, Names, typeof parameters>;

        if (main)
            options["default"] = main(args[0]);

        for (const i in parameters) {
            const param = parameters[i];

            options[i] = ('default' in param && 'format' in param) ? param.default : false as typeof param.default;

            if (param.short?.length > 1)
                throw `short names should only contain 1 character`;

            for (let j = 0, arg = args[j]; j < args.length; arg = args[++j])
                if ((param.long && arg.startsWith('--') && arg.slice(2) === parameters[i].long) ||
                    (param.short && arg.startsWith('-') && !arg.startsWith('--') && arg.slice(1).includes(param.short)))
                    options[i] = param.format ? param.format(args[++j]) : !param.default;

            if (!(i in options) && param.format)
                throw `required parameter ${param.long ?? param.short}`;

        }

        return options;
    }
}