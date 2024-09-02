let expression = [];
let currentGroup = [];

/**
 * Adds a filter condition to the current group.
 * Validates the input, ensures correct format, and adds the filter to `currentGroup`.
 */
function addFilter() {
    const field = document.getElementById('field-select').value;
    const operator = document.getElementById('operator-select').value;
    let value = document.getElementById('value-input').value;

    // Validate if the field is 'year' and ensure the value is a number
    if (field === 'year') {
        value = Number(value);
        if (isNaN(value)) {
            alert("Inserisci un numero di anno valido.");
            return;
        }
    } else {
        // For non-numeric fields, treat the value as a string
        value = `"${value}"`;
        value = value.toLowerCase();
    }

    // Handle "in" and "not_in" operators as array values
    if (operator === 'in' || operator === 'not_in') {
        value = `[${value.split(',').map(v => field === 'year' ? Number(v.trim()) : `"${v.trim()}"`).join(', ')}]`;
    }

    const filter = `${operator}("${field}", ${value})`;

    // Ensure logical operators separate conditions in the current group
    if (currentGroup.length > 0 && !isLogicalOperator(currentGroup[currentGroup.length - 1])) {
        alert("Per favore aggiungi una condizione logica (AND, OR, NOT) prima di aggiungere un'altra condizione");
        return;
    }

    currentGroup.push(filter);
    updateExpression();
}

/**
 * Adds a logical operator (AND, OR, NOT) to the current group.
 * Ensures a condition exists before adding the operator.
 *
 * @param {string} logicalOperator - The logical operator to add (and, or, not).
 */
function addLogical(logicalOperator) {
    if (currentGroup.length === 0 && expression.length === 0) {
        alert("Aggiungi un filtro prima dell'operatore logico.");
        return;
    }

    if (currentGroup.length === 0 && expression.length > 0) {
        alert("Devi aggiungere almeno una condizione logica o cancellare");
        return;
    }

    currentGroup.push(logicalOperator);
    updateExpression();
}

/**
 * Checks if a given string is a logical operator.
 *
 * @param {string} value - The value to check.
 * @returns {boolean} True if the value is a logical operator, false otherwise.
 */
function isLogicalOperator(value) {
    return value === 'and' || value === 'or' || value === 'not';
}

/**
 * Removes a condition or logical operator from the expression at the specified index.
 *
 * @param {number} index - The index of the condition or operator to remove.
 */
function removeExpression(index) {
    expression.splice(index, 1);
    updateExpression();
}

/**
 * Updates the displayed expression by combining the current expression array
 * and the current group of conditions. The updated expression is shown in the modal.
 */
function updateExpression() {
    const expressionList = document.getElementById('expression-list');
    expressionList.innerHTML = '';

    expression.forEach((exp, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.textContent = exp;

        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-danger btn-sm';
        removeButton.textContent = 'Remove';
        removeButton.onclick = function() {
            removeExpression(index);
        };

        listItem.appendChild(removeButton);
        expressionList.appendChild(listItem);
    });

    let fullExpression = expression.concat(currentGroup).join(' ');
    document.getElementById('generated-expression').textContent = fullExpression;
}

/**
 * Transforms the current expression and group of conditions into the final logical format.
 *
 * @returns {string} The transformed logical expression in the format (e.g., and(condition1, condition2)).
 */
function transformExpression() {
    const transformed = [];
    let currentOperator = '';

    expression.concat(currentGroup).forEach((item) => {
        if (isLogicalOperator(item)) {
            currentOperator = item;
        } else {
            if (currentOperator) {
                const lastItem = transformed.pop();
                transformed.push(`${currentOperator}(${lastItem}, ${item})`);
                currentOperator = '';
            } else {
                transformed.push(item);
            }
        }
    });

    return transformed.length > 0 ? transformed[0] : '';
}

/**
 * Confirms the current filter setup, transforms the expression into the correct format,
 * and displays the final logical formula on the main page.
 * Also closes the modal after confirming.
 */
function confirmFilter() {
    if (currentGroup.length > 0) {
        expression = expression.concat(currentGroup);
        currentGroup = [];
    }

    if (expression.length === 0) {
        alert("Aggiungi almeno una condizione o seleziona Cancella");
        return;
    }

    const finalExpression = transformExpression();
    document.getElementById('final-logical-formula').textContent = finalExpression;

    // Show the "Remove Filter" button when a filter is applied
    document.getElementById('remove-filter-btn').style.display = 'inline-block';

    // Properly close the modal using Bootstrap 5's modal API
    const filterModalElement = document.getElementById('filterModal');
    const filterModal = bootstrap.Modal.getInstance(filterModalElement);
    filterModal.hide();
}

/**
 * Resets the filter modal to its default state.
 * Clears all form fields and any existing conditions.
 */
function resetModal() {
    // Reset form fields
    document.getElementById('field-select').value = 'publisher';
    document.getElementById('operator-select').value = 'eq';
    document.getElementById('value-input').value = '';

    // Clear the current group and expression arrays
    currentGroup = [];
    expression = [];

    // Update the expression display to be empty
    updateExpression();
}

// Attach event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const filterModalElement = document.getElementById('filterModal');

    // Reset and remove the filter every time the modal is shown
    filterModalElement.addEventListener('show.bs.modal', () => {
        resetModal();
    });

    // Reset operator and value when the field is changed
    document.getElementById('field-select').addEventListener('change', () => {
        document.getElementById('operator-select').value = 'eq';
        document.getElementById('value-input').value = '';
    });
});

function confirmFilter() {
    if (currentGroup.length > 0) {
        expression = expression.concat(currentGroup);
        currentGroup = [];
    }

    if (expression.length === 0) {
        alert("Aggiungi almeno una condizione o scegli Cancella.");
        return;
    }

    const finalExpression = transformExpression();
    document.getElementById('final-logical-formula').textContent = finalExpression;

    // Show the "Remove Filter" button when a filter is applied
    document.getElementById('remove-filter-btn').style.display = 'inline-block';

    // Properly close the modal using Bootstrap 5's modal API
    const filterModalElement = document.getElementById('filterModal');
    const filterModal = bootstrap.Modal.getInstance(filterModalElement);
    filterModal.hide();
}

function removeFilter() {
    // Clear the filter and hide the "Remove Filter" button
    document.getElementById('final-logical-formula').textContent = '';
    expression = [];
    currentGroup = [];

    // Hide the "Remove Filter" button
    document.getElementById('remove-filter-btn').style.display = 'none';
}
