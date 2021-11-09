import fs from 'fs';
import util from 'util';

import Compiler from '../ast/index';
import {parseArgs} from "./args";

const args = parseArgs(process.argv.slice(2));

const program = Compiler(await util.promisify(fs.readFile)(args.entry, 'utf8'), args.entry);

console.log(util.inspect(program, false, null, true));