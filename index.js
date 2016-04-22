"use strict";

var isNullOrUndefined = require('util').isNullOrUndefined;
var isBoolean = require('util').isBoolean;
var minimist = require('minimist');

/**
 * group1: required
 * group2: name
 * group3: default value
 * @type {RegExp}
 */
const OPTION_DEFINITION = /(!)?(\w+)(?:=(\w+))?/;
const _private = new Map();

/** @class */
class MiniCli {

	/**
	 * Creates mini-cli app commands map.
	 */
	constructor() {
		_private.set(this, {
			commands: new Map(),
			current: null
		})
	}

	static get MATCH_ANY() {return /./}

	/**
	 * @param name
	 * @returns {MiniCli}
	 */
	command(name) {
		let p = _private.get(this);
		p.current = name;
		p.commands.set(name, {
			name,
      description: '',
			action: null,
      args: {},
			options: {}
		});
		return this;
	}

	/**
   * @param {string} str
   */
  description(str) {
    this._current.description = str;
    return this;
  }

	/**
	 * @returns {object} command
	 * @private
	 */
	get _current() {
		let p = _private.get(this);
		if (p.current === null) {
			throw new Error('Un-initialized command');
		}
		return p.commands.get(p.current);
	}

	/**
	 * @param name
	 * @returns {MiniCli}
	 */
	alias(name) {
		_private.get(this).commands.set(name, this._current);
		return this;
	}

	/**
   * Define arguments list.
   * [name][=default]
   *
   * Arguments can only be marked default only after all compulsory arguments.
   * Last argument can be a callback function invoked when argument(s) is encountered.
   *
   * @param {...string}
   * @return {MiniCli}
   */
  args() {
    let curr = this._current;
    let args = toCallbackFunction.apply(this, arguments);

    var withDefault = false;
    for(let arg of args.list) {
      let def = createDefinition(curr, 'args', arg, args.callback);
      if (withDefault && !def.default) {
        throw new Error('invalid_command: optional argument must be in the last positions');
      }
      withDefault = !isNullOrUndefined(def.default);
    }
    return this;
  }

	/**
	 * Defines options list.
	 * [!]<name>[=default value]
	 *
	 * ! - marks argument to be required
	 * name - can be a char or a string
	 * default value - sets default string value
   *
   * Last argument can be a callback function invoked when option(s) is encountered.
	 *
	 * @param {...string}
	 * @returns {MiniCli}
	 */
	option() {
		let curr = this._current;
		let args = toCallbackFunction.apply(this, arguments);
		for(let option of args.list) {
			createDefinition(curr, 'options', option, args.callback);
		}
		return this;
	}

	/**
	 * @param callback
	 * @returns {MiniCli}
	 */
	action(callback) {
		this._current.action = callback;
		return this;
	}

	/**
	 * @param {Array} argv - Array of string arguments to map into cli actions.
	 * @returns {*} - proxies action return value
	 */
	parse(argv) {
		let input = minimist(argv);
		let command = findMatchingCommand(input._[0], _private.get(this).commands);
		let context = {};

		if (!command) throw new Error('Unknown command');
		else if (!command.action) throw new Error('invalid_command: no action callback');

    let args = input._.splice(1);
    let keys = Object.keys(command.args);
    let parsedArgs = null;

    let i = -1;
    let length = !keys.length ? 0 : Math.max(keys.length, args.length);
    while(++i < length) {
      parsedArgs = parsedArgs || {_:[]};
      let val = args[i];
      let com = keys.length > i ? command.args[keys[i]] : null;

      if (com === null) parsedArgs._.push(val);
      else if (isNullOrUndefined(val) && isNullOrUndefined(com.default)) {
        return new Error(`Missing command argument{${i}}: ${com.name}`);
      }
      else  {
        parsedArgs[com.name] = !isNullOrUndefined(val) ? val : com.default;
      }
    }

    let parsedOptions = {};
    for(let key of Object.keys(command.options)) {
      let options = command.options[key];
      let value = input[key];

      if (value === undefined && options.required) {
          return new Error(`Missing command flag: ${key}`);
      }

      if (value !== undefined) {
        parsedOptions[key] = value;
      }
      else if (options.default !== undefined) {
        parsedOptions[key] = options.default;
      }
    }

    if (parsedArgs) {
      for(let key of Object.keys(parsedArgs)) {
        if (key === '_') continue;

        let opt = command.args[key];
        if (opt.action) {
          let result = opt.action(context, parsedArgs[key]);

          if (result && !isBoolean(result) || !!result) {
            return result;
          }
        }
      }
    }

		for(let key of Object.keys(parsedOptions)) {
      let opt = command.options[key];
			if (opt.action) {
				let result = opt.action(context, parsedOptions[key]);

				if (result && !isBoolean(result) || result) {
					return result;
				}
			}
		}

		return command.action(context, parsedArgs || args, parsedOptions);
	}

	/**
   * Returns commands Iterator.<name, description>
   * @returns {*}
   */
  commands() {
    let entries = _private.get(this).commands.entries();

    let iterable = {
      [Symbol.iterator]() { return this; }
    };

    iterable.next = function () {
      let next = entries.next();

      return next.done ? next : {
        value: {
          id: next.value[0],
          name: next.value[1].name,
          description: next.value[1].description
        }
      }
    };

    return iterable;
  }
}

module.exports = MiniCli;

function findMatchingCommand (name, commands) {
	for(let key of commands.keys()) {
		if (name && name.match(key)) {
			return commands.get(key);
		}
	}
}

function toCallbackFunction () {
	let args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
	return {
		list: args.filter(n => {return typeof n === 'string'}),
		callback: typeof args[args.length - 1] === 'function' ? args[args.length -1] : null
	}
}

function toArgumentDefinition (str) {
	let parsed = str.match(OPTION_DEFINITION);
	return {
		name: parsed[2],
		required: !!parsed[1],
		defaultValue: parsed[3]
	}
}

function createDefinition (root, ref, arg, callback) {

	if (arg === undefined) {
		throw new Error(`Undefined "${ref}" string`);
	}

	let opt = toArgumentDefinition(arg);
	let dest = root[ref][opt.name] ? root[ref][opt.name] : root[ref][opt.name] = {};

	dest.name = opt.name;
	dest.required = opt.required;
	dest.default = opt.defaultValue;
	dest.action = callback;

  return dest;
}
