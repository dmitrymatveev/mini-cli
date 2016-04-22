
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

  it('arguments without definition', function () {
    var cli = new MiniCli();
    cli.command('test');
    cli.action((ctx, args) => {return args});
    var res = cli.parse(['test', 'foo', 'bar']);
    res.should.be.an.Array();
    res.should.have.length(2);
    res.should.containDeep(['foo', 'bar']);
  });

  it('arguments with definition', function () {
    var cli = new MiniCli();
    cli.command('test');
    cli.args('first', 'second');
    cli.action(function (ctx, args) {return args});
    cli.parse(['test', 'foo', 'boo']).should.deepEqual({_: [], first: 'foo', second: 'boo'});
  });

  it('default arguments position order', function () {
    var cli = new MiniCli();
    cli.command('test');
    should.throws(function () {
      cli.args('first=defaultValue', 'second');
    });
  });

  it('default argument item value', function () {
    var cli = new MiniCli();
    cli.command('test');
    cli.action(function (ctx, args) {return args});

    cli.args('first', 'second=boo');
    cli.parse(['test', 'foo']).should.deepEqual({_: [], first: 'foo', second: 'boo'});
    cli.parse(['test', 'foo', 'boo', 'extra', 'stuff']).should.have.property('_', ['extra', 'stuff']);
  });

  it('define argument action callback', function () {
    var cli = new MiniCli();
    cli.command('test');
    cli.action(function (ctx, args) {return args});
    cli.args('first', 'second', (ctx, args) => {return true});
    cli.parse(['test', 'foo', 'boo']).should.be.ok();
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

  it('provides command iterator', function () {
    var cli = new MiniCli();
    cli.command('1').description('first').action(() => {});
    cli.command('2').description('second').action(() => {});

    var res = [];
    for(var cmd of cli.commands()) {
      res.push(cmd);
    }

    res.should.containEql({name: '1', description: 'first'});
    res.should.containEql({name: '2', description: 'second'});
  })
});
