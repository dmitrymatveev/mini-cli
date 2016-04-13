
var should = require('should');
var MiniCli = require('../index');

describe('Usage', function () {

	it('throw error on unknown command call', function () {
		var cli = new MiniCli();
		should.throws(function () {
			cli.parse(['run']);
		});
	});

	it('define simple command', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.action(function () {
			return true;
		});

		cli.parse(['test']).should.be.ok();
	});

	it('define catch all', function () {
		var cli = new MiniCli();
		cli.command(MiniCli.MATCH_ANY);
		cli.action(function () {
			return true;
		});
		cli.parse(['poop']).should.be.ok();
	});

	it('define command alias', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.action(function () {
			return true;
		});
		cli.alias('alias');
		cli.parse(['alias']).should.be.ok();
	});

	it('define command options', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.option('o');
		cli.action(function (context, args, options) {
			options.should.have.property('o', true);
			return true;
		});
		cli.parse(['test', '-o']).should.be.ok();
	});

	it('required command option', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.option('!o');
		cli.action(function () {});
		should.throws(function () {
			should.ifError(cli.parse(['test']));
		});
	});

	it('default command option value', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.option('o=value');
		cli.action(function (ctx, args, opt) {
			return opt['o'];
		});

		cli.parse(['test']).should.equal('value');
		cli.parse(['test', '-o', 'other']).should.equal('other');
	});

	it('define command option callback', function () {
		var cli = new MiniCli();
		cli.command('test');
		cli.option('o', function (ctx, value) {
			ctx.tested = value;
		});
		cli.action(function (ctx) {
			return ctx;
		});
		cli.parse(['test', '-o', 'stuff']).should.have.property('tested', 'stuff');
	});
});