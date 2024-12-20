import FileSystem from './filesystem.js';
import TestManager from './tests.js';

export class Commands {
    constructor(terminal) {
        this.terminal = terminal;
        this.fs = new FileSystem();
        this.initializeCommands();
    }

    initializeCommands() {
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
            if (args[0] === '-rf') {
                if (!args[1]) return 'rm: missing operand after -rf';
                this.fs.rmrf(args[1]);
            } else {
                this.fs.rm(args[0]);
            }
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