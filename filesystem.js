class FileNode {
    constructor(name, isDirectory = false, content = '') {
        this.name = name;
        this.isDirectory = isDirectory;
        this.content = content;
        this.children = isDirectory ? new Map() : null;
        this.parent = null;
    }

    // Convert node to serializable object
    toJSON() {
        return {
            name: this.name,
            isDirectory: this.isDirectory,
            content: this.content,
            children: this.isDirectory ?
                Array.from(this.children.entries()).map(([_, node]) => node.toJSON()) :
                null,
            parentName: this.parent?.name || null
        };
    }

    // Initialize from JSON
    static fromJSON(data, parent = null) {
        const node = new FileNode(data.name, data.isDirectory, data.content);
        node.parent = parent;

        if (data.children) {
            node.children = new Map();
            data.children.forEach(childData => {
                const childNode = FileNode.fromJSON(childData, node);
                node.children.set(childNode.name, childNode);
            });
        }

        return node;
    }
}

class FileSystem {
    constructor() {
        this.dbName = 'fileSystemDB';
        this.storeName = 'fileSystemState';
        this.db = null;
        this.loadFileSystem();
    }

    // Open or create IndexedDB database
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject('Error opening database');
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    this.db.createObjectStore(this.storeName, { keyPath: 'name' });
                }
            };
        });
    }

    // Save the file system state to IndexedDB
    async saveFileSystem() {
        try {
            const db = this.db || await this.openDB();
            const transaction = db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const serializedFS = this.root.toJSON();
            store.put(serializedFS);
            await new Promise((resolve, reject) => {
                transaction.oncomplete = resolve;
                transaction.onerror = () => reject('Error saving filesystem');
            });

        } catch (error) {
            console.error('Error saving filesystem:', error);
        }
    }

    // Load the file system state from IndexedDB
    async loadFileSystem() {
        try {
            const db = await this.openDB();
            const transaction = db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get('/');

            request.onsuccess = (event) => {
                const savedFS = event.target.result;
                if (savedFS) {
                    this.root = FileNode.fromJSON(savedFS);
                    this.currentDir = this.root;
                } else {
                    this.initializeNewFileSystem();
                }
            };

            request.onerror = (event) => {
                console.error('Error loading filesystem:', event);
                this.initializeNewFileSystem();
            };
        } catch (error) {
            console.error('Error loading filesystem:', error);
            this.initializeNewFileSystem();
        }
    }

    initializeNewFileSystem() {
        this.root = new FileNode('/', true);
        this.currentDir = this.root;
        this.initializeFileSystem();
        this.saveFileSystem();
    }

    initializeFileSystem() {
        if (!this.root.children.has('home')) {
            this.mkdir('/home');
        }
        if (!this.root.children.has('docs')) {
            this.mkdir('/docs');
            if (!this.resolvePath('/docs').children.has('readme.txt')) {
                this.writeFile('/docs/readme.txt', 'Welcome to WebTerminal FileSystem!');
            }
        }
    }

    // Path resolution and other methods
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

    getAllFiles(dir = this.root, fileList = []) {
        for (const [_, node] of dir.children) {
            if (node.isDirectory) {
                this.getAllFiles(node, fileList);
            } else {
                fileList.push(this.getAbsolutePath(node));
            }
        }
        return fileList;
    }

    getAbsolutePath(node = this.currentDir) {
        const parts = [];
        let current = node;

        while (current !== this.root) {
            parts.unshift(current.name);
            current = current.parent;
        }

        return '/' + parts.join('/');
    }

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
        this.saveFileSystem();
    }

    cd(path) {
        if (path === '/') {
            this.currentDir = this.root;
        } else {
            const target = this.resolvePath(path);
            if (!target.isDirectory) {
                throw new Error('Not a directory');
            }
            this.currentDir = target;
        }
        this.saveFileSystem();
    }

    ls(path = '') {
        const target = this.resolvePath(path);
        if (!target.isDirectory) {
            return [target.name];
        }

        return Array.from(target.children.values()).map(node => node.isDirectory ? node.name + '/' : node.name);
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
        this.saveFileSystem();
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
        this.saveFileSystem();
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
        this.saveFileSystem();
    }

    readFile(path) {
        const target = this.resolvePath(path);
        if (target.isDirectory) {
            throw new Error('Cannot read a directory');
        }
        return target.content;
    }

    clearFileSystem() {
        this.root = new FileNode('/', true);
        this.currentDir = this.root;
        this.initializeFileSystem();
        this.saveFileSystem();
    }
}

export default FileSystem;
