type VariableMap = Map<string, {
    textNodes: Text[],
    elements: {
        original: Element,
        current: Element
    }[]
}>

const variableRegex = /\/[^ \/*]+\//;

type VariableIndex = {
    variable: string,
    index: number
    length: number
};

const findVariables = (text: string) => {
    const tempRegex = new RegExp(variableRegex, 'g');
    let match = tempRegex.exec(text);
    if (!match) return;

    const variables: VariableIndex[] = [];

    while (match !== null) {
        variables.push({
            variable: match[0],
            index: match.index,
            length: match[0].length
        });
        match = tempRegex.exec(text);
    }

    return variables;
}

const variablesToNodes = (node: Text, variables: VariableIndex[]): {
    variable: string,
    textNodes: Text
}[] => {
    // Split text node into multiple text nodes
    const variableNodes: {
        variable: string,
        textNodes: Text
    }[] = [];

    let index = 0;
    variables.forEach((variable) => {
        const newNode = node.splitText(variable.index - index);
        variableNodes.push({
            variable: variable.variable,
            textNodes: newNode
        });
        node = newNode;
        index = variable.index + variable.length;
    });

    return variableNodes;
}

const getVariable = (variable: string, variableMap: VariableMap) => {
    const strippedVariable = variable.replace(/\//g, '');
    const variableElements = variableMap.get(strippedVariable);
    if (variableElements) return variableElements;

    const value = {
        textNodes: [],
        elements: []
    };
    variableMap.set(strippedVariable, value);
    return value;
}

const checkElementAttributes = (element: Element, variableMap: VariableMap) => {
    const attributes = element.attributes;
    for (let { value } of attributes) {
        if (variableRegex.test(value)) {
            const checkVar = value.match(variableRegex);
            if (!checkVar) continue;
            const varStr = checkVar[0];
            const variable = getVariable(varStr, variableMap);
            variable.elements.push({
                original: element.cloneNode() as Element,
                current: element
            });
        }
    }
};

const checkElement = (element: Element, variableMap: VariableMap) => {
    checkElementAttributes(element, variableMap);
    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const node = element.childNodes[i];

        // Split off variables into independent text nodes
        if (node.nodeType === Node.TEXT_NODE && node.textContent && variableRegex.test(node.textContent)) {
            const variables = findVariables(node.textContent);
            if (!variables) return;
            const nodes = variablesToNodes(node as Text, variables);
            nodes.forEach((node) => {
                const variableElements = getVariable(node.variable, variableMap);
                variableElements.textNodes.push(node.textNodes);
            });
        }

        // if node is element node, check its children
        if (node.nodeType === Node.ELEMENT_NODE) {
            checkElementAttributes(node as Element, variableMap);
        }
    }

}

function updateVariable(variableMap: VariableMap, variable: string, value: any) {
    const variableElements = variableMap.get(variable);
    if (!variableElements) return;

    variableElements.textNodes.forEach((node) => {
        node.textContent = value;
    });

    for (const element of variableElements.elements) {
        for (const attribute of element.original.attributes) {
            element.current.setAttribute(attribute.name, attribute.value.replace(`/${variable}/`, value));
        }
    }
}

export const init = (query: string) => {
    const root = document.querySelector(query);

    if (!root) {
        throw new Error(`Root element not found: ${query}`);
    }

    const variableMap = new Map();
    checkElement(root, variableMap);

    return {
        ref: <T>(variable: string, defaultVal: T) => {
            updateVariable(variableMap, variable, defaultVal);
            return {
                rawValue: defaultVal,
                set value(newValue: T) {
                    this.rawValue = newValue;
                    updateVariable(variableMap, variable, newValue);
                },
                get value() {
                    return this.rawValue;
                }
            }
        }
    }
}