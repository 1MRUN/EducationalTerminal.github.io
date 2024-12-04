$(document).ready(function () {
    // Initialize the terminal
    $('#terminal').terminal({
        help: function() {
            this.echo('Available commands:');
            this.echo('1. [[;green;]help] - Show available commands');
            this.echo('2. [[;green;]hello] - Greet the user');
            this.echo('3. [[;green;]date] - Show the current date and time');
            this.echo('4. [[;green;]clear] - Clear the terminal');
        },
        hello: function() {
            this.echo("Hello! Welcome to the jQuery Terminal example.");
        },
        date: function() {
            this.echo(new Date().toString());
        },
        mkdir: function(dir) {
            if(filetree.checkChild(dir, true)) {
                this.error('File/Directory with such name already exists');
                return;
            }
            filetree.addChild(dir, true);
        },
        cd: function(path) {

            const pathSegments = path.split('/');

            let currentDir = "";
            for (const dir of pathSegments) {
                if (!filetree.checkChild(dir, true)) {
                    this.error(`Directory "${dir}" does not exist`);
                    return;
                }
                currentDir = filetree.gotoChild(dir);
            }

            this.set_prompt(`student@edu-terminal ${currentDir} $ `);
        },
        ls: function() {
            children = filetree.getChildrenNames();
            for (const child of children) {
                this.echo(child);
            }
        },
        pwd: function() {
            this.echo(filetree.currentNode.current_path);
        },
        touch: function(file) {
            if(filetree.checkChild(file, false)) {
                this.error('File/Directory with such name already exists');
                return;
            }
            filetree.addChild(file, false);
        },
        rm: function(file) {
            if (filetree.checkChild(file, true) || !filetree.checkChild(file, false)) {
                return;
            }
            filetree.deleteChild(file);
        },
        // rmdir: function(dir) {
        //     if (filetree.check)
        // }
        tree: function() {
            layers = filetree.displayTree();
            for (const layer of layers) {
                this.echo(layer);
            }
        },
        clear: function() {
            this.clear();
        }
    }, {
        greetings: 'Welcome to the Educational Terminal!',
        prompt: 'student@edu-terminal ~ $ ',
        name: 'terminal_example',
        onCommandNotFound: function(command) {
            if (!command.trim()) {
                // Do nothing for empty commands (spaces, tabs, etc.)
            } else {
                this.error(`Command not found: ${command}`);
            }
        }
    });
});