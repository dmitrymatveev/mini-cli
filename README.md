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

#### MiniCli#alias(string: name)

Makes an association to the current command map by the different name.

#### MiniCli#option(...)

Arguments are a list of string option identifiers with the last argument
being a callback that is called when any of the arguments specified is
encountered.

Option argument format: `[!]<option name>[=default]`
* `!` - specifies that the option is required. `MiniCli#parse` would 
return an error object if it is not ignoring its `MiniCli#action` callback.
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

#### MiniCli#parse(array: args)

Invoked an callback for the respective `MiniCli#action` callback.
It's return value is whatever `action` callback returns.