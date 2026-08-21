/* ==========================================================================
   BARBA ROJA - DYNAMIC BOOKING SYSTEM & WHATSAPP ENGINE
   ========================================================================== */

// Lista Oficial de Barberos
const DEFAULT_BARBEROS = [
    {
        id: 'luciano',
        nombre: 'Luciano',
        inicial: 'L',
        whatsapp: '5492915376912'
    },
    {
        id: 'juan',
        nombre: 'Juan',
        inicial: 'J',
        whatsapp: '5492914391045'
    },
    {
        id: 'elian',
        nombre: 'Elian',
        inicial: 'E',
        whatsapp: '5492915089217'
    },
    {
        id: 'nahuel',
        nombre: 'Nahuel',
        inicial: 'N',
        whatsapp: '5492914359517'
    }
];

// Lista de Servicios (Con sub-opciones para Colorimetría: Global $60k / Mechas $45k)
const SERVICIOS = [
    {
        id: 'corte-pelo',
        nombre: 'Corte de Pelo',
        precio: 15000,
        duracion: '45 min',
        icono: 'fa-scissors'
    },
    {
        id: 'barba',
        nombre: 'Barba',
        precio: 9000,
        duracion: '30 min',
        icono: 'fa-user-ninja'
    },
    {
        id: 'corte-barba',
        nombre: 'Corte + Barba',
        precio: 24000,
        duracion: '60 min',
        icono: 'fa-crown'
    },
    {
        id: 'colorimetria',
        nombre: 'Colorimetría',
        duracion: '75-90 min',
        icono: 'fa-wand-magic-sparkles',
        isColor: true,
        subOptions: [
            { id: 'global', nombre: 'Colorimetría Global', precio: 60000 },
            { id: 'mechas', nombre: 'Colorimetría Mechas', precio: 45000 }
        ]
    }
];

// Estado Global
let barberosList = [];
let bookedSlots = [];
let wizardState = {
    step: 1,
    serviceId: null,
    serviceName: '',
    servicePrice: 0,
    barberId: null,
    date: '',
    time: '',
    name: '',
    phone: '',
    notes: ''
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadBarbersState();
    loadBookedSlots();
    renderBarberosSection();
    renderServiciosSection();
    setupWizardModal();
    setupEventListeners();
});

function loadBarbersState() {
    const saved = localStorage.getItem('barba_roja_barberos');
    if (saved) {
        try {
            barberosList = JSON.parse(saved);
        } catch (e) {
            barberosList = [...DEFAULT_BARBEROS];
        }
    } else {
        barberosList = [...DEFAULT_BARBEROS];
    }
}

function saveBarbersState() {
    localStorage.setItem('barba_roja_barberos', JSON.stringify(barberosList));
}

function loadBookedSlots() {
    const saved = localStorage.getItem('barba_roja_booked_slots');
    if (saved) {
        try {
            bookedSlots = JSON.parse(saved);
        } catch (e) {
            bookedSlots = [];
        }
    }
}

function saveBookedSlots() {
    localStorage.setItem('barba_roja_booked_slots', JSON.stringify(bookedSlots));
}

// Render Barberos
function renderBarberosSection() {
    const grid = document.getElementById('barberos-grid');
    if (!grid) return;

    grid.innerHTML = barberosList.map(b => `
        <div class="barbero-card">
            <div class="barbero-avatar-placeholder">
                ${b.inicial}
            </div>
            <h3 class="barbero-name">${b.nombre}</h3>
            <button class="btn btn-outline btn-sm full-width margin-top" onclick="openWizardWithBarber('${b.id}')">
                <i class="fa-regular fa-calendar-check"></i> Reservar
            </button>
        </div>
    `).join('');
}

// Render Servicios en la landing (Con opción de elegir Global o Mechas para Colorimetría)
function renderServiciosSection() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;

    grid.innerHTML = SERVICIOS.map(s => {
        if (s.isColor) {
            return `
                <div class="servicio-card colorimetria-card">
                    <div class="servicio-header">
                        <div class="servicio-icon">
                            <i class="fa-solid ${s.icono}"></i>
                        </div>
                        <div>
                            <span class="servicio-precio">$45k - $60k</span>
                            <span class="servicio-duracion">${s.duracion}</span>
                        </div>
                    </div>
                    <h3 class="servicio-title">${s.nombre}</h3>
                    <div class="color-suboptions-btns margin-top">
                        <button class="btn btn-outline btn-sm full-width" onclick="selectColorSubOptionAndWizard('global', 60000)">
                            <i class="fa-solid fa-check"></i> Global ($60.000)
                        </button>
                        <button class="btn btn-outline btn-sm full-width margin-top-sm" onclick="selectColorSubOptionAndWizard('mechas', 45000)">
                            <i class="fa-solid fa-check"></i> Mechas ($45.000)
                        </button>
                    </div>
                </div>
            `;
        } else {
            const precioTransf = Math.round(s.precio * 1.10);
            return `
                <div class="servicio-card">
                    <div class="servicio-header">
                        <div class="servicio-icon">
                            <i class="fa-solid ${s.icono}"></i>
                        </div>
                        <div>
                            <span class="servicio-precio">$${s.precio.toLocaleString()}</span>
                            <span class="servicio-duracion">${s.duracion}</span>
                        </div>
                    </div>
                    <h3 class="servicio-title">${s.nombre}</h3>
                    <p class="text-xs text-muted margin-top">Efectivo: $${s.precio.toLocaleString()} | Transf: $${precioTransf.toLocaleString()}</p>
                    <button class="btn btn-outline btn-sm full-width margin-top" onclick="openWizardWithService('${s.id}')">
                        <i class="fa-solid fa-check"></i> Elegir Servicio
                    </button>
                </div>
            `;
        }
    }).join('');
}

// Handler rápido para Colorimetría desde Landing
window.selectColorSubOptionAndWizard = function(subType, price) {
    wizardState.serviceId = `colorimetria-${subType}`;
    wizardState.serviceName = subType === 'global' ? 'Colorimetría Global' : 'Colorimetría Mechas';
    wizardState.servicePrice = price;
    renderWizardStepServices();
    openWizardModal();
    goToWizardStep(2);
};

// Setup Wizard Modal
function setupWizardModal() {
    renderWizardStepServices();
    renderWizardStepBarbers();
    setupWizardStepDateTime();
}

function renderWizardStepServices() {
    const container = document.getElementById('step-services-grid');
    if (!container) return;

    let html = '';

    SERVICIOS.forEach(s => {
        if (s.isColor) {
            const isGlobalSelected = wizardState.serviceId === 'colorimetria-global';
            const isMechasSelected = wizardState.serviceId === 'colorimetria-mechas';
            const isColorSelected = isGlobalSelected || isMechasSelected;

            html += `
                <div class="step-select-card color-wizard-card ${isColorSelected ? 'selected' : ''}">
                    <div class="card-icon-header">
                        <i class="fa-solid ${s.icono}"></i>
                    </div>
                    <h4 class="card-title-text">${s.nombre}</h4>
                    <p class="text-xs text-muted">Selecciona una opción:</p>
                    <div class="sub-pills-wrap">
                        <button class="sub-pill ${isGlobalSelected ? 'active' : ''}" onclick="selectWizardColorOption('global', 60000)">
                            Global ($60.000)
                        </button>
                        <button class="sub-pill ${isMechasSelected ? 'active' : ''}" onclick="selectWizardColorOption('mechas', 45000)">
                            Mechas ($45.000)
                        </button>
                    </div>
                </div>
            `;
        } else {
            const isSelected = wizardState.serviceId === s.id;
            const precioTransf = Math.round(s.precio * 1.10);
            html += `
                <div class="step-select-card ${isSelected ? 'selected' : ''}" onclick="selectWizardService('${s.id}')">
                    <i class="fa-solid fa-circle-check check-icon"></i>
                    <div class="card-icon-header">
                        <i class="fa-solid ${s.icono}"></i>
                    </div>
                    <h4 class="card-title-text">${s.nombre}</h4>
                    <span class="card-price-text">$${s.precio.toLocaleString()}</span>
                    <span class="text-xs text-muted">Transf (+10%): $${precioTransf.toLocaleString()}</span>
                </div>
            `;
        }
    });

    container.innerHTML = html;
}

window.selectWizardColorOption = function(subType, price) {
    wizardState.serviceId = `colorimetria-${subType}`;
    wizardState.serviceName = subType === 'global' ? 'Colorimetría Global' : 'Colorimetría Mechas';
    wizardState.servicePrice = price;
    renderWizardStepServices();
    updateTicketSummary();
};

window.selectWizardService = function(serviceId) {
    const sObj = SERVICIOS.find(s => s.id === serviceId);
    if (sObj) {
        wizardState.serviceId = sObj.id;
        wizardState.serviceName = sObj.nombre;
        wizardState.servicePrice = sObj.precio;
    }
    renderWizardStepServices();
    updateTicketSummary();
};

function renderWizardStepBarbers() {
    const container = document.getElementById('step-barbers-grid');
    if (!container) return;

    container.innerHTML = barberosList.map(b => `
        <div class="step-select-card barber-step-card ${wizardState.barberId === b.id ? 'selected' : ''}" onclick="selectWizardBarber('${b.id}')">
            <i class="fa-solid fa-circle-check check-icon"></i>
            <div class="barber-avatar-sm">
                ${b.inicial}
            </div>
            <h4 class="card-title-text">${b.nombre}</h4>
        </div>
    `).join('');
}

function setupWizardStepDateTime() {
    const inputFecha = document.getElementById('modal-input-fecha');
    if (!inputFecha) return;

    const today = new Date().toISOString().split('T')[0];
    inputFecha.min = today;
    if (!wizardState.date) {
        wizardState.date = today;
    }
    inputFecha.value = wizardState.date;

    inputFecha.addEventListener('change', (e) => {
        wizardState.date = e.target.value;
        wizardState.time = '';
        renderTimeSlots();
        updateTicketSummary();
    });

    renderTimeSlots();
}

function renderTimeSlots() {
    const container = document.getElementById('modal-time-slots');
    if (!container) return;

    const slots = [
        "10:00 hs", "10:45 hs", "11:30 hs", "12:15 hs", "13:00 hs", 
        "14:00 hs", "14:45 hs", "15:30 hs", "16:15 hs", "17:00 hs", 
        "17:45 hs", "18:30 hs", "19:15 hs", "20:00 hs"
    ];

    const currentBarberId = wizardState.barberId;
    const currentDate = wizardState.date;

    container.innerHTML = slots.map(slot => {
        const slotKey = `${currentBarberId}_${currentDate}_${slot}`;
        const isOccupied = bookedSlots.includes(slotKey);

        if (isOccupied) {
            return `
                <div class="slot-pill occupied" title="Ocupado">
                    ${slot} ❌
                </div>
            `;
        } else {
            return `
                <div class="slot-pill ${wizardState.time === slot ? 'selected' : ''}" onclick="selectWizardTime('${slot}')">
                    ${slot}
                </div>
            `;
        }
    }).join('');
}

window.selectWizardBarber = function(barberId) {
    wizardState.barberId = barberId;
    wizardState.time = '';
    renderWizardStepBarbers();
    renderTimeSlots();
    updateTicketSummary();
};

window.selectWizardTime = function(timeSlot) {
    wizardState.time = timeSlot;
    renderTimeSlots();
    updateTicketSummary();
};

function updateTicketSummary() {
    const ticketServicio = document.getElementById('ticket-servicio');
    const ticketBarbero = document.getElementById('ticket-barbero');
    const ticketFechaHora = document.getElementById('ticket-fechahora');
    const ticketPrecioEfectivo = document.getElementById('ticket-precio-efectivo');
    const ticketPrecioTransf = document.getElementById('ticket-precio-transferencia');

    if (wizardState.serviceName && wizardState.servicePrice) {
        ticketServicio.textContent = wizardState.serviceName;
        ticketPrecioEfectivo.textContent = `$${wizardState.servicePrice.toLocaleString()}`;
        ticketPrecioTransf.textContent = `$${Math.round(wizardState.servicePrice * 1.10).toLocaleString()}`;
    } else {
        ticketServicio.textContent = 'No seleccionado';
        ticketPrecioEfectivo.textContent = '$0';
        ticketPrecioTransf.textContent = '$0';
    }

    const bObj = barberosList.find(b => b.id === wizardState.barberId);
    ticketBarbero.textContent = bObj ? bObj.nombre : 'No seleccionado';

    if (wizardState.date && wizardState.time) {
        const parts = wizardState.date.split('-');
        ticketFechaHora.textContent = `${parts[2]}/${parts[1]}/${parts[0]} - ${wizardState.time}`;
    } else {
        ticketFechaHora.textContent = 'Por seleccionar';
    }
}

function goToWizardStep(stepNumber) {
    if (stepNumber > wizardState.step) {
        if (wizardState.step === 1 && !wizardState.serviceId) {
            showToast('Selecciona un servicio para continuar');
            return;
        }
        if (wizardState.step === 2 && !wizardState.barberId) {
            showToast('Selecciona a tu barbero para continuar');
            return;
        }
        if (wizardState.step === 3 && (!wizardState.date || !wizardState.time)) {
            showToast('Selecciona una fecha y un horario disponible');
            return;
        }
    }

    wizardState.step = stepNumber;

    document.querySelectorAll('.wizard-step').forEach((el, index) => {
        el.classList.toggle('active', (index + 1) === stepNumber);
    });

    for (let i = 1; i <= 4; i++) {
        const ind = document.getElementById(`step-indicator-${i}`);
        if (ind) {
            ind.classList.toggle('active', i === stepNumber);
            ind.classList.toggle('completed', i < stepNumber);
        }
    }

    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnSubmit = document.getElementById('btn-wizard-submit');

    if (btnPrev) btnPrev.style.display = (stepNumber > 1) ? 'inline-flex' : 'none';
    if (btnNext) btnNext.style.display = (stepNumber < 4) ? 'inline-flex' : 'none';
    if (btnSubmit) btnSubmit.style.display = (stepNumber === 4) ? 'inline-flex' : 'none';

    if (stepNumber === 4) {
        updateTicketSummary();
    }
}

window.openWizardModal = function() {
    const modal = document.getElementById('booking-modal-overlay');
    if (modal) {
        goToWizardStep(1);
        modal.classList.add('open');
    }
};

window.closeWizardModal = function() {
    const modal = document.getElementById('booking-modal-overlay');
    if (modal) {
        modal.classList.remove('open');
    }
};

window.openWizardWithBarber = function(barberId) {
    wizardState.barberId = barberId;
    renderWizardStepBarbers();
    openWizardModal();
    goToWizardStep(1);
};

window.openWizardWithService = function(serviceId) {
    const sObj = SERVICIOS.find(s => s.id === serviceId);
    if (sObj && !sObj.isColor) {
        wizardState.serviceId = sObj.id;
        wizardState.serviceName = sObj.nombre;
        wizardState.servicePrice = sObj.precio;
        renderWizardStepServices();
        openWizardModal();
        goToWizardStep(2);
    } else {
        openWizardModal();
        goToWizardStep(1);
    }
};

function setupEventListeners() {
    document.getElementById('btn-trigger-booking')?.addEventListener('click', openWizardModal);
    document.getElementById('hero-btn-booking')?.addEventListener('click', openWizardModal);
    document.getElementById('btn-close-booking-modal')?.addEventListener('click', closeWizardModal);

    document.getElementById('btn-wizard-prev')?.addEventListener('click', () => {
        if (wizardState.step > 1) goToWizardStep(wizardState.step - 1);
    });

    document.getElementById('btn-wizard-next')?.addEventListener('click', () => {
        if (wizardState.step < 4) goToWizardStep(wizardState.step + 1);
    });

    document.getElementById('btn-wizard-submit')?.addEventListener('click', handleWizardSubmit);

    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }

    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const modalSettings = document.getElementById('settings-modal');
    const btnSavePhones = document.getElementById('btn-save-phones');

    if (btnOpenSettings && modalSettings) {
        btnOpenSettings.addEventListener('click', () => {
            renderModalPhones();
            modalSettings.classList.add('open');
        });
    }

    if (btnCloseSettings && modalSettings) {
        btnCloseSettings.addEventListener('click', () => {
            modalSettings.classList.remove('open');
        });
    }

    if (btnSavePhones && modalSettings) {
        btnSavePhones.addEventListener('click', () => {
            barberosList.forEach(b => {
                const inputEl = document.getElementById(`phone-input-${b.id}`);
                if (inputEl && inputEl.value) {
                    b.whatsapp = inputEl.value.trim().replace(/\+/g, '').replace(/\s+/g, '');
                }
            });
            saveBarbersState();
            modalSettings.classList.remove('open');
            showToast('Números de WhatsApp guardados');
        });
    }
}

function renderModalPhones() {
    const list = document.getElementById('barbers-phones-list');
    if (!list) return;

    list.innerHTML = barberosList.map(b => `
        <div class="phone-item">
            <label for="phone-input-${b.id}">${b.nombre}:</label>
            <input type="text" id="phone-input-${b.id}" value="${b.whatsapp}" placeholder="5492915376912">
        </div>
    `).join('');
}

// Envío Final por WhatsApp
function handleWizardSubmit() {
    const nombre = document.getElementById('modal-input-nombre').value.trim();
    const telefono = document.getElementById('modal-input-telefono').value.trim();
    const notas = document.getElementById('modal-input-notas').value.trim();

    if (!nombre || !telefono) {
        showToast('Por favor completa tu nombre y teléfono de contacto');
        return;
    }

    const bObj = barberosList.find(b => b.id === wizardState.barberId);

    if (!wizardState.serviceName || !bObj) {
        showToast('Información incompleta');
        return;
    }

    const targetPhone = bObj.whatsapp || '5492914022478';
    const dateParts = wizardState.date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    const precioEfectivo = wizardState.servicePrice.toLocaleString();
    const precioTransferencia = Math.round(wizardState.servicePrice * 1.10).toLocaleString();

    let message = `¡Hola ${bObj.nombre}! Quiero realizar mi próximo corte:\n\n` +
        `✂️ *Servicio:* ${wizardState.serviceName}\n` +
        `📅 *Fecha:* ${formattedDate}\n` +
        `⏰ *Horario:* ${wizardState.time}\n` +
        `💵 *Total a pagar:* $${precioEfectivo} (Efectivo) / $${precioTransferencia} (Transferencia)\n\n` +
        `👤 *Cliente:* ${nombre}\n` +
        `📱 *Teléfono:* ${telefono}`;

    if (notas) {
        message += `\n📝 *Nota:* ${notas}`;
    }

    const slotKey = `${wizardState.barberId}_${wizardState.date}_${wizardState.time}`;
    if (!bookedSlots.includes(slotKey)) {
        bookedSlots.push(slotKey);
        saveBookedSlots();
    }

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
    closeWizardModal();
    showToast(`Turno agendado con ${bObj.nombre}. Redirigiendo a WhatsApp...`);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}
