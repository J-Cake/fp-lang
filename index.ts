import fs from 'fs';
import util from 'util';

import Compiler from 'compiler';
import parse from "./args";

export const options = parse({}, path => path)(process.argv.slice(2));

const program = Compiler(await util.promisify(fs.readFile)(options.default, 'utf8'), options.default);

console.log(util.inspect(program, false, null, true));