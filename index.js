"use strict";

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
			action: null,
			options: {}
		});
		return this;
	}

	/**
	 * @returns {object} command
	 * @private
	 */
	get _current() {
		let p = _private.get(this);
		if (p.current === null) {
			throw 'Un-initialized command';
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
	 * Defines options list.
	 * [!]<name>[=default value]
	 *
	 * ! - marks argument to be required
	 * name - can be a char or a string
	 * value - sets default string value
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

		if (!command) throw 'Unknown command';
		else if (!command.action) throw 'Invalid command object';

		let err = [];

		let options = Object.keys(command.options).reduce(function (base, key) {
			let options = command.options[key];
			let value = input[key];

			if (value === undefined && options.required) {
				err.push(new Error(`Missing command argument: ${key}`));
			}
			if (value !== undefined) {
				base[key] = value;
			}
			else if (options.default !== undefined) {
				base[key] = options.default;
			}

			return base;
		}, {});

		if (err.length >= 1) {
			return err[0];
		}

		for(let key of Object.keys(options)) {

			let item = options[key];
			let opt = command.options[key];

			if (opt.action) {
				let result = opt.action(context, item);

				if (result && typeof result !== 'boolean') {
					return result;
				}
				else if (!!result) {
					return null;
				}
			}
		}

		let args = input._.splice(1);
		return command.action(context, args, options);
	}
}

module.exports = MiniCli;

function findMatchingCommand (name, commands) {
	for(let key of commands.keys()) {
		if (name.match(key)) {
			return commands.get(key);
		}
	}
}

function toCallbackFunction () {
	let args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
	return {
		list: args.length <= 1 ? [args[0]] : args.slice(0, args.length - 1),
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
}