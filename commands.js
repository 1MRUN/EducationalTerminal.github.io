import FileSystem from './filesystem.js';

// commands.js

class TestManager {
    constructor(fs) {
        this.fs = fs;
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    runAllTests() {
        // Directory operations
        const initialDir = this.fs.getAbsolutePath();
        this.test('cd changes directory', () => {
            this.fs.cd('/');
            if (this.fs.getAbsolutePath() !== '/') throw new Error('Directory not changed');
        });
        this.test('mkdir creates directory', () => {
            this.fs.mkdir('/testdir');
            const dirs = this.fs.ls('/');
            if (!dirs.includes('testdir/')) throw new Error('Directory not created');
        });
        this.test('cd changes directory', () => {
            this.fs.cd('/testdir');
            if (this.fs.getAbsolutePath() !== '/testdir') throw new Error('Directory not changed');
        });

        this.test('rmdir removes directory', () => {
            this.fs.cd('/');
            this.fs.rmdir('/testdir');
            const dirs = this.fs.ls('/');
            if (dirs.includes('testdir/')) throw new Error('Directory not removed');
        });
        // File operations
        this.test('touch creates file', () => {
            this.fs.writeFile('/test.txt', '');
            const files = this.fs.ls('/');
            if (!files.includes('test.txt')) throw new Error('File not created');
        });

        this.test('echo writes to file', () => {
            const content = 'test content';
            this.fs.writeFile('/test.txt', content);
            const readContent = this.fs.readFile('/test.txt');
            if (readContent !== content) throw new Error('Content not written correctly');
        });

        this.test('cat reads file', () => {
            const content = 'test content';
            const readContent = this.fs.readFile('/test.txt');
            if (readContent !== content) throw new Error('Content not read correctly');
        });

        this.test('rm removes file', () => {
            this.fs.rm('/test.txt');
            const files = this.fs.ls('/');
            if (files.includes('test.txt')) throw new Error('File not removed');
        });

        // Path resolution
        this.test('absolute path resolution', () => {
            this.fs.mkdir('/a/b/c');
            const path = this.fs.resolvePath('/a/b/c');
            if (!path.isDirectory) throw new Error('Path resolution failed');
        });

        this.test('relative path resolution', () => {
            this.fs.cd('/a');
            const path = this.fs.resolvePath('b/c');
            if (!path.isDirectory) throw new Error('Relative path resolution failed');
        });

        // Error cases
        this.test('error on invalid path', () => {
            try {
                this.fs.resolvePath('/nonexistent');
                throw new Error('Should have thrown error');
            } catch (e) {
                if (!e.message.includes('Path not found')) throw new Error('Wrong error message');
            }
        });
        this.fs.cd(initialDir);
        //console.log(this.formatResults());
        return this.formatResults();
    }

    async test(name, fn) {
        try {
            fn();
            this.passed++;
            this.results.push(`✓ ${name}`);
        } catch (error) {
            this.failed++;
            this.results.push(`✗ ${name}: ${error.message}`);
        }
    }

    formatResults() {
        return [
            'Test Results:',
            '=============',
            '',
            ...this.results,
            '',
            `Total: ${this.passed + this.failed}`,
            `Passed: ${this.passed}`,
            `Failed: ${this.failed}`,
            '',
            this.failed === 0 ? 'All tests passed!' : 'Some tests failed.'
        ].join('\n');
    }
}
export class Commands {
    constructor(terminal) {
        this.terminal = terminal;
        this.fs = new FileSystem();
        this.initializeCommands();
    }

    initializeCommands() {
        // Help command with detailed descriptions
        this.terminal.registerCommand('help', 'Display available commands and their usage', () => {
            const commandHelp =
                Object.entries(this.terminal.commands)
                .map(([name, command]) => `${name} - ${command.description}`)
            return [
                'WebTerminal Commands:',
                '==================',
                '',
                'Usage:',
                '------',
                commandHelp.join('\n'),
                '',
                'Notes:',
                '------',
                '- Paths can be absolute (starting with /) or relative',
                '- Use .. to reference parent directory',
                '- Use . to reference current directory',
                '- Directory names in ls output end with /'
            ].join('\n');
        });

        // Clear command
        this.terminal.registerCommand('clear', 'Clear the terminal screen', () => {
            this.terminal.clear();
            return '';
        });

        // PWD command
        this.terminal.registerCommand('pwd', 'Print working directory', () => {
            return this.fs.getAbsolutePath();
        });

        this.terminal.registerCommand('resetterm', 'Reset the terminal session', () => {
            this.terminal.clear();
            this.terminal.clearHistory();
            this.fs.clearFileSystem();
            return '';
        });

        // LS command
        this.terminal.registerCommand('ls', 'List directory contents', (args) => {
            try {
                const path = args[0] || '';
                const contents = this.fs.ls(path);
                return contents.join('\n');
            } catch (error) {
                return `ls: ${error.message}`;
            }
        });

        // CD command
        this.terminal.registerCommand('cd', 'Change directory', (args) => {
            try {
                const path = args[0] || '/';
                this.fs.cd(path);
                return '';
            } catch (error) {
                return `cd: ${error.message}`;
            }
        });

        // MKDIR command
        this.terminal.registerCommand('mkdir', 'Create a new directory', (args) => {
            if (!args.length) return 'mkdir: missing operand';
            try {
                this.fs.mkdir(args[0]);
                return '';
            } catch (error) {
                return `mkdir: ${error.message}`;
            }
        });

        // RM command
        this.terminal.registerCommand('rm', 'Remove a file', (args) => {
            if (!args.length) return 'rm: missing operand';
            try {
                this.fs.rm(args[0]);
                return '';
            } catch (error) {
                return `rm: ${error.message}`;
            }
        });

        // RMDIR command
        this.terminal.registerCommand('rmdir', 'Remove an empty directory', (args) => {
            if (!args.length) return 'rmdir: missing operand';
            try {
                this.fs.rmdir(args[0]);
                return '';
            } catch (error) {
                return `rmdir: ${error.message}`;
            }
        });

        // TREE command
        this.terminal.registerCommand('tree', 'Display directory structure as a tree', () => {
            return this.fs.tree().join('\n');
        });

        // TOUCH command
        this.terminal.registerCommand('touch', 'Create a new empty file', (args) => {
            if (!args.length) return 'touch: missing operand';
            try {
                this.fs.writeFile(args[0], '');
                return '';
            } catch (error) {
                return `touch: ${error.message}`;
            }
        });

        // ECHO command
        this.terminal.registerCommand('echo', 'Echo text to the terminal or a file', (args) => {
            if (args.length === 0) return '';

            const output = args.join(' ');
            const redirectIndex = output.indexOf('>>');

            if (redirectIndex !== -1) {
                const text = output.substring(0, redirectIndex).trim();
                const filePath = output.substring(redirectIndex + 2).trim();

                try {
                    const fileContent = this.fs.readFile(filePath) || '';
                    this.fs.writeFile(filePath, fileContent + text + '\n');
                    return '';
                } catch (error) {
                    return `echo: ${error.message}`;
                }
            } else {
                return output;
            }
        });

        // CAT command
        this.terminal.registerCommand('cat', 'Display file content', (args) => {
            if (!args.length) return 'cat: missing operand';
            try {
                return this.fs.readFile(args[0]);
            } catch (error) {
                return `cat: ${error.message}`;
            }
        });

        // GREP command
        this.terminal.registerCommand('grep', 'Search for a pattern in all files', (args) => {
            if (args.length < 1) return 'grep: missing pattern';
            const pattern = args[0];
            const allFiles = this.fs.getAllFiles();
            let minDistance = Infinity;
            let minDistanceFile = '';

            for (const filePath of allFiles) {
                const content = this.fs.readFile(filePath);
                const distance = this.terminal.bitapSearch(content, pattern);
                if (distance < minDistance) {
                    minDistance = distance;
                    minDistanceFile = this.fs.getAbsolutePath() + '/' + filePath;
                }
            }

            return (minDistance !== Infinity) ? `Might be in: ${minDistanceFile}` : 'No files found';
        });

        // Other basic commands
        this.terminal.registerCommand('date', 'Display current date and time', () => {
            return new Date().toString();
        });

        // Test command
        this.terminal.registerCommand('test', 'Run system tests', () => {
            const tester = new TestManager(this.fs);
            return tester.runAllTests()
        });
    }
}

export default Commands;