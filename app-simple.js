// WhatsApp Marketing Simple - Lógica de la aplicación

// Variables globales
let currentUser = null;
let templates = [];
let contacts = [];

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar pantalla de carga después de 1 segundo
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        initApp();
    }, 1000);
});

// Inicializar aplicación
function initApp() {
    // Verificar Firebase
    if (typeof firebaseConfig === 'undefined') {
        showLoginError('Firebase no configurado. Ejecuta setup.html primero');
        return;
    }
    
    // Observar estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            showApp();
            loadUserData();
        } else {
            showLogin();
        }
    });
    
    // Configurar eventos
    setupEventListeners();
}

// Mostrar pantalla de login
function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

// Mostrar aplicación
function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('user-email').textContent = currentUser.email;
}

// Configurar eventos
function setupEventListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
    
    // Botones principales
    document.getElementById('new-template-btn').addEventListener('click', () => openModal('template-modal'));
    document.getElementById('new-contact-btn').addEventListener('click', () => openModal('contact-modal'));
    document.getElementById('save-template-btn').addEventListener('click', saveTemplate);
    document.getElementById('save-contact-btn').addEventListener('click', saveContact);
    document.getElementById('generate-links-btn').addEventListener('click', generateWhatsAppLinks);
    document.getElementById('test-message-btn').addEventListener('click', openTestModal);
    
    // Selectores de contactos
    document.querySelectorAll('.btn-selector').forEach(btn => {
        btn.addEventListener('click', function() {
            const selectType = this.getAttribute('data-select');
            updateContactSelector(selectType);
        });
    });
    
    // Cambios en selectores
    document.getElementById('select-template').addEventListener('change', updateMessagePreview);
    document.getElementById('select-group').addEventListener('change', updateMessagePreview);
    
    // Búsqueda
    document.getElementById('contact-search').addEventListener('input', renderContacts);
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeAllModals();
        });
    });
    
    // Permitir Enter en login
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
}

// Login
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
        errorElement.textContent = 'Por favor, completa todos los campos';
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        errorElement.textContent = '';
    } catch (error) {
        errorElement.textContent = getAuthErrorMessage(error.code);
    }
}

// Registro
async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
        errorElement.textContent = 'Por favor, completa todos los campos';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        errorElement.textContent = '';
    } catch (error) {
        errorElement.textContent = getAuthErrorMessage(error.code);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        // Cargar plantillas
        const templatesSnapshot = await db.collection('templates')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        templates = [];
        templatesSnapshot.forEach(doc => {
            templates.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Cargar contactos
        const contactsSnapshot = await db.collection('contacts')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        contacts = [];
        contactsSnapshot.forEach(doc => {
            contacts.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Renderizar datos
        renderTemplates();
        renderContacts();
        updateTemplateSelect();
        updateContactCheckboxes();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showMessage('Error al cargar los datos', 'error');
    }
}

// Renderizar plantillas
function renderTemplates() {
    const container = document.getElementById('templates-list');
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No hay plantillas</h3>
                <p>Crea tu primera plantilla para comenzar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-item';
        templateElement.innerHTML = `
            <div class="template-header">
                <div class="template-name">${template.name}</div>
                <div class="item-actions">
                    <button class="action-btn edit-template" data-id="${template.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-template delete-btn" data-id="${template.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="template-content">${template.content}</div>
        `;
        
        container.appendChild(templateElement);
    });
    
    // Eventos para botones de plantillas
    document.querySelectorAll('.edit-template').forEach(btn => {
        btn.addEventListener('click', function() {
            const templateId = this.getAttribute('data-id');
            editTemplate(templateId);
        });
    });
    
    document.querySelectorAll('.delete-template').forEach(btn => {
        btn.addEventListener('click', function() {
            const templateId = this.getAttribute('data-id');
            deleteTemplate(templateId);
        });
    });
}

// Renderizar contactos
function renderContacts() {
    const container = document.getElementById('contacts-list');
    const searchTerm = document.getElementById('contact-search').value.toLowerCase();
    
    let filteredContacts = contacts;
    if (searchTerm) {
        filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) || 
            contact.phone.includes(searchTerm)
        );
    }
    
    if (filteredContacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No hay contactos</h3>
                <p>Agrega contactos para enviarles mensajes</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    filteredContacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-item';
        contactElement.innerHTML = `
            <div class="contact-header">
                <div class="contact-name">${contact.name}</div>
                <div class="item-actions">
                    <button class="action-btn edit-contact" data-id="${contact.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-contact delete-btn" data-id="${contact.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="contact-info">
                <div><i class="fas fa-phone"></i> +${contact.phone}</div>
                ${contact.group ? `<div class="contact-group">${contact.group}</div>` : ''}
            </div>
        `;
        
        container.appendChild(contactElement);
    });
    
    // Eventos para botones de contactos
    document.querySelectorAll('.edit-contact').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            editContact(contactId);
        });
    });
    
    document.querySelectorAll('.delete-contact').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            deleteContact(contactId);
        });
    });
}

// Guardar plantilla
async function saveTemplate() {
    const name = document.getElementById('template-name').value.trim();
    const content = document.getElementById('template-content').value.trim();
    
    if (!name || !content) {
        showMessage('Por favor, completa todos los campos', 'error');
        return;
    }
    
    try {
        const templateData = {
            userId: currentUser.uid,
            name: name,
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('templates').add(templateData);
        
        closeAllModals();
        document.getElementById('template-name').value = '';
        document.getElementById('template-content').value = '';
        
        await loadUserData();
        showMessage('Plantilla guardada correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando plantilla:', error);
        showMessage('Error al guardar la plantilla', 'error');
    }
}

// Guardar contacto
async function saveContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const group = document.getElementById('contact-group').value;
    
    if (!name || !phone) {
        showMessage('Por favor, completa nombre y teléfono', 'error');
        return;
    }
    
    // Validar teléfono (solo números, 8-15 dígitos)
    const phoneRegex = /^\d{8,15}$/;
    if (!phoneRegex.test(phone)) {
        showMessage('Teléfono inválido. Debe tener 8-15 dígitos', 'error');
        return;
    }
    
    try {
        const contactData = {
            userId: currentUser.uid,
            name: name,
            phone: phone,
            group: group || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('contacts').add(contactData);
        
        closeAllModals();
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-phone').value = '';
        document.getElementById('contact-group').value = '';
        
        await loadUserData();
        showMessage('Contacto guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando contacto:', error);
        showMessage('Error al guardar el contacto', 'error');
    }
}

// Cambiar pestaña
function switchTab(tabId) {
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Mostrar contenido de la pestaña
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Actualizar selector de contactos
function updateContactSelector(type) {
    // Actualizar botones
    document.querySelectorAll('.btn-selector').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-select="${type}"]`).classList.add('active');
    
    // Mostrar/ocultar selectores
    document.getElementById('group-selector').style.display = type === 'group' ? 'block' : 'none';
    document.getElementById('manual-selector').style.display = type === 'manual' ? 'block' : 'none';
    
    updateMessagePreview();
}

// Actualizar checkboxes de contactos
function updateContactCheckboxes() {
    const container = document.getElementById('contacts-checkboxes');
    
    if (contacts.length === 0) {
        container.innerHTML = '<p>No hay contactos</p>';
        return;
    }
    
    container.innerHTML = '';
    
    contacts.forEach(contact => {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-item';
        checkbox.innerHTML = `
            <input type="checkbox" id="contact-${contact.id}" value="${contact.id}">
            <label for="contact-${contact.id}">${contact.name} (+${contact.phone})</label>
        `;
        container.appendChild(checkbox);
    });
    
    // Actualizar al cambiar checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateMessagePreview);
    });
}

// Actualizar vista previa del mensaje
function updateMessagePreview() {
    const templateId = document.getElementById('select-template').value;
    const template = templates.find(t => t.id === templateId);
    const previewElement = document.getElementById('message-preview');
    const generateBtn = document.getElementById('generate-links-btn');
    
    if (!template) {
        previewElement.textContent = 'Elige una plantilla para ver la vista previa';
        generateBtn.disabled = true;
        return;
    }
    
    // Contar contactos seleccionados
    const selectedContacts = getSelectedContacts();
    
    if (selectedContacts.length === 0) {
        previewElement.textContent = template.content + '\n\n[No hay contactos seleccionados]';
        generateBtn.disabled = true;
    } else {
        // Reemplazar variables con ejemplo
        let preview = template.content;
        preview = preview.replace(/{{nombre}}/g, 'Ejemplo: Juan');
        preview = preview.replace(/{{servicio}}/g, 'nuestro servicio');
        preview = preview.replace(/{{fecha}}/g, new Date().toLocaleDateString());
        
        previewElement.textContent = preview + `\n\n[Se enviará a ${selectedContacts.length} contactos]`;
        generateBtn.disabled = false;
    }
}

// Obtener contactos seleccionados
function getSelectedContacts() {
    const selectorType = document.querySelector('.btn-selector.active').getAttribute('data-select');
    
    switch(selectorType) {
        case 'all':
            return contacts;
            
        case 'group':
            const group = document.getElementById('select-group').value;
            return contacts.filter(contact => contact.group === group);
            
        case 'manual':
            const selectedIds = [];
            document.querySelectorAll('#contacts-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
                selectedIds.push(checkbox.value);
            });
            return contacts.filter(contact => selectedIds.includes(contact.id));
            
        default:
            return [];
    }
}

// Generar enlaces de WhatsApp
function generateWhatsAppLinks() {
    const templateId = document.getElementById('select-template').value;
    const template = templates.find(t => t.id === templateId);
    const selectedContacts = getSelectedContacts();
    
    if (!template || selectedContacts.length === 0) {
        showMessage('Selecciona una plantilla y contactos', 'error');
        return;
    }
    
    const linksContainer = document.getElementById('links-container');
    const linksList = document.getElementById('links-list');
    
    linksList.innerHTML = '';
    
    selectedContacts.forEach(contact => {
        // Reemplazar variables en el mensaje
        let message = template.content;
        message = message.replace(/{{nombre}}/g, contact.name);
        message = message.replace(/{{servicio}}/g, 'nuestro servicio');
        message = message.replace(/{{fecha}}/g, new Date().toLocaleDateString());
        
        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodedMessage}`;
        
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.innerHTML = `
            <div>
                <div class="link-contact">${contact.name}</div>
                <div class="link-phone">+${contact.phone}</div>
            </div>
            <div class="link-actions">
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-link">
                    <i class="fab fa-whatsapp"></i> Abrir en WhatsApp
                </a>
            </div>
        `;
        
        linksList.appendChild(linkItem);
    });
    
    linksContainer.style.display = 'block';
    showMessage(`Se generaron ${selectedContacts.length} enlaces de WhatsApp`, 'success');
}

// Abrir modal de prueba
function openTestModal() {
    const templateId = document.getElementById('select-template').value;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
        showMessage('Primero selecciona una plantilla', 'error');
        return;
    }
    
    // Actualizar vista previa
    let preview = template.content;
    preview = preview.replace(/{{nombre}}/g, 'Tú');
    preview = preview.replace(/{{servicio}}/g, 'nuestro servicio');
    preview = preview.replace(/{{fecha}}/g, new Date().toLocaleDateString());
    
    document.getElementById('test-preview').textContent = preview;
    document.getElementById('test-phone').value = '';
    
    // Configurar enlace (se actualizará cuando se ingrese el número)
    const testLink = document.getElementById('test-whatsapp-link');
    testLink.href = '#';
    testLink.onclick = function(e) {
        const phone = document.getElementById('test-phone').value.trim();
        if (!phone) {
            e.preventDefault();
            showMessage('Ingresa un número para probar', 'error');
            return false;
        }
        
        const encodedMessage = encodeURIComponent(preview);
        this.href = `https://wa.me/${phone}?text=${encodedMessage}`;
    };
    
    openModal('test-modal');
}

// Actualizar select de plantillas
function updateTemplateSelect() {
    const select = document.getElementById('select-template');
    select.innerHTML = '<option value="">Elige una plantilla...</option>';
    
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
}

// Funciones auxiliares
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showMessage(text, type = 'info') {
    // Crear mensaje temporal
    const message = document.createElement('div');
    message.className = `message-${type}`;
    message.textContent = text;
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(message);
        }, 300);
    }, 3000);
}

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Funciones de edición/eliminación (simplificadas)
async function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-content').value = template.content;
    
    // Cambiar comportamiento del botón guardar
    const saveBtn = document.getElementById('save-template-btn');
    const originalHandler = saveBtn.onclick;
    
    saveBtn.onclick = async function() {
        const name = document.getElementById('template-name').value.trim();
        const content = document.getElementById('template-content').value.trim();
        
        if (!name || !content) {
            showMessage('Por favor, completa todos los campos', 'error');
            return;
        }
        
        try {
            await db.collection('templates').doc(templateId).update({
                name: name,
                content: content
            });
            
            closeAllModals();
            saveBtn.onclick = originalHandler;
            await loadUserData();
            showMessage('Plantilla actualizada', 'success');
            
        } catch (error) {
            console.error('Error actualizando plantilla:', error);
            showMessage('Error al actualizar', 'error');
        }
    };
    
    openModal('template-modal');
}

async function deleteTemplate(templateId) {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    
    try {
        await db.collection('templates').doc(templateId).delete();
        await loadUserData();
        showMessage('Plantilla eliminada', 'success');
    } catch (error) {
        console.error('Error eliminando plantilla:', error);
        showMessage('Error al eliminar', 'error');
    }
}

async function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    document.getElementById('contact-name').value = contact.name;
    document.getElementById('contact-phone').value = contact.phone;
    document.getElementById('contact-group').value = contact.group || '';
    
    const saveBtn = document.getElementById('save-contact-btn');
    const originalHandler = saveBtn.onclick;
    
    saveBtn.onclick = async function() {
        const name = document.getElementById('contact-name').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const group = document.getElementById('contact-group').value;
        
        if (!name || !phone) {
            showMessage('Por favor, completa nombre y teléfono', 'error');
            return;
        }
        
        const phoneRegex = /^\d{8,15}$/;
        if (!phoneRegex.test(phone)) {
            showMessage('Teléfono inválido', 'error');
            return;
        }
        
        try {
            await db.collection('contacts').doc(contactId).update({
                name: name,
                phone: phone,
                group: group || ''
            });
            
            closeAllModals();
            saveBtn.onclick = originalHandler;
            await loadUserData();
            showMessage('Contacto actualizado', 'success');
            
        } catch (error) {
            console.error('Error actualizando contacto:', error);
            showMessage('Error al actualizar', 'error');
        }
    };
    
    openModal('contact-modal');
}

async function deleteContact(contactId) {
    if (!confirm('¿Eliminar este contacto?')) return;
    
    try {
        await db.collection('contacts').doc(contactId).delete();
        await loadUserData();
        showMessage('Contacto eliminado', 'success');
    } catch (error) {
        console.error('Error eliminando contacto:', error);
        showMessage('Error al eliminar', 'error');
    }
}

function showLoginError(message) {
    document.getElementById('login-error').textContent = message;
}

function getAuthErrorMessage(code) {
    const messages = {
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Cuenta deshabilitada',
        'auth/user-not-found': 'Usuario no encontrado',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Email ya registrado',
        'auth/weak-password': 'Contraseña débil',
        'auth/too-many-requests': 'Demasiados intentos'
    };
    return messages[code] || 'Error de autenticación';
}
