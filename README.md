# mini-cli

[![Build Status](https://travis-ci.org/dmitrymatveev/mini-cli.svg?branch=master)](https://travis-ci.org/dmitrymatveev/mini-cli)

Simple cli command to action mapper.

Yes there is a huge amount of those already but why do they all have to
be so complicated... I just need a way to call a function when a certain
string is in the arguments, with just a tad of fluff.

### Usage

    var MiniCli = require('mini-cli');
    var cli = new MiniCli();

    cli.command('cmd');
    cli.option('c', 'x');
    cli.action(function (context, args, options) {
        // execute 'cmd' command
        return '"cmd" command result';
    });

    cli.command('read');
    cli.action(function (ctx, args, options) {
        return 'contents at ' + args[0];
    });

    let result = cli.parse(process.argv.slice(2));
    console.log(result);

### Api

#### MiniCli#constructor

Create new cli programme.

#### MiniCli#command(string: name)

Start new command map. All following method calls would relate to
this command instance.

#### MiniCli#description(string: description)

Set human readable description.

#### MiniCli#alias(string: name)

Makes an association to the current command map by the different name.

#### MiniCli#args(...string)

List of arguments(s) expected by this command.
Last argument can be a `function(ctx, value)` which will be called for each
encountered argument. Any return value which evaluates to true will break
execution and cause `MiniCli#parse` to return it at that moment (no other
arguments will be processed);

Argument definition format: `<argument name>[=default]`

Defining arguments will cause `MiniCli#action` function to receive
arguments hash `{ _:[], {string:string} }` pairs instead of `string[]`.

__Note:__ "\_: []" - contain arguments not matched by `args()` function;

##### E.g.

    var a = cli.command('a').action(function (ctx, args) {
      console.log(args instanceof Array); // true
    });

    var b = cli.command('b').args('first').action(function (ctx, args) {
      console.log(args); {_: {}, first: 'foo'}
    })

#### MiniCli#option(...string)

List of string option(s) expected by this command.
Last argument can be a `function(ctx, value)` which will be called for each
encountered argument. Any return value which evaluates to true will break
execution and cause `MiniCli#parse` to return it at that moment (no other
arguments will be processed);

Option argument format: `[!]<option name>[=default]`
* `!` - specifies that the option is required. `MiniCli#parse` would
return an error object ignoring before invoking `MiniCli#action` callback.
* `<option name>` - name of the option argument
* `=default` - default value

##### E.g.
    cli.option('c', '!mustHave', 'x=foo' function () {
        // 'c', 'x' or 'mustHave' are present in the
        //arguments to the programme
    });

#### MiniCli#action(function: callback)

* function(object: context, array: args, object: options);

Register a callback function for the command.

* context - created new and destroyed for each request. use it for whatever
* args - list of arguments
* options - object with option values

#### MiniCli#parse(array: args[, object: context])

Invoked an callback for the respective `MiniCli#action` callback.
It's return value is whatever `action` callback returns.

It is possible to provide custom context object command action callbacks
using second argument.

#### MiniCli#commands()

Returns `Iterator.<id, name, description>` over defined commands.

* id - Command string match. Value given to a command trigger via `command`
or `alias` methods.
* name - Command name, this would match to the value of `command` method.
* description - Value matching command description.
