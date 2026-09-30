const grid = document.querySelector('#event-grid');
const status = document.querySelector('#events-status');
const retry = document.querySelector('#events-retry');
const search = document.querySelector('#event-search');
const savedFilter = document.querySelector('#saved-filter');
const summary = document.querySelector('#filter-summary');
const dialog = document.querySelector('#event-dialog');
const dialogSave = document.querySelector('#dialog-save');
const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const priceFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const storageKey = 'spit-saved-events';
let events = [];
let category = '';
let savedOnly = false;
let loaded = false;
let selectedEvent = null;
let saved = new Set();
try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) saved = new Set(stored.filter(Number.isInteger));
} catch { /* Saving still works for this page when storage is unavailable. */ }

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
    updateSaveButton(dialogSave, event);
    dialog.showModal();
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
    card.append(info, actions);
    return card;
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
        const response = await fetch('/api/events', { signal: AbortSignal.timeout(10000) });
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
search.addEventListener('input', renderEvents);
savedFilter.addEventListener('click', () => { savedOnly = !savedOnly; renderEvents(); });
document.querySelector('#clear-filters').addEventListener('click', clearFilters);
document.querySelectorAll('[data-show-all]').forEach(link => link.addEventListener('click', clearFilters));
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => {
    category = category === button.dataset.category ? '' : button.dataset.category;
    renderEvents();
    document.querySelector('#events').scrollIntoView({ behavior: 'smooth' });
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialogSave.addEventListener('click', () => { if (selectedEvent) toggleSaved(selectedEvent); });
dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
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
