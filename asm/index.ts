import {Const, Fn, Import, Type} from "../ast/parse";

export type Symbol = {
    name: string,
    expression: Call | Access | Operation // bytecode reps of each
}

export default function ASM(expression: (Fn | Import | Type | Const)[]): Symbol[] {

}