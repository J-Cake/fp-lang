import Lex from "./lex";
import Parse, {Const, Fn, Import, Type} from "./parse";
import {group} from "./format";

export default function AST(source: string, origin: string): (Fn | Import | Type | Const)[] {
    return group(Lex(source, origin)).map(i => Parse(i));
}