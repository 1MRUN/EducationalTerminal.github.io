class Node {
    constructor(name, parentNode = null,isDir = true) {
        this.name = name;
        this.childNodes = [];
        this.isDir = isDir;
        this.parentNode = parentNode;
        this.size = 0;
        this.current_path = parentNode ? `${parentNode.current_path}/${name}` : name;
    }
}

class FileTree {
    constructor() {
        this.root = new Node("~");
        this.currentNode = this.root;
    }

    addChild(childName, isDir) {
        const newNode = new Node(childName, this.currentNode, isDir);
        this.currentNode.childNodes.push(newNode);
        this.size += 1;
    }

    checkChild(childName, onlyDir) {
        if (childName === ".." && this.currentNode.parentNode) {
            return true;
        }
        return this.currentNode.childNodes.some(child => (child.name === childName && child.isDir === onlyDir));
    }

    gotoChild(childName) {
        if (childName === "..") {
            if (this.currentNode.parentNode) {
                this.currentNode = this.currentNode.parentNode;
            }
        } else {
            for (let child of this.currentNode.childNodes) {
                if (child.name === childName && child.isDir === true) {
                    this.currentNode = child;
                    break;
                }
            }
        }
        return this.currentNode.name;
    }
    getChildrenNames() {
        return this.currentNode.childNodes.map(child => child.name);
    }
    deleteChild(childName) {
        this.size -= 1;
        this.currentNode.childNodes = this.currentNode.childNodes.filter(child => child.name !== childName);
    }
    displayTree(node = this.root, prefix = '', isLast = true) {
        let layers = [];

        // Select the connector and horizontal line
        const connector = isLast ? '└─── ' : '├─── ';

        // Add the current node with the correct prefix and connector
        layers.push(`${prefix}${connector}${node.name}`);

        // Calculate the new prefix for the children
        const newPrefix = prefix + (isLast ? '    ' : '│   ');

        // Iterate over the child nodes
        const childCount = node.childNodes.length;
        node.childNodes.forEach((child, index) => {
            const isChildLast = index === childCount - 1;
            if (child.isDir) {
                layers = layers.concat(this.displayTree(child, newPrefix, isChildLast));
            } else {
                // Add files directly with appropriate prefixes
                const fileConnector = isChildLast ? '└─── ' : '├─── ';
                layers.push(`${newPrefix}${fileConnector}${child.name}`);
            }
        });

        return layers;
    }
}

const filetree = new FileTree();