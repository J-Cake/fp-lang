import Lex from "./parse/lex";
import Parse from "./parse";
import {group} from "./parse/format";
import ASM from "./translator";

export default function Compile(source: string, origin: string) {
    return ASM(group(Lex(source, origin)).map(i => Parse(i)), { symbols: {}, types: {} });
}