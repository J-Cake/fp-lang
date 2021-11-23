export type asm_fn = {};
export type asm_pointer = {};

export type asm_type = {};

export type Scope = {
    symbols: { [name: string]: asm_fn | asm_pointer },
    types: { [name: string]: asm_type }
};