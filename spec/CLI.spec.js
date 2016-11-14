'use strict';
import commander from '../src/cli/utils/commander';
import definitions from '../src/cli/definitions/parse-server';

var testDefinitions = {
  'arg0': 'PROGRAM_ARG_0',
  'arg1': {
    env: 'PROGRAM_ARG_1',
    required: true
  },
  'arg2': {
    env: 'PROGRAM_ARG_2',
    action: function(value) {
      var intValue = parseInt(value);
      if (!Number.isInteger(intValue)) {
        throw 'arg2 is invalid';
      }
      return intValue;
    }
  },
  'arg3': {},
  'arg4': {
    default: 'arg4Value'
  }
};

describe('commander additions', () => {
  afterEach((done) => {
    commander.options = [];
    delete commander.arg0;
    delete commander.arg1;
    delete commander.arg2;
    delete commander.arg3;
    delete commander.arg4;
    done();
  });

  it('should load properly definitions from args', (done) => {
    commander.loadDefinitions(testDefinitions);
    commander.parse(['node','./CLI.spec.js','--arg0', 'arg0Value', '--arg1', 'arg1Value', '--arg2', '2', '--arg3', 'some']);
    expect(commander.arg0).toEqual('arg0Value');
    expect(commander.arg1).toEqual('arg1Value');
    expect(commander.arg2).toEqual(2);
    expect(commander.arg3).toEqual('some');
    expect(commander.arg4).toEqual('arg4Value');
    done();
  });

  it('should load properly definitions from env', (done) => {
    commander.loadDefinitions(testDefinitions);
    commander.parse([], {
      'PROGRAM_ARG_0': 'arg0ENVValue',
      'PROGRAM_ARG_1': 'arg1ENVValue',
      'PROGRAM_ARG_2': '3',
    });
    expect(commander.arg0).toEqual('arg0ENVValue');
    expect(commander.arg1).toEqual('arg1ENVValue');
    expect(commander.arg2).toEqual(3);
    expect(commander.arg4).toEqual('arg4Value');
    done();
  });

  it('should load properly use args over env', (done) => {
    commander.loadDefinitions(testDefinitions);
    commander.parse(['node','./CLI.spec.js','--arg0', 'arg0Value', '--arg4', 'anotherArg4'], {
      'PROGRAM_ARG_0': 'arg0ENVValue',
      'PROGRAM_ARG_1': 'arg1ENVValue',
      'PROGRAM_ARG_2': '4',
    });
    expect(commander.arg0).toEqual('arg0Value');
    expect(commander.arg1).toEqual('arg1ENVValue');
    expect(commander.arg2).toEqual(4);
    expect(commander.arg4).toEqual('anotherArg4');
    done();
  });

  it('should fail in action as port is invalid', (done) => {
    commander.loadDefinitions(testDefinitions);
    expect(()=> {
      commander.parse(['node','./CLI.spec.js','--arg0', 'arg0Value'], {
        'PROGRAM_ARG_0': 'arg0ENVValue',
        'PROGRAM_ARG_1': 'arg1ENVValue',
        'PROGRAM_ARG_2': 'hello',
      });
    }).toThrow('arg2 is invalid');
    done();
  });

  it('should not override config.json', (done) => {
    commander.loadDefinitions(testDefinitions);
    commander.parse(['node','./CLI.spec.js','--arg0', 'arg0Value', './spec/configs/CLIConfig.json'], {
      'PROGRAM_ARG_0': 'arg0ENVValue',
      'PROGRAM_ARG_1': 'arg1ENVValue',
    });
    let options = commander.getOptions();
    expect(options.arg2).toBe(8888);
    expect(options.arg3).toBe('hello'); //config value
    expect(options.arg4).toBe('/1');
    done();
  });

  it('should fail with invalid values in JSON', (done) => {
    commander.loadDefinitions(testDefinitions);
    expect(() => {
      commander.parse(['node','./CLI.spec.js','--arg0', 'arg0Value', './spec/configs/CLIConfigFail.json'], {
        'PROGRAM_ARG_0': 'arg0ENVValue',
        'PROGRAM_ARG_1': 'arg1ENVValue',
      });
    }).toThrow('arg2 is invalid');
    done();
  });

  it('should fail when too many apps are set', (done) => {
    commander.loadDefinitions(testDefinitions);
    expect(() => {
      commander.parse(['node','./CLI.spec.js','./spec/configs/CLIConfigFailTooManyApps.json']);
    }).toThrow('Multiple apps are not supported');
    done();
  });

  it('should load config from apps', (done) => {
    commander.loadDefinitions(testDefinitions);
    commander.parse(['node', './CLI.spec.js', './spec/configs/CLIConfigApps.json']);
    let options = commander.getOptions();
    expect(options.arg1).toBe('my_app');
    expect(options.arg2).toBe(8888);
    expect(options.arg3).toBe('hello'); //config value
    expect(options.arg4).toBe('/1');
    done();
  });

  it('should fail when passing an invalid arguement', (done) => {
    commander.loadDefinitions(testDefinitions);
    expect(() => {
      commander.parse(['node', './CLI.spec.js', './spec/configs/CLIConfigUnknownArg.json']);
    }).toThrow('error: unknown option myArg');
    done();
  });
});

describe('definitions', () => {
  it('should have valid types', () => {
    for (let key in definitions) {
      let definition = definitions[key];
      expect(typeof definition).toBe('object');
      if (typeof definition.required !== 'undefined') {
        expect(typeof definition.env).toBe('string');
      }
      expect(typeof definition.help).toBe('string');
      if (typeof definition.required !== 'undefined') {
        expect(typeof definition.required).toBe('boolean');
      }
      if (typeof definition.action !== 'undefined') {
        expect(typeof definition.action).toBe('function');
      }
    }
  });
});