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
                this.echo(`Command not found: ${command}`);
            }
        }
    });
});