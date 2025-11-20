class FormBuilder {
    constructor() {
        this.fields = [];
        this.selectedFieldId = null;
        this.isPreviewMode = false;
        this.typingTimer = null;
        this.doneTypingInterval = 1000; // 1 second delay
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderFieldTypes();
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('previewBtn').addEventListener('click', () => this.togglePreviewMode());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportAsJSON());
        document.getElementById('editBtn').addEventListener('click', () => this.toggleEditMode());

        // Form builder area
        const formBuilder = document.getElementById('formBuilder');
        formBuilder.addEventListener('dragover', (e) => e.preventDefault());
        formBuilder.addEventListener('drop', (e) => this.handleDrop(e));

        // Field types
        const fieldTypes = document.querySelectorAll('.field-type');
        fieldTypes.forEach(type => {
            type.addEventListener('click', (e) => this.addField(e.target.dataset.type));
            type.addEventListener('dragstart', (e) => this.handleDragStart(e));
        });
    }

    renderFieldTypes() {
        // Already rendered in HTML, just adding drag events
        const fieldTypes = document.querySelectorAll('.field-type');
        fieldTypes.forEach(type => {
            type.setAttribute('draggable', true);
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    handleDrop(e) {
        e.preventDefault();
        const fieldType = e.dataTransfer.getData('text/plain');
        this.addField(fieldType);
        
        // Clean up
        document.querySelectorAll('.field-type').forEach(type => {
            type.classList.remove('dragging');
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addField(type) {
        const field = {
            id: this.generateId(),
            type: type,
            label: this.getDefaultLabel(type),
            required: false,
            placeholder: '',
            defaultValue: '',
            options: type === 'dropdown' || type === 'radio' ? ['Option 1', 'Option 2'] : []
        };

        this.fields.push(field);
        this.saveToLocalStorage();
        this.renderFormBuilder();
        this.selectField(field.id);
    }

    getDefaultLabel(type) {
        const labels = {
            'text': 'Text Field',
            'email': 'Email Address',
            'number': 'Number',
            'checkbox': 'Checkbox',
            'radio': 'Radio Button',
            'date': 'Date',
            'dropdown': 'Dropdown'
        };
        return labels[type] || 'New Field';
    }

    removeField(id) {
        this.fields = this.fields.filter(field => field.id !== id);
        if (this.selectedFieldId === id) {
            this.selectedFieldId = null;
            this.renderFieldProperties();
        }
        this.saveToLocalStorage();
        this.renderFormBuilder();
    }

    selectField(id) {
        this.selectedFieldId = id;
        this.renderFormBuilder();
        this.renderFieldProperties();
    }

    updateFieldProperty(id, property, value) {
        const field = this.fields.find(f => f.id === id);
        if (field) {
            field[property] = value;
            this.saveToLocalStorage();
            this.renderFormBuilder();
            if (this.selectedFieldId === id) {
                this.renderFieldProperties();
            }
        }
    }

    addOption(id) {
        const field = this.fields.find(f => f.id === id);
        if (field && (field.type === 'dropdown' || field.type === 'radio')) {
            field.options.push(`Option ${field.options.length + 1}`);
            this.saveToLocalStorage();
            this.renderFormBuilder();
            if (this.selectedFieldId === id) {
                this.renderFieldProperties();
            }
        }
    }

    removeOption(fieldId, optionIndex) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field && (field.type === 'dropdown' || field.type === 'radio') && field.options.length > 1) {
            field.options.splice(optionIndex, 1);
            this.saveToLocalStorage();
            this.renderFormBuilder();
            if (this.selectedFieldId === fieldId) {
                this.renderFieldProperties();
            }
        }
    }

    updateOption(fieldId, optionIndex, value) {
        const field = this.fields.find(f => f.id === fieldId);
        if (field && (field.type === 'dropdown' || field.type === 'radio')) {
            field.options[optionIndex] = value;
            this.saveToLocalStorage();
            this.renderFormBuilder();
        }
    }

    renderFormBuilder() {
        const container = document.getElementById('formBuilder');
        
        // Clear the drop zone message if we have fields
        if (this.fields.length > 0) {
            container.innerHTML = '';
        } else {
            container.innerHTML = '<div class="drop-zone"><div class="drop-zone-icon"></div><p>Drag fields here or click on a field type to add</p></div>';
            return;
        }

        this.fields.forEach(field => {
            const fieldElement = document.createElement('div');
            fieldElement.className = `form-field ${this.selectedFieldId === field.id ? 'selected' : ''}`;
            fieldElement.dataset.id = field.id;
            
            fieldElement.innerHTML = `
                <div class="form-field-header">
                    <div class="field-label ${field.required ? 'field-label-required' : ''}">${field.label}</div>
                    <div class="field-actions">
                        <button class="delete-field" title="Delete field">×</button>
                    </div>
                </div>
                <div class="field-input-container">
                    ${this.renderFieldInput(field)}
                </div>
            `;
            
            fieldElement.querySelector('.delete-field').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeField(field.id);
            });
            
            fieldElement.addEventListener('click', () => {
                this.selectField(field.id);
            });
            
            container.appendChild(fieldElement);
        });
    }

    renderFieldInput(field) {
        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                return `<input type="${field.type}" placeholder="${field.placeholder}" value="${field.defaultValue}" />`;
            case 'checkbox':
                return `<input type="checkbox" ${field.defaultValue ? 'checked' : ''} />`;
            case 'radio':
                return field.options.map((option, index) => 
                    `<div><input type="radio" name="radio-${field.id}" id="radio-${field.id}-${index}" /> <label for="radio-${field.id}-${index}">${option}</label></div>`
                ).join('');
            case 'date':
                return `<input type="date" value="${field.defaultValue}" />`;
            case 'dropdown':
                const options = field.options.map(option => 
                    `<option value="${option}" ${field.defaultValue === option ? 'selected' : ''}>${option}</option>`
                ).join('');
                return `<select>${options}</select>`;
            default:
                return `<input type="text" placeholder="${field.placeholder}" value="${field.defaultValue}" />`;
        }
    }

    renderFieldProperties() {
        const container = document.getElementById('fieldProperties');
        
        if (!this.selectedFieldId) {
            container.innerHTML = '<p>Select a field to edit its properties</p>';
            return;
        }
        
        const field = this.fields.find(f => f.id === this.selectedFieldId);
        if (!field) return;
        
        let optionsHtml = '';
        if (field.type === 'dropdown' || field.type === 'radio') {
            optionsHtml = `
                <div class="property-group">
                    <label>Options:</label>
                    <div class="options-list">
                        ${field.options.map((option, index) => `
                            <div class="option-item">
                                <input type="text" value="${option}" data-option-index="${index}" />
                                <button class="remove-option" data-option-index="${index}">×</button>
                            </div>
                        `).join('')}
                        <button class="add-option-btn">Add Option</button>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="property-group">
                <label for="fieldLabel"> Label:</label>
                <input type="text" id="fieldLabel" value="${field.label}" />
            </div>
            
            <div class="property-group">
                <label>
                    <input type="checkbox" id="fieldRequired" ${field.required ? 'checked' : ''} /> Required Field
                </label>
            </div>
            
            ${(field.type === 'text' || field.type === 'email' || field.type === 'number') ? `
                <div class="property-group">
                    <label for="fieldPlaceholder">Placeholder:</label>
                    <input type="text" id="fieldPlaceholder" value="${field.placeholder}" />
                </div>
            ` : ''}
            
            <div class="property-group">
                <label for="fieldDefaultValue">Default Value:</label>
                ${this.renderDefaultValueInput(field)}
            </div>
            
            ${optionsHtml}
        `;
        
        // Attach event listeners with debouncing for text inputs
        document.getElementById('fieldLabel').addEventListener('input', (e) => {
            clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(() => {
                this.updateFieldProperty(field.id, 'label', e.target.value);
            }, this.doneTypingInterval);
        });
        
        document.getElementById('fieldRequired').addEventListener('change', (e) => {
            this.updateFieldProperty(field.id, 'required', e.target.checked);
        });
        
        if (document.getElementById('fieldPlaceholder')) {
            document.getElementById('fieldPlaceholder').addEventListener('input', (e) => {
                clearTimeout(this.typingTimer);
                this.typingTimer = setTimeout(() => {
                    this.updateFieldProperty(field.id, 'placeholder', e.target.value);
                }, this.doneTypingInterval);
            });
        }
        
        // Handle default value input based on field type
        const defaultValueInput = document.getElementById('fieldDefaultValue');
        if (defaultValueInput) {
            if (defaultValueInput.type === 'text') {
                defaultValueInput.addEventListener('input', (e) => {
                    clearTimeout(this.typingTimer);
                    this.typingTimer = setTimeout(() => {
                        this.updateFieldProperty(field.id, 'defaultValue', e.target.value);
                    }, this.doneTypingInterval);
                });
            } else {
                defaultValueInput.addEventListener('input', (e) => {
                    this.updateFieldProperty(field.id, 'defaultValue', e.target.value);
                });
            }
        }
        
        // Handle options
        if (field.type === 'dropdown' || field.type === 'radio') {
            // Add option button
            container.querySelector('.add-option-btn').addEventListener('click', () => {
                this.addOption(field.id);
            });
            
            // Remove option buttons
            container.querySelectorAll('.remove-option').forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.optionIndex);
                    this.removeOption(field.id, index);
                });
            });
            
            // Option input fields
            container.querySelectorAll('.options-list input').forEach(input => {
                const index = parseInt(input.dataset.optionIndex);
                input.addEventListener('input', (e) => {
                    clearTimeout(this.typingTimer);
                    this.typingTimer = setTimeout(() => {
                        this.updateOption(field.id, index, e.target.value);
                    }, this.doneTypingInterval);
                });
            });
        }
    }

    renderDefaultValueInput(field) {
        switch (field.type) {
            case 'checkbox':
                return `<label><input type="checkbox" id="fieldDefaultValue" ${field.defaultValue ? 'checked' : ''} /> Checked by default</label>`;
            case 'radio':
                return field.options.map((option, index) => 
                    `<label><input type="radio" name="defaultValue" ${field.defaultValue === option ? 'checked' : ''} value="${option}" /> ${option}</label>`
                ).join('<br>');
            case 'dropdown':
                return `
                    <select id="fieldDefaultValue">
                        <option value="">None</option>
                        ${field.options.map(option => 
                            `<option value="${option}" ${field.defaultValue === option ? 'selected' : ''}>${option}</option>`
                        ).join('')}
                    </select>
                `;
            default:
                return `<input type="text" id="fieldDefaultValue" value="${field.defaultValue}" />`;
        }
    }

    togglePreviewMode() {
        this.isPreviewMode = true;
        document.querySelector('.main-content').style.display = 'none';
        document.getElementById('previewMode').style.display = 'block';
        document.getElementById('previewBtn').style.display = 'none';
        document.getElementById('editBtn').style.display = 'inline-block';
        
        this.renderPreview();
    }

    toggleEditMode() {
        this.isPreviewMode = false;
        document.querySelector('.main-content').style.display = 'flex';
        document.getElementById('previewMode').style.display = 'none';
        document.getElementById('previewBtn').style.display = 'inline-block';
        document.getElementById('editBtn').style.display = 'none';
    }

    renderPreview() {
        const container = document.getElementById('previewFormContainer');
        container.innerHTML = `
            <h2>Form Preview</h2>
            <form class="preview-form" id="previewForm">
                ${this.fields.map(field => this.renderPreviewField(field)).join('')}
                <button type="submit" class="submit-btn">Submit Form</button>
            </form>
        `;
        
        // Add form submission handler
        document.getElementById('previewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted successfully! Check the console for data.');
            const formData = new FormData(e.target);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            console.log('Form Data:', data);
        });
    }

    renderPreviewField(field) {
        let inputHtml = '';
        const fieldName = `field_${field.id}`;
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'number':
                inputHtml = `<input type="${field.type}" name="${fieldName}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''} />`;
                break;
            case 'checkbox':
                inputHtml = `<input type="checkbox" name="${fieldName}" ${field.required ? 'required' : ''} />`;
                break;
            case 'radio':
                inputHtml = field.options.map((option, index) => 
                    `<div><input type="radio" name="${fieldName}" id="preview-radio-${field.id}-${index}" value="${option}" ${field.required ? 'required' : ''} /> <label for="preview-radio-${field.id}-${index}">${option}</label></div>`
                ).join('');
                break;
            case 'date':
                inputHtml = `<input type="date" name="${fieldName}" ${field.required ? 'required' : ''} />`;
                break;
            case 'dropdown':
                const options = field.options.map(option => 
                    `<option value="${option}">${option}</option>`
                ).join('');
                inputHtml = `<select name="${fieldName}" ${field.required ? 'required' : ''}>${options}</select>`;
                break;
            default:
                inputHtml = `<input type="text" name="${fieldName}" placeholder="${field.placeholder}" ${field.required ? 'required' : ''} />`;
        }
        
        return `
            <div class="preview-field ${field.required ? 'required' : ''}">
                <label for="${fieldName}">${field.label}${field.required ? '' : ''}</label>
                ${inputHtml}
            </div>
        `;
    }

    saveToLocalStorage() {
        localStorage.setItem('formBuilderData', JSON.stringify(this.fields));
    }

    loadFromLocalStorage() {
        const savedData = localStorage.getItem('formBuilderData');
        if (savedData) {
            this.fields = JSON.parse(savedData);
        }
    }

    exportAsJSON() {
        // Save to localStorage before exporting
        this.saveToLocalStorage();
        
        const json = JSON.stringify(this.fields, null, 2);
        console.log(json);
        
        // Create a blob and download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'form-definition.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show confirmation
        alert('Form data exported and saved to localStorage!');
    }
}

// Initialize the form builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.formBuilder = new FormBuilder();
});