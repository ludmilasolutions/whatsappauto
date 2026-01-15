// WhatsApp Marketing Automation App
// Lógica principal de la aplicación

// Variables globales
let currentUser = null;
let templates = [];
let contacts = [];
let campaigns = [];

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar pantalla de carga después de 1 segundo
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        initApp();
    }, 1000);
});

// Inicializar la aplicación
function initApp() {
    // Verificar si Firebase está configurado
    if (typeof firebaseConfig === 'undefined') {
        showError('Firebase no está configurado. Por favor, ejecuta setup.html primero.');
        return;
    }
    
    // Inicializar Firebase (ya está inicializado en firebase-config.js)
    // Verificar estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado
            currentUser = user;
            showApp();
            loadUserData();
        } else {
            // No autenticado
            showAuth();
        }
    });
    
    // Inicializar eventos
    initEvents();
}

// Mostrar pantalla de autenticación
function showAuth() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

// Mostrar aplicación principal
function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    
    // Actualizar información del usuario
    document.getElementById('user-name').textContent = currentUser.email;
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.email)}&background=4CAF50&color=fff`;
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
        
        // Cargar campañas
        const campaignsSnapshot = await db.collection('campaigns')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        campaigns = [];
        campaignsSnapshot.forEach(doc => {
            campaigns.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Actualizar estadísticas
        updateStats();
        
        // Renderizar datos
        renderTemplates();
        renderContacts();
        renderCampaigns();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar los datos', 'error');
    }
}

// Actualizar estadísticas en el dashboard
function updateStats() {
    document.getElementById('templates-count').textContent = templates.length;
    document.getElementById('contacts-count').textContent = contacts.length;
    document.getElementById('campaigns-count').textContent = campaigns.length;
    
    // Calcular mensajes enviados (simulado)
    let sentMessages = 0;
    campaigns.forEach(campaign => {
        sentMessages += campaign.contactsCount || 0;
    });
    document.getElementById('messages-sent').textContent = sentMessages;
}

// Renderizar plantillas
function renderTemplates() {
    const container = document.getElementById('templates-container');
    
    if (templates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No hay plantillas aún</h3>
                <p>Crea tu primera plantilla para comenzar a enviar mensajes</p>
                <button class="btn btn-primary" id="empty-template-btn">
                    <i class="fas fa-plus"></i> Crear Plantilla
                </button>
            </div>
        `;
        
        document.getElementById('empty-template-btn')?.addEventListener('click', () => {
            openModal('template-modal');
        });
        return;
    }
    
    container.innerHTML = '';
    
    templates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'template-card';
        templateElement.innerHTML = `
            <div class="template-header">
                <h4>${template.name}</h4>
                <span class="template-category ${template.category}">${getCategoryName(template.category)}</span>
            </div>
            <div class="template-content">
                <p>${template.content.substring(0, 100)}${template.content.length > 100 ? '...' : ''}</p>
            </div>
            <div class="template-footer">
                <span class="template-date">${formatDate(template.createdAt?.toDate())}</span>
                <div class="template-actions">
                    <button class="btn-icon preview-template" data-id="${template.id}" title="Vista previa">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-template" data-id="${template.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-template" data-id="${template.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(templateElement);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.preview-template').forEach(btn => {
        btn.addEventListener('click', function() {
            const templateId = this.getAttribute('data-id');
            previewTemplate(templateId);
        });
    });
    
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
    const container = document.getElementById('contacts-container');
    const searchInput = document.getElementById('contact-search');
    let filteredContacts = contacts;
    
    // Filtrar contactos si hay búsqueda
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredContacts = contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) || 
            contact.phone.includes(searchTerm)
        );
    }
    
    if (filteredContacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No hay contactos aún</h3>
                <p>Agrega contactos para enviarles mensajes promocionales</p>
                <button class="btn btn-primary" id="empty-contact-btn">
                    <i class="fas fa-plus"></i> Agregar Contacto
                </button>
            </div>
        `;
        
        document.getElementById('empty-contact-btn')?.addEventListener('click', () => {
            openModal('contact-modal');
        });
        return;
    }
    
    container.innerHTML = '';
    
    filteredContacts.forEach(contact => {
        const contactElement = document.createElement('div');
        contactElement.className = 'contact-card';
        contactElement.innerHTML = `
            <div class="contact-avatar">
                ${contact.name.charAt(0).toUpperCase()}
            </div>
            <div class="contact-info">
                <h4>${contact.name}</h4>
                <p><i class="fas fa-phone"></i> +${contact.phone}</p>
                ${contact.group ? `<span class="contact-group ${contact.group}">${contact.group}</span>` : ''}
                ${contact.notes ? `<p class="contact-notes">${contact.notes.substring(0, 50)}${contact.notes.length > 50 ? '...' : ''}</p>` : ''}
            </div>
            <div class="contact-actions">
                <button class="btn-icon send-message" data-id="${contact.id}" title="Enviar mensaje">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn-icon edit-contact" data-id="${contact.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-contact" data-id="${contact.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(contactElement);
    });
    
    // Agregar eventos a los botones
    document.querySelectorAll('.send-message').forEach(btn => {
        btn.addEventListener('click', function() {
            const contactId = this.getAttribute('data-id');
            sendMessageToContact(contactId);
        });
    });
    
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

// Renderizar campañas
function renderCampaigns() {
    const container = document.getElementById('campaigns-container');
    
    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullhorn"></i>
                <h3>No hay campañas aún</h3>
                <p>Crea tu primera campaña para enviar mensajes a múltiples contactos</p>
                <button class="btn btn-primary" id="empty-campaign-btn">
                    <i class="fas fa-plus"></i> Crear Campaña
                </button>
            </div>
        `;
        
        document.getElementById('empty-campaign-btn')?.addEventListener('click', () => {
            openModal('campaign-modal');
        });
        return;
    }
    
    container.innerHTML = '';
    
    campaigns.forEach(campaign => {
        const campaignElement = document.createElement('div');
        campaignElement.className = 'campaign-card';
        campaignElement.innerHTML = `
            <div class="campaign-header">
                <h4>${campaign.name}</h4>
                <span class="campaign-status ${campaign.status}">${getStatusName(campaign.status)}</span>
            </div>
            <div class="campaign-info">
                <p><i class="fas fa-file-alt"></i> Plantilla: ${getTemplateName(campaign.templateId)}</p>
                <p><i class="fas fa-users"></i> Contactos: ${campaign.contactsCount || 0}</p>
                <p><i class="fas fa-calendar"></i> Programada: ${formatDate(campaign.scheduledAt?.toDate())}</p>
            </div>
            <div class="campaign-footer">
                <div class="campaign-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${campaign.progress || 0}%"></div>
                    </div>
                    <span>${campaign.progress || 0}% completado</span>
                </div>
                <div class="campaign-actions">
                    <button class="btn-icon view-campaign" data-id="${campaign.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon pause-campaign" data-id="${campaign.id}" title="${campaign.status === 'active' ? 'Pausar' : 'Reanudar'}">
                        <i class="fas fa-${campaign.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn-icon delete-campaign" data-id="${campaign.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(campaignElement);
    });
}

// Inicializar eventos
function initEvents() {
    // Autenticación
    initAuthEvents();
    
    // Navegación
    initNavigationEvents();
    
    // Modales
    initModalEvents();
    
    // Formularios
    initFormEvents();
    
    // Botones de acción rápida
    initQuickActionEvents();
    
    // Búsqueda de contactos
    const contactSearch = document.getElementById('contact-search');
    if (contactSearch) {
        contactSearch.addEventListener('input', renderContacts);
    }
}

// Inicializar eventos de autenticación
function initAuthEvents() {
    // Tabs de login/registro
    document.getElementById('login-tab').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('register-tab').classList.remove('active');
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    });
    
    document.getElementById('register-tab').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
    
    // Formulario de login
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorElement = document.getElementById('login-error');
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            errorElement.textContent = '';
            showToast('Sesión iniciada correctamente', 'success');
        } catch (error) {
            errorElement.textContent = getAuthErrorMessage(error.code);
        }
    });
    
    // Formulario de registro
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const errorElement = document.getElementById('register-error');
        
        if (password !== confirmPassword) {
            errorElement.textContent = 'Las contraseñas no coinciden';
            return;
        }
        
        if (password.length < 6) {
            errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }
        
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            errorElement.textContent = '';
            showToast('Cuenta creada correctamente', 'success');
        } catch (error) {
            errorElement.textContent = getAuthErrorMessage(error.code);
        }
    });
    
    // Cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', async function() {
        try {
            await auth.signOut();
            showToast('Sesión cerrada correctamente', 'success');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
    
    // Términos y condiciones
    document.getElementById('terms-link').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('terms-modal');
    });
}

// Inicializar eventos de navegación
function initNavigationEvents() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase active al link clickeado
            this.classList.add('active');
            
            // Ocultar todas las secciones
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostrar la sección correspondiente
            const sectionId = this.getAttribute('data-section');
            document.getElementById(`${sectionId}-section`).classList.add('active');
        });
    });
}

// Inicializar eventos de modales
function initModalEvents() {
    // Cerrar modales
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });
    
    // Cerrar modal haciendo clic fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });
    
    // Variables en plantillas
    const variableTags = document.querySelectorAll('.variable-tag');
    variableTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const variable = this.getAttribute('data-variable');
            const textarea = document.getElementById('template-content');
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);
            
            textarea.value = textBefore + variable + textAfter;
            textarea.focus();
            textarea.selectionStart = cursorPos + variable.length;
            textarea.selectionEnd = cursorPos + variable.length;
        });
    });
    
    // Programación de campañas
    const scheduleRadios = document.querySelectorAll('input[name="schedule"]');
    scheduleRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const scheduleDatetime = document.getElementById('schedule-datetime');
            if (this.value === 'later') {
                scheduleDatetime.style.display = 'block';
                
                // Establecer fecha mínima (hoy)
                const now = new Date();
                const minDate = now.toISOString().slice(0, 16);
                document.getElementById('campaign-datetime').min = minDate;
                
                // Establecer valor por defecto (mañana a la misma hora)
                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                document.getElementById('campaign-datetime').value = tomorrow.toISOString().slice(0, 16);
            } else {
                scheduleDatetime.style.display = 'none';
            }
        });
    });
}

// Inicializar eventos de formularios
function initFormEvents() {
    // Formulario de plantilla
    document.getElementById('template-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('template-name').value;
        const category = document.getElementById('template-category').value;
        const content = document.getElementById('template-content').value;
        const image = document.getElementById('template-image').value;
        
        try {
            const templateData = {
                userId: currentUser.uid,
                name: name,
                category: category,
                content: content,
                image: image || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            await db.collection('templates').add(templateData);
            
            // Cerrar modal y recargar datos
            closeAllModals();
            this.reset();
            await loadUserData();
            
            showToast('Plantilla guardada correctamente', 'success');
        } catch (error) {
            console.error('Error guardando plantilla:', error);
            showToast('Error al guardar la plantilla', 'error');
        }
    });
    
    // Formulario de contacto
    document.getElementById('contact-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('contact-name').value;
        const phone = document.getElementById('contact-phone').value;
        const group = document.getElementById('contact-group').value;
        const notes = document.getElementById('contact-notes').value;
        
        // Validar número de teléfono
        const phoneRegex = /^\d{8,15}$/;
        if (!phoneRegex.test(phone)) {
            showToast('Número de teléfono inválido. Debe contener entre 8 y 15 dígitos.', 'error');
            return;
        }
        
        try {
            const contactData = {
                userId: currentUser.uid,
                name: name,
                phone: phone,
                group: group || '',
                notes: notes || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            await db.collection('contacts').add(contactData);
            
            // Cerrar modal y recargar datos
            closeAllModals();
            this.reset();
            await loadUserData();
            
            showToast('Contacto guardado correctamente', 'success');
        } catch (error) {
            console.error('Error guardando contacto:', error);
            showToast('Error al guardar el contacto', 'error');
        }
    });
    
    // Formulario de campaña
    document.getElementById('campaign-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('campaign-name').value;
        const templateId = document.getElementById('campaign-template').value;
        const contactGroup = document.getElementById('campaign-contacts').value;
        const schedule = document.querySelector('input[name="schedule"]:checked').value;
        const scheduledAt = schedule === 'later' ? new Date(document.getElementById('campaign-datetime').value) : new Date();
        
        // Validar
        if (!templateId) {
            showToast('Selecciona una plantilla', 'error');
            return;
        }
        
        try {
            // Filtrar contactos según el grupo seleccionado
            let contactIds = [];
            if (contactGroup === 'all') {
                contactIds = contacts.map(contact => contact.id);
            } else if (contactGroup === 'custom') {
                // En una implementación real, aquí habría una selección de contactos
                showToast('La selección personalizada no está implementada en este ejemplo', 'info');
                return;
            } else {
                contactIds = contacts
                    .filter(contact => contact.group === contactGroup)
                    .map(contact => contact.id);
            }
            
            if (contactIds.length === 0) {
                showToast('No hay contactos en el grupo seleccionado', 'error');
                return;
            }
            
            const campaignData = {
                userId: currentUser.uid,
                name: name,
                templateId: templateId,
                contactGroup: contactGroup,
                contactIds: contactIds,
                contactsCount: contactIds.length,
                status: 'scheduled',
                progress: 0,
                schedule: schedule,
                scheduledAt: firebase.firestore.Timestamp.fromDate(scheduledAt),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Guardar en Firestore
            await db.collection('campaigns').add(campaignData);
            
            // Cerrar modal y recargar datos
            closeAllModals();
            this.reset();
            await loadUserData();
            
            showToast('Campaña creada correctamente', 'success');
            
            // Si es para enviar ahora, mostrar opción para iniciar
            if (schedule === 'now') {
                showToast('La campaña está lista para enviarse', 'info');
            }
        } catch (error) {
            console.error('Error creando campaña:', error);
            showToast('Error al crear la campaña', 'error');
        }
    });
}

// Inicializar eventos de acciones rápidas
function initQuickActionEvents() {
    // Nueva plantilla
    document.getElementById('new-template-btn')?.addEventListener('click', () => {
        openModal('template-modal');
    });
    
    document.getElementById('add-template-btn')?.addEventListener('click', () => {
        openModal('template-modal');
    });
    
    // Nuevo contacto
    document.getElementById('new-contact-btn')?.addEventListener('click', () => {
        openModal('contact-modal');
    });
    
    document.getElementById('add-contact-btn')?.addEventListener('click', () => {
        openModal('contact-modal');
    });
    
    // Nueva campaña
    document.getElementById('new-campaign-btn')?.addEventListener('click', () => {
        openModal('campaign-modal');
        populateCampaignTemplates();
    });
    
    document.getElementById('create-campaign-btn')?.addEventListener('click', () => {
        openModal('campaign-modal');
        populateCampaignTemplates();
    });
    
    // Enviar mensaje de prueba
    document.getElementById('send-test-btn')?.addEventListener('click', sendTestMessage);
}

// Abrir modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// Cerrar todos los modales
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Previsualizar plantilla
function previewTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Configurar vista previa
    document.getElementById('preview-message-content').textContent = template.content;
    
    // Configurar imagen si existe
    const imageContainer = document.getElementById('preview-image-container');
    const previewImage = document.getElementById('preview-image');
    
    if (template.image) {
        previewImage.src = template.image;
        imageContainer.style.display = 'block';
    } else {
        imageContainer.style.display = 'none';
    }
    
    // Configurar enlace de WhatsApp
    const message = encodeURIComponent(template.content);
    document.getElementById('whatsapp-send-link').href = `https://wa.me/?text=${message}`;
    
    // Abrir modal
    openModal('preview-modal');
}

// Editar plantilla
function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Llenar formulario
    document.getElementById('template-name').value = template.name;
    document.getElementById('template-category').value = template.category;
    document.getElementById('template-content').value = template.content;
    document.getElementById('template-image').value = template.image || '';
    
    // Cambiar título del modal
    document.querySelector('#template-modal .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Editar Plantilla';
    
    // Cambiar acción del formulario
    const form = document.getElementById('template-form');
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('template-name').value;
        const category = document.getElementById('template-category').value;
        const content = document.getElementById('template-content').value;
        const image = document.getElementById('template-image').value;
        
        try {
            await db.collection('templates').doc(templateId).update({
                name: name,
                category: category,
                content: content,
                image: image || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            closeAllModals();
            form.reset();
            form.onsubmit = originalSubmit;
            document.querySelector('#template-modal .modal-header h3').innerHTML = '<i class="fas fa-file-alt"></i> Nueva Plantilla';
            
            await loadUserData();
            showToast('Plantilla actualizada correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando plantilla:', error);
            showToast('Error al actualizar la plantilla', 'error');
        }
    };
    
    openModal('template-modal');
}

// Eliminar plantilla
async function deleteTemplate(templateId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
        return;
    }
    
    try {
        await db.collection('templates').doc(templateId).delete();
        await loadUserData();
        showToast('Plantilla eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando plantilla:', error);
        showToast('Error al eliminar la plantilla', 'error');
    }
}

// Enviar mensaje a contacto
function sendMessageToContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    // Buscar plantillas para seleccionar
    if (templates.length === 0) {
        showToast('Primero crea una plantilla para enviar mensajes', 'info');
        openModal('template-modal');
        return;
    }
    
    // Crear selector de plantilla
    let options = '<option value="">Seleccionar plantilla...</option>';
    templates.forEach(template => {
        options += `<option value="${template.id}">${template.name}</option>`;
    });
    
    const templateSelector = `
        <div class="form-group">
            <label for="select-template-contact">Seleccionar plantilla para ${contact.name}</label>
            <select id="select-template-contact" class="form-control">
                ${options}
            </select>
        </div>
        <div id="template-preview-contact" style="margin-top: 15px; display: none;">
            <strong>Vista previa:</strong>
            <p id="template-preview-text" style="background: #f5f5f5; padding: 10px; border-radius: 5px;"></p>
        </div>
    `;
    
    if (confirm(`¿Enviar mensaje a ${contact.name}?`)) {
        // Mostrar diálogo para seleccionar plantilla
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%;">
                    <h3 style="margin-top: 0;">Enviar mensaje a ${contact.name}</h3>
                    ${templateSelector}
                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button id="cancel-send" style="padding: 10px 20px; background: #f0f0f0; border: none; border-radius: 5px; cursor: pointer;">Cancelar</button>
                        <button id="confirm-send" style="padding: 10px 20px; background: #25D366; color: white; border: none; border-radius: 5px; cursor: pointer;">Abrir en WhatsApp</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Configurar eventos
        const selectTemplate = document.getElementById('select-template-contact');
        const templatePreview = document.getElementById('template-preview-text');
        const previewContainer = document.getElementById('template-preview-contact');
        
        selectTemplate.addEventListener('change', function() {
            const templateId = this.value;
            const template = templates.find(t => t.id === templateId);
            
            if (template) {
                // Reemplazar variables en el mensaje
                let message = template.content;
                message = message.replace(/{{nombre}}/g, contact.name);
                message = message.replace(/{{servicio}}/g, 'nuestro servicio');
                message = message.replace(/{{fecha}}/g, new Date().toLocaleDateString());
                message = message.replace(/{{precio}}/g, '$99');
                
                templatePreview.textContent = message;
                previewContainer.style.display = 'block';
            } else {
                previewContainer.style.display = 'none';
            }
        });
        
        document.getElementById('cancel-send').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        document.getElementById('confirm-send').addEventListener('click', () => {
            const templateId = selectTemplate.value;
            if (!templateId) {
                showToast('Selecciona una plantilla', 'error');
                return;
            }
            
            const template = templates.find(t => t.id === templateId);
            if (!template) return;
            
            // Reemplazar variables en el mensaje
            let message = template.content;
            message = message.replace(/{{nombre}}/g, contact.name);
            message = message.replace(/{{servicio}}/g, 'nuestro servicio');
            message = message.replace(/{{fecha}}/g, new Date().toLocaleDateString());
            message = message.replace(/{{precio}}/g, '$99');
            
            // Crear enlace de WhatsApp
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodedMessage}`;
            
            // Abrir en nueva pestaña
            window.open(whatsappUrl, '_blank');
            
            // Registrar envío
            registerMessageSent(contactId, templateId);
            
            // Cerrar diálogo
            document.body.removeChild(dialog);
            
            showToast(`Enlace de WhatsApp generado para ${contact.name}`, 'success');
        });
    }
}

// Editar contacto
function editContact(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    // Llenar formulario
    document.getElementById('contact-name').value = contact.name;
    document.getElementById('contact-phone').value = contact.phone;
    document.getElementById('contact-group').value = contact.group || '';
    document.getElementById('contact-notes').value = contact.notes || '';
    
    // Cambiar título del modal
    document.querySelector('#contact-modal .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Editar Contacto';
    
    // Cambiar acción del formulario
    const form = document.getElementById('contact-form');
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('contact-name').value;
        const phone = document.getElementById('contact-phone').value;
        const group = document.getElementById('contact-group').value;
        const notes = document.getElementById('contact-notes').value;
        
        // Validar número de teléfono
        const phoneRegex = /^\d{8,15}$/;
        if (!phoneRegex.test(phone)) {
            showToast('Número de teléfono inválido. Debe contener entre 8 y 15 dígitos.', 'error');
            return;
        }
        
        try {
            await db.collection('contacts').doc(contactId).update({
                name: name,
                phone: phone,
                group: group || '',
                notes: notes || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            closeAllModals();
            form.reset();
            form.onsubmit = originalSubmit;
            document.querySelector('#contact-modal .modal-header h3').innerHTML = '<i class="fas fa-user-plus"></i> Nuevo Contacto';
            
            await loadUserData();
            showToast('Contacto actualizado correctamente', 'success');
        } catch (error) {
            console.error('Error actualizando contacto:', error);
            showToast('Error al actualizar el contacto', 'error');
        }
    };
    
    openModal('contact-modal');
}

// Eliminar contacto
async function deleteContact(contactId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) {
        return;
    }
    
    try {
        await db.collection('contacts').doc(contactId).delete();
        await loadUserData();
        showToast('Contacto eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando contacto:', error);
        showToast('Error al eliminar el contacto', 'error');
    }
}

// Poblar plantillas en el formulario de campañas
function populateCampaignTemplates() {
    const select = document.getElementById('campaign-template');
    select.innerHTML = '<option value="">Seleccionar plantilla</option>';
    
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
}

// Enviar mensaje de prueba
function sendTestMessage() {
    if (templates.length === 0) {
        showToast('Primero crea una plantilla para enviar mensajes', 'info');
        openModal('template-modal');
        return;
    }
    
    // Usar la primera plantilla para la prueba
    const template = templates[0];
    const testPhone = '5491122334455'; // Número de prueba
    
    // Reemplazar variables en el mensaje
    let message = template.content;
    message = message.replace(/{{nombre}}/g, 'Cliente de Prueba');
    message = message.replace(/{{servicio}}/g, 'servicio de prueba');
    message = message.replace(/{{fecha}}/g, new Date().toLocaleDateString());
    message = message.replace(/{{precio}}/g, '$99');
    
    // Crear enlace de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${testPhone}?text=${encodedMessage}`;
    
    // Abrir en nueva pestaña
    window.open(whatsappUrl, '_blank');
    
    showToast('Mensaje de prueba generado. Ábrelo en WhatsApp para probarlo.', 'success');
}

// Registrar mensaje enviado
async function registerMessageSent(contactId, templateId) {
    try {
        await db.collection('messages').add({
            userId: currentUser.uid,
            contactId: contactId,
            templateId: templateId,
            sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'sent'
        });
        
        // Actualizar estadísticas
        updateStats();
    } catch (error) {
        console.error('Error registrando mensaje:', error);
    }
}

// Mostrar toast de notificación
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastMessage.textContent = message;
    
    // Configurar icono según el tipo
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle toast-icon';
        toast.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle toast-icon';
        toast.style.backgroundColor = '#f44336';
    } else if (type === 'info') {
        toastIcon.className = 'fas fa-info-circle toast-icon';
        toast.style.backgroundColor = '#2196F3';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle toast-icon';
        toast.style.backgroundColor = '#FF9800';
    }
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Mostrar error
function showError(message) {
    const authScreen = document.getElementById('auth-screen');
    authScreen.innerHTML = `
        <div class="auth-container">
            <div class="auth-header">
                <div class="logo">
                    <i class="fab fa-whatsapp"></i>
                    <h1>WhatsApp Marketing</h1>
                </div>
                <p>Error de configuración</p>
            </div>
            <div class="auth-form">
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Configuración requerida</h3>
                    <p>${message}</p>
                    <p>Por favor, ejecuta primero el archivo <strong>setup.html</strong> para configurar Firebase.</p>
                    <a href="setup.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-cogs"></i> Ir a Configuración
                    </a>
                </div>
            </div>
        </div>
    `;
}

// Obtener mensaje de error de autenticación
function getAuthErrorMessage(errorCode) {
    switch(errorCode) {
        case 'auth/invalid-email':
            return 'El correo electrónico no es válido';
        case 'auth/user-disabled':
            return 'Esta cuenta ha sido deshabilitada';
        case 'auth/user-not-found':
            return 'No existe una cuenta con este correo';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta';
        case 'auth/email-already-in-use':
            return 'Este correo ya está registrado';
        case 'auth/weak-password':
            return 'La contraseña es demasiado débil';
        case 'auth/operation-not-allowed':
            return 'Operación no permitida';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Intenta más tarde';
        default:
            return 'Error de autenticación. Intenta de nuevo';
    }
}

// Obtener nombre de categoría
function getCategoryName(category) {
    const categories = {
        'promocion': 'Promoción',
        'recordatorio': 'Recordatorio',
        'bienvenida': 'Bienvenida',
        'followup': 'Seguimiento',
        'general': 'General'
    };
    
    return categories[category] || category;
}

// Obtener nombre de estado
function getStatusName(status) {
    const statuses = {
        'scheduled': 'Programada',
        'active': 'Activa',
        'paused': 'Pausada',
        'completed': 'Completada',
        'cancelled': 'Cancelada'
    };
    
    return statuses[status] || status;
}

// Obtener nombre de plantilla
function getTemplateName(templateId) {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Plantilla no encontrada';
}

// Formatear fecha
function formatDate(date) {
    if (!date) return 'N/A';
    
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
