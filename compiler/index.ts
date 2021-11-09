import Lex from "./lex";
import Parse from "./parse";
import {group} from "./format";

export default function Compile(source: string, origin: string) {
    return group(Lex(source, origin)).map(i => Parse(i));
}