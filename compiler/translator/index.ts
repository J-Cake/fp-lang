import {Const, Fn, Import, Type} from "../parse";
import {ConstructTypes, Value} from "../parse/valueBuilder";
import {isToken} from "../parse/util";
import * as Ast from "./construct";

export const isValue: (i: any) => i is Value = (i: any): i is Value => isToken(i) || ('type' in i && i.type in ConstructTypes);
export const isFn: (i: any) => i is Fn = (i: any): i is Fn => "name" in i && "body" in i && "arguments" in i && "genericArguments" in i && "returnType" in i;
export const isType: (i: any) => i is Type = (i: any): i is Type => "name" in i && "genericArguments" in i && "typeExpr" in i;
export const isConst: (i: any) => i is Const = (i: any): i is Const => "name" in i && "value" in i;
export const isImport: (i: any) => i is Import = (i: any): i is Import => "alias" in i && "symbols" in i && "source" in i;

export default function ASM(parse: Fn | Import | Type | Const | Value, scope: Ast.Scope) {



    return scope;
}