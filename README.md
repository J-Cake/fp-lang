# &lt;FP-Lang&gt;

&lt;FP-Lang&gt; is a language built as a learning project for compiler-technologies. The grammar of the language is a
mixture between existing syntax and focuses on as little context-switching as possible, as well as reducing information
redundancy, and its syntax is therefore more concise than others. The language follows a functional paradigm, as this
minimises the disk space needed to express certain computations, as well as being generally more concise.

## The grammar

The grammar is not difficult to learn, as there isn't much to it. Every program must have a `main` function:

```
fn main(args)
    ...
```

### Syntax

Type Syntax is similar to TypeScript's, with a few notable differences:

1. The operators used in TypeScript's type system are replaced with language-specific operators. (and, or, not etc, for
   intersection, union, and omission respectively)
2. Generic types use square brackets, rather than angle brackets, as the syntax is visually more appealing
3. Objects must have a *static* type specifier

Otherwise, below is a comprehensive list of supported type specifications:

* Generic named types:
    ```
  const b: Nullable[string] = "some string value"
    ```
* Union / Intersection types
    ```
  const someVar: Left intersect Right = Left { ... } intersect Right { ... } # note how the `intersect` operator affects both types and values, unlike in TypeScript 
    ```
* Functions
    ```
  type giveMeFunction[Return]: fn(...any[]): Return # This syntax is valid for static and lambda functions.
    ```
* Ojects
    ```
  const app::user = app::user { ... } # the object type must always be specified. Note the following is also valid
  const app::user = app::superuser { ... } 
    ```
* Inheritance
    ``` # app.ark
  type user: object { ... } # all objects must be declared using a base type. The most basic of these is `object`, which defines no properties
  type superuser: user { ... } # any properties `user` specifies must also be specified for `superuser`
    ```
* Imports
    ```
  import "app" user, superuser => app # see #imports for more details 
    ```
* Calls
    ```
  fn main(args)
      rand_int(min: 1, max: 10, distribution: random.normal) # argument names are not required, however, allow them to be passed out-of-order
  fn main(args)
      rand_int(1, 10, random.normal) # Here the order of arguments is important
    ```

## Imports

Modules are an integral part of every language and unlike some \**cough* JavaScript\* not all have native, unified means
of doing this. Therefore, a comprehensive module system exists to simplify loading and reusing code. There are a handful
of rules to be aware of, however.

* All imports must be resolvable at compile-time. An import cannot be located through a variable reference.
* Where an import alias is not specified, any imported symbols are attached to the parent namespace.
* When no symbols are specified, all symbols are used.

### Locating files

Imports are resolved statically at compile-time. Therefore there is no need to cache objects, as a simple
multiple-inclusion guard prevents symbol shadowing. However, a list of search paths must be provided to the compiler,
such that these can be resolved repeatably. This can be done in multiple ways: Through environment variables,
command-line options, or local or global config files.

By default, a global config file is provided, which points to all standard library source files and installed modules,
and local config files contain lists of source directories, from which files should be indexed. This works similarly to
executable location in shells, such as BASH, of CMD.

If it exists, paths are resolved from the most local config file, otherwise, from $PWD, where the compiler was invoked
from. If no path-traversals are specified before a path, $PWD is used.

`--path src` == `--path ./src`

#### Environment Variables

Paths should be specified in the $&lt;fp-lang&gt;_PATH environment variable, where it follows the host system's
convention for path separation.

In Ubuntu:

```
$&lt;fp-lang&gt;_PATH=./app:./srv
```

#### CLI Arguments

When specified with command-line arguments, each path should be provided separately, through the `--path (-p)` option.

```
&lt;fp-lang&gt; ./main.src -p ./app -p ./srv
```

#### Config Files

Each path entry must be placed on a separate line

```pathconfig
./app
./srv
```

