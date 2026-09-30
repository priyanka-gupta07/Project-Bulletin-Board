const grid = document.querySelector('#event-grid');
const status = document.querySelector('#events-status');
const retry = document.querySelector('#events-retry');
const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const priceFormat = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });

function element(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function formatDate(value) {
    return value ? dateFormat.format(new Date(`${value}T00:00:00`)) : 'Date to be announced';
}

function eventCard(event, index) {
    const card = element('article', 'event-card', '');
    const banner = element('div', `event-image ${['git', 'science', 'garba', 'valorant'][index % 4]}`, '');
    banner.append(element('strong', '', event.Event_Name));
    card.append(banner);
    if (event.Eligibility) card.append(element('span', 'tag', event.Eligibility));
    const info = element('div', 'event-info', '');
    const dates = formatDate(event.Start_Date) + (event.End_Date && event.End_Date !== event.Start_Date ? ` – ${formatDate(event.End_Date)}` : '');
    info.append(element('p', '', `▣ ${dates}`));
    info.append(element('p', '', `⌖ ${[event.Venue_Name, event.Location].filter(Boolean).join(', ') || 'Venue to be announced'}`));
    const fee = event.Registration_FEE;
    info.append(element('span', `price${fee !== null && Number(fee) === 0 ? ' free' : ''}`,
        fee === null ? 'Fee to be announced' : Number(fee) === 0 ? 'Free' : priceFormat.format(Number(fee))));
    card.append(info);
    return card;
}

async function loadEvents() {
    status.textContent = 'Loading events…';
    retry.hidden = true;
    grid.replaceChildren();
    try {
        const response = await fetch('/api/events', { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error('Could not load events');
        const events = await response.json();
        grid.replaceChildren(...events.map(eventCard));
        status.textContent = events.length ? '' : 'No upcoming events yet. Check back soon!';
    } catch {
        status.textContent = 'Unable to load events. Please try again.';
        retry.hidden = false;
    }
}

retry.addEventListener('click', loadEvents);
loadEvents();
