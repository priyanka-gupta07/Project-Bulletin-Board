const grid = document.querySelector('#event-grid');
const status = document.querySelector('#events-status');
const retry = document.querySelector('#events-retry');
const search = document.querySelector('#event-search');
const savedFilter = document.querySelector('#saved-filter');
const summary = document.querySelector('#filter-summary');
const dialog = document.querySelector('#event-dialog');
const dialogSave = document.querySelector('#dialog-save');
const addEventDialog = document.querySelector('#add-event-dialog');
const addEventForm = document.querySelector('#add-event-form');
const newEventDate = document.querySelector('#new-event-date');
const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const priceFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const storageKey = 'spit-saved-events';
const ownerKey = 'spit-event-owner';
let ownerId;
let events = [];
let category = '';
let savedOnly = false;
let loaded = false;
let selectedEvent = null;
let editingEventId = null;
let saved = new Set();

function newOwnerId() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
        const value = Math.floor(Math.random() * 16);
        return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
    });
}

function openDialog(target) {
    if (typeof target.showModal === 'function') target.showModal();
    else {
        target.classList.add('dialog-fallback');
        target.setAttribute('open', '');
    }
}

function closeDialog(target) {
    if (typeof target.close === 'function' && target.open) target.close();
    else target.removeAttribute('open');
    target.classList.remove('dialog-fallback');
}

try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(Number.isInteger));
} catch { /* Saving still works for this page when storage is unavailable. */ }
try {
    ownerId = localStorage.getItem(ownerKey);
    if (!ownerId) {
        ownerId = newOwnerId();
        localStorage.setItem(ownerKey, ownerId);
    }
} catch { ownerId = newOwnerId(); }
const today = new Date();
newEventDate.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// The existing schema has no category column. Match descriptive event names.
const categoryPatterns = {
    Technical: /code|coding|robot|tech|hack|science|\bgit\b|programming/i,
    Workshops: /workshop|bootcamp|training/i,
    Cultural: /cultural|garba|dance|music|drama|art\b/i,
    Sports: /sport|cricket|football|basketball|badminton|athletic/i,
    Conclaves: /conclave|conference|summit/i,
    Competitions: /competition|championship|challenge|tournament|sprint|hackathon|contest|debate/i,
    'Fun & Gaming': /gaming|game|valorant|esport|quiz|fun/i,
    Social: /social|volunteer|community|charity|outreach/i,
};

function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function formatDate(value) {
    return value ? dateFormat.format(new Date(`${value}T00:00:00`)) : 'Date to be announced';
}

function dates(event) {
    return formatDate(event.Start_Date) + (event.End_Date && event.End_Date !== event.Start_Date ? ` – ${formatDate(event.End_Date)}` : '');
}

function fee(event) {
    return event.Registration_FEE === null ? 'Fee to be announced' : Number(event.Registration_FEE) === 0 ? 'Free' : priceFormat.format(Number(event.Registration_FEE));
}

function venue(event) {
    return [event.Venue_Name, event.Location].filter(Boolean).join(', ') || 'Venue to be announced';
}

function updateSaveButton(button, event) {
    const active = saved.has(event.Event_ID);
    button.textContent = active ? '♥ Saved' : '♡ Save event';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Unsave' : 'Save'} ${event.Event_Name}`);
}

function toggleSaved(event) {
    if (saved.has(event.Event_ID)) saved.delete(event.Event_ID);
    else saved.add(event.Event_ID);
    try {
        localStorage.setItem(storageKey, JSON.stringify([...saved]));
        document.querySelector('#save-status').textContent = saved.has(event.Event_ID) ? 'Event saved in this browser.' : 'Event removed from saved events.';
    } catch {
        document.querySelector('#save-status').textContent = 'Browser storage is unavailable. Saved events will last until you reload this page.';
    }
    // Preserve keyboard focus when updating a card's save button.
    const focusedId = document.activeElement?.dataset.saveId;
    renderEvents();
    if (focusedId) {
        const replacement = [...grid.querySelectorAll('[data-save-id]')].find(button => button.dataset.saveId === focusedId);
        (replacement || savedFilter).focus();
    }
    if (selectedEvent) updateSaveButton(dialogSave, selectedEvent);
}

function showDetails(event) {
    selectedEvent = event;
    document.querySelector('#event-title').textContent = event.Event_Name;
    const details = document.querySelector('#event-details');
    details.replaceChildren();
    for (const [label, value] of [
        ['Dates', dates(event)], ['Venue', venue(event)],
        ['Eligibility', event.Eligibility || 'To be announced'],
        ['Registration fee', fee(event)],
        ['Maximum participants', event.Max_participants ?? 'To be announced'],
    ]) details.append(element('dt', '', label), element('dd', '', String(value)));
    if (event.Registration_Link) {
        const label = element('dt', '', 'Registration');
        const description = element('dd', '', '');
        const link = element('a', '', 'Open registration form ↗');
        link.href = event.Registration_Link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        description.append(link);
        details.append(label, description);
    }
    updateSaveButton(dialogSave, event);
    openDialog(dialog);
}

function eventCard(event, index) {
    const card = element('article', 'event-card', '');
    const banner = element('button', `event-image event-open ${['git', 'science', 'garba', 'valorant'][index % 4]}`, '');
    banner.type = 'button';
    banner.setAttribute('aria-label', `View details for ${event.Event_Name}`);
    banner.append(element('strong', '', event.Event_Name));
    banner.addEventListener('click', () => showDetails(event));
    card.append(banner);
    if (event.Eligibility) card.append(element('span', 'tag', event.Eligibility));
    const info = element('div', 'event-info', '');
    info.append(element('p', '', `▣ ${dates(event)}`));
    info.append(element('p', '', `⌖ ${venue(event)}`));
    info.append(element('span', `price${event.Registration_FEE !== null && Number(event.Registration_FEE) === 0 ? ' free' : ''}`, fee(event)));
    const actions = element('div', 'event-actions', '');
    const details = element('button', 'details', 'View details →');
    details.type = 'button';
    details.addEventListener('click', () => showDetails(event));
    const save = element('button', 'details save-event', '');
    save.type = 'button';
    save.dataset.saveId = event.Event_ID;
    updateSaveButton(save, event);
    save.addEventListener('click', () => toggleSaved(event));
    actions.append(details, save);
    if (event.Is_Own_Event) {
        const edit = element('button', 'details edit-event', 'Edit');
        edit.type = 'button';
        edit.setAttribute('aria-label', `Edit your event ${event.Event_Name}`);
        edit.addEventListener('click', () => editOwnEvent(event));
        actions.append(edit);
    }
    if (event.Registration_Link) {
        const register = element('a', 'details register-event', 'Register ↗');
        register.href = event.Registration_Link;
        register.target = '_blank';
        register.rel = 'noopener noreferrer';
        actions.append(register);
    }
    if (event.Is_Own_Event) {
        const remove = element('button', 'details delete-event', 'Delete');
        remove.type = 'button';
        remove.setAttribute('aria-label', `Delete your event ${event.Event_Name}`);
        remove.addEventListener('click', () => deleteOwnEvent(event));
        actions.append(remove);
    }
    card.append(info, actions);
    return card;
}

function editOwnEvent(event) {
    editingEventId = event.Event_ID;
    document.querySelector('#add-event-title').textContent = 'Update your event';
    document.querySelector('#save-own-event').textContent = 'Save changes';
    addEventForm.elements.name.value = event.Event_Name;
    addEventForm.elements.date.value = event.Start_Date;
    addEventForm.elements.venue.value = event.Venue_Name || '';
    addEventForm.elements.location.value = event.Location || '';
    addEventForm.elements.eligibility.value = event.Eligibility || '';
    addEventForm.elements.fee.value = event.Registration_FEE ?? '';
    addEventForm.elements.registration_link.value = event.Registration_Link || '';
    openDialog(addEventDialog);
}

async function deleteOwnEvent(event) {
    try {
        const response = await fetch(`/api/events/${event.Event_ID}?owner_id=${encodeURIComponent(ownerId)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Could not delete event');
        events = events.filter(item => item.Event_ID !== event.Event_ID);
        saved.delete(event.Event_ID);
        localStorage.setItem(storageKey, JSON.stringify([...saved]));
        if (selectedEvent?.Event_ID === event.Event_ID) closeDialog(dialog);
        document.querySelector('#save-status').textContent = 'Your event was deleted.';
        renderEvents();
    } catch {
        document.querySelector('#save-status').textContent = 'Could not delete your event. Please try again.';
    }
}

async function addOwnEvent(form) {
    const data = new FormData(form);
    const feeValue = data.get('fee');
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
        const response = await fetch(editingEventId === null ? '/api/events' : `/api/events/${editingEventId}`, {
            method: editingEventId === null ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                owner_id: ownerId,
                event_name: data.get('name').trim(),
                start_date: data.get('date'),
                eligibility: data.get('eligibility').trim() || null,
                registration_fee: feeValue === '' ? null : Number(feeValue),
                registration_link: data.get('registration_link').trim() || null,
                venue_name: data.get('venue').trim() || null,
                location: data.get('location').trim() || null,
            }),
        });
        if (!response.ok) throw new Error('Could not save event');
        const event = await response.json();
        if (editingEventId === null) events.unshift(event);
        else events = events.map(item => item.Event_ID === editingEventId ? event : item);
        category = '';
        savedOnly = false;
        search.value = '';
        form.reset();
        editingEventId = null;
        document.querySelector('#add-event-title').textContent = 'Pin an event to the board';
        submit.textContent = 'Add event';
        closeDialog(addEventDialog);
        document.querySelector('#save-status').textContent = 'Your event was saved to the board.';
        renderEvents();
    } catch {
        document.querySelector('#save-status').textContent = 'Could not save your event. Check that MySQL is running and try again.';
    } finally {
        submit.disabled = false;
    }
}

function renderEvents() {
    savedFilter.textContent = `Saved events (${events.filter(event => saved.has(event.Event_ID)).length})`;
    savedFilter.setAttribute('aria-pressed', String(savedOnly));
    document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    summary.textContent = [category, savedOnly ? 'Saved events' : '', search.value.trim() ? `Search: ${search.value.trim()}` : ''].filter(Boolean).join(' · ');
    if (!loaded) return;
    const query = search.value.trim().toLowerCase();
    const filtered = events.filter(event =>
        (!category || categoryPatterns[category].test(event.Event_Name)) &&
        (!savedOnly || saved.has(event.Event_ID)) &&
        [event.Event_Name, event.Venue_Name, event.Location, event.Eligibility].filter(Boolean).join(' ').toLowerCase().includes(query));
    grid.replaceChildren(...filtered.map(eventCard));
    status.textContent = filtered.length ? '' : !events.length ? 'No upcoming events yet. Check back soon!' : 'No events match these filters. Try another category or Show all.';
}

function clearFilters() {
    category = '';
    savedOnly = false;
    search.value = '';
    renderEvents();
}

async function loadEvents() {
    loaded = false;
    status.textContent = 'Loading events…';
    retry.hidden = true;
    grid.replaceChildren();
    try {
        const response = await fetch(`/api/events?owner_id=${encodeURIComponent(ownerId)}`, { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Could not load events');
        events = await response.json();
        loaded = true;
        renderEvents();
    } catch {
        status.textContent = 'Unable to load events. Please try again.';
        retry.hidden = false;
    }
}

retry.addEventListener('click', loadEvents);
document.querySelector('#add-event').addEventListener('click', () => {
    editingEventId = null;
    addEventForm.reset();
    document.querySelector('#add-event-title').textContent = 'Pin an event to the board';
    document.querySelector('#save-own-event').textContent = 'Add event';
    openDialog(addEventDialog);
});
document.querySelector('#close-add-event').addEventListener('click', () => closeDialog(addEventDialog));
addEventForm.addEventListener('submit', event => {
    event.preventDefault();
    addOwnEvent(addEventForm);
});
search.addEventListener('input', renderEvents);
savedFilter.addEventListener('click', () => { savedOnly = !savedOnly; renderEvents(); });
document.querySelector('#clear-filters').addEventListener('click', clearFilters);
document.querySelectorAll('[data-show-all]').forEach(link => link.addEventListener('click', clearFilters));
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = category === button.dataset.category ? '' : button.dataset.category;
    renderEvents();
    document.querySelector('#events').scrollIntoView({ behavior: 'smooth' });
}));
document.querySelector('#close-dialog').addEventListener('click', () => closeDialog(dialog));
dialogSave.addEventListener('click', () => { if (selectedEvent) toggleSaved(selectedEvent); });
dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeDialog(dialog);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        document.querySelectorAll('dialog.dialog-fallback[open]').forEach(closeDialog);
    }
});
function updateNavigation() {
    const target = window.location.hash || '#home';
    document.querySelectorAll('.navbar nav a').forEach(link => {
        const active = link.getAttribute('href') === target;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
    });
}
window.addEventListener('hashchange', updateNavigation);
updateNavigation();
loadEvents();
