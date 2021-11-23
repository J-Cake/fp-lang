import {Types} from "../parse";
import TypeExpression = Types.TypeExpression;

export type EvaluatedTypeObject = {};

export default function evaluateTypeExpression(expr: TypeExpression): EvaluatedTypeObject {
    return {};
}


export function isAssignableTo(required: EvaluatedTypeObject, received: EvaluatedTypeObject): boolean {
    return false;
}