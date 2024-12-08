// filesystem.js
class FileNode {
    constructor(name, isDirectory = false, content = '') {
        this.name = name;
        this.isDirectory = isDirectory;
        this.content = content;
        this.children = isDirectory ? new Map() : null;
        this.parent = null;
    }
}

class FileSystem {
    constructor() {
        this.root = new FileNode('/', true);
        this.currentDir = this.root;
        this.initializeFileSystem();
    }

    initializeFileSystem() {
        // Create some default directories and files
        this.mkdir('/home');
        this.mkdir('/docs');
        this.writeFile('/docs/readme.txt', 'Welcome to WebTerminal FileSystem!');
    }

    // Path resolution
    resolvePath(path) {
        if (!path) return this.currentDir;

        const isAbsolute = path.startsWith('/');
        const parts = path.split('/').filter(p => p && p !== '.');
        let current = isAbsolute ? this.root : this.currentDir;

        for (const part of parts) {
            if (part === '..') {
                current = current.parent || current;
                continue;
            }

            if (!current.children.has(part)) {
                throw new Error(`Path not found: ${path}`);
            }
            current = current.children.get(part);
        }
        return current;
    }

    // Get absolute path of a node
    getAbsolutePath(node = this.currentDir) {
        const parts = [];
        let current = node;

        while (current !== this.root) {
            parts.unshift(current.name);
            current = current.parent;
        }

        return '/' + parts.join('/');
    }

    // File system operations
    mkdir(path) {
        const parts = path.split('/').filter(p => p);
        let current = path.startsWith('/') ? this.root : this.currentDir;

        for (const part of parts) {
            if (part === '.' || part === '..') continue;

            if (!current.children.has(part)) {
                const newDir = new FileNode(part, true);
                newDir.parent = current;
                current.children.set(part, newDir);
            }
            current = current.children.get(part);

            if (!current.isDirectory) {
                throw new Error(`${part} is not a directory`);
            }
        }
    }

    cd(path) {
        if (path === '/') {
            this.currentDir = this.root;
            return;
        }

        const target = this.resolvePath(path);
        if (!target.isDirectory) {
            throw new Error('Not a directory');
        }
        this.currentDir = target;
    }

    ls(path = '') {
        const target = this.resolvePath(path);
        if (!target.isDirectory) {
            return [target.name];
        }

        return Array.from(target.children.values()).map(node => {
            return node.isDirectory ? node.name + '/' : node.name;
        });
    }

    rm(path) {
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/');
        const parent = parentPath ? this.resolvePath(parentPath) : this.currentDir;

        if (!parent.children.has(fileName)) {
            throw new Error('File not found');
        }

        const node = parent.children.get(fileName);
        if (node.isDirectory) {
            throw new Error('Is a directory, use rmdir instead');
        }

        parent.children.delete(fileName);
    }

    rmdir(path) {
        const target = this.resolvePath(path);
        if (!target.isDirectory) {
            throw new Error('Not a directory');
        }
        if (target.children.size > 0) {
            throw new Error('Directory not empty');
        }
        if (target === this.root) {
            throw new Error('Cannot remove root directory');
        }

        target.parent.children.delete(target.name);
    }

    tree(node = this.root, prefix = '') {
        let result = [];
        const isLast = node === Array.from(node.parent?.children.values() || []).pop();

        if (node !== this.root) {
            result.push(prefix + (isLast ? '└── ' : '├── ') + node.name + (node.isDirectory ? '/' : ''));
        }

        if (node.isDirectory) {
            const children = Array.from(node.children.values());
            const childPrefix = prefix + (node === this.root ? '' : (isLast ? '    ' : '│   '));

            children.forEach(child => {
                result = result.concat(this.tree(child, childPrefix));
            });
        }

        return result;
    }

    writeFile(path, content) {
        const parts = path.split('/');
        const fileName = parts.pop();
        const parentPath = parts.join('/');
        const parent = parentPath ? this.resolvePath(parentPath) : this.currentDir;

        if (!parent.isDirectory) {
            throw new Error('Parent is not a directory');
        }

        const file = new FileNode(fileName, false, content);
        file.parent = parent;
        parent.children.set(fileName, file);
    }
}

export default FileSystem;