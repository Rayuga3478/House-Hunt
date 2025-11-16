/* script.js
   Robust image handling:
   - Try to preload the remote image
   - If preload fails -> use inline SVG data URL fallback (guaranteed)
   - Apply images as background-image on .card-media
   - Render results and open details modal on View / card click
*/

document.addEventListener('DOMContentLoaded', () => {
  const $ = (s, ctx = document) => ctx.querySelector(s);

  /* ---------- Helpers ---------- */
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  // Create a simple inline SVG data URL placeholder that visually resembles a house/photo
  function makeHouseSvgDataUrl(label = 'House') {
    // svg dimensions and style are responsive (will scale as background-image)
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
        <defs>
          <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0' stop-color='#2b2b2b'/>
            <stop offset='1' stop-color='#111'/>
          </linearGradient>
        </defs>
        <rect width='1200' height='800' fill='url(#g)'/>
        <g transform='translate(60,60)'>
          <rect x='0' y='320' width='1080' height='360' rx='12' fill='#1f1f1f' />
          <rect x='40' y='360' width='400' height='260' rx='8' fill='#2a2a2a' />
          <rect x='500' y='360' width='520' height='260' rx='8' fill='#333' />
          <rect x='560' y='420' width='200' height='120' rx='6' fill='#f4f6f7' opacity='0.08' />
          <rect x='760' y='420' width='200' height='120' rx='6' fill='#f4f6f7' opacity='0.07' />
          <g transform='translate(20,20)'>
            <text x='0' y='20' font-family='Arial, Helvetica, sans-serif' font-size='34' fill='#d6e8e1'>${escapeHtml(label)}</text>
          </g>
        </g>
      </svg>`.trim();

    // encode properly (URI component safe)
    const data = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    return data;
  }

  // Preload remote image to check if it loads; fallback on timeout/error
  function preloadImage(url, fallbackUrl, timeoutMs = 6000) {
    return new Promise(resolve => {
      if (!url || typeof url !== 'string' || !url.trim()) {
        resolve(fallbackUrl);
        return;
      }

      let done = false;
      const img = new Image();
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          img.src = ''; // stop
          resolve(fallbackUrl);
        }
      }, timeoutMs);

      img.onload = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(url);
        }
      };
      img.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(fallbackUrl);
        }
      };

      // start loading
      img.src = url;
    });
  }

  /* ---------- UI + data ---------- */
  const defaultImageRemote = 'https://images.unsplash.com/photo-1505691723518-36a1fb1d6b79?q=80&w=1600&h=1000&fit=crop';
  const sampleListings = [
    { id:'L1', address:'MG Road, Kanpur', price:12000, bhk:'1', img:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1400&h=900&fit=crop', details:'1 BHK, semi-furnished, AC' },
    { id:'L2', address:'Civil Lines, Kanpur', price:22000, bhk:'2', img:'https://images.unsplash.com/photo-1572120360610-d971b9b4b5d2?q=80&w=1400&h=900&fit=crop', details:'2 BHK, furnished' },
    { id:'L3', address:'Moti Jheel, Kanpur', price:18000, bhk:'1', img:'https://images.unsplash.com/photo-1598928506310-7b3f08e5c34e?q=80&w=1400&h=900&fit=crop', details:'1 BHK, AC available' },
    { id:'L4', address:'Kanpur Cantt', price:28000, bhk:'3', img:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&h=900&fit=crop', details:'3 BHK, family-friendly' },
    { id:'L5', address:'Gomti Nagar, Lucknow', price:25000, bhk:'2', img:'https://images.unsplash.com/photo-1598300054871-84b3f210e2f8?q=80&w=1400&h=900&fit=crop', details:'2 BHK, modern interiors' },
    { id:'L6', address:'Habibganj, Bhopal', price:16000, bhk:'1', img:'https://images.unsplash.com/photo-1572120360610-3c9b0df7c7d8?q=80&w=1400&h=900&fit=crop', details:'1 BHK, cosy & well-lit' },
    { id:'L7', address:'HSR Layout, Bangalore', price:32000, bhk:'2', img:'https://images.unsplash.com/photo-1549187774-b4e9b0445b6e?q=80&w=1400&h=900&fit=crop', details:'2 BHK, premium finishes' },
    { id:'L8', address:'Malabar Hill, Mumbai', price:45000, bhk:'3', img:'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&h=900&fit=crop', details:'3 BHK, sea-facing vibe' }
  ];

  /* ---------- Modal elements ---------- */
  const modal = document.getElementById('propertyModal');
  const modalOverlay = modal?.querySelector('.modal-overlay');
  const modalCloseBtn = modal?.querySelector('.modal-close');
  const modalImageEl = document.getElementById('modalImage');
  const modalAddress = document.getElementById('modalAddress');
  const modalPrice = document.getElementById('modalPrice');
  const modalDetails = document.getElementById('modalDetails');
  const modalContact = document.getElementById('modalContact');
  const modalCloseAction = modal?.querySelector('#modalCloseBtn');

  function openModal(item) {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');

    // try preload remote -> fallback to inline SVG if fail
    const fallbackSvg = makeHouseSvgDataUrl(item.address || 'House');
    preloadImage(item.img, defaultImageRemote).then(workingUrl => {
      // If remote failed and workingUrl equals defaultImageRemote but defaultImageRemote may also fail,
      // so we set background to workingUrl, and modal image to fallbackSvg if remote still broken.
      // Set modal <img> src to workingUrl; if that fails later, use fallbackSvg.
      modalImageEl.src = workingUrl || fallbackSvg;
      modalImageEl.onerror = function () {
        modalImageEl.onerror = null;
        modalImageEl.src = fallbackSvg;
      };
    });

    modalAddress.textContent = item.address || 'Unknown address';
    modalPrice.textContent = '₹' + (Number(item.price) || 0).toLocaleString();
    modalDetails.textContent = item.details || '';
    if (modalContact) modalContact.onclick = () => alert('Contact owner for ' + (item.address || item.id) + ' (demo).');
    modalCloseBtn?.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modalImageEl.src = '';
  }
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCloseAction) modalCloseAction.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Main rendering for search page ---------- */
  const pathname = location.pathname;
  if (pathname.endsWith('search.html') || pathname.endsWith('/search.html')) {

    // load stored local properties first (attach default remote or svg fallback later)
    const stored = JSON.parse(localStorage.getItem('hh-properties') || '[]');
    const normalizedStored = (stored || []).map(s => ({ ...s }));

    const listings = normalizedStored.concat(sampleListings);

    const container = document.getElementById('searchContent');
    if (!container) {
      console.error('searchContent container not found. Add <div id="searchContent" class="container"></div>');
      return;
    }
    container.innerHTML = '';

    // Header + filters (same structure as before)
    const head = document.createElement('div');
    const params = new URLSearchParams(location.search);
    head.innerHTML = `
      <div style="display:flex;align-items:end;gap:2rem;flex-wrap:wrap">
        <h2 style="font-size:2.6rem;margin:0;color:#fff">Search Results</h2>
        <div style="color:rgba(255,255,255,0.75);font-size:1.2rem">Showing results for <strong>${(params.get('q') || 'All Locations')}</strong></div>
      </div>`;
    container.appendChild(head);

    const filterRow = document.createElement('div');
    filterRow.style.marginTop = '1rem';
    filterRow.innerHTML = `
      <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
        <label style="color:rgba(255,255,255,0.85);font-size:1.3rem">
          BHK:
          <select id="filterBhk" style="margin-left:0.6rem;padding:0.4rem;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:#111;color:#fff">
            <option value="">Any</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3+ BHK</option>
          </select>
        </label>
        <label style="color:rgba(255,255,255,0.85);font-size:1.3rem">
          Sort:
          <select id="filterSort" style="margin-left:0.6rem;padding:0.4rem;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:#111;color:#fff">
            <option value="">Relevance</option>
            <option value="LTH">Price: Low to High</option>
            <option value="HTL">Price: High to Low</option>
          </select>
        </label>
        <button id="applyFilters" style="margin-left:0.6rem;padding:0.5rem 0.9rem;border-radius:6px;border:none;background:#1abc9c;color:#041412;font-weight:700;cursor:pointer">Apply</button>
      </div>`;
    container.appendChild(filterRow);

    // results grid
    const gridWrapper = document.createElement('div');
    gridWrapper.style.marginTop = '1.6rem';
    const grid = document.createElement('div'); grid.className = 'results-grid';
    gridWrapper.appendChild(grid);
    container.appendChild(gridWrapper);

    // render results: each card preloads its image and uses fallback SVG if needed
    async function renderResults(items) {
      grid.innerHTML = '';
      if (!items.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;color:rgba(255,255,255,0.7);padding:2rem;border-radius:8px;background:#0e0e0e">No results found.</div>`;
        return;
      }

      // render items sequentially (preload per item)
      for (const it of items) {
        const card = document.createElement('div'); card.className = 'card';
        card.addEventListener('click', () => openModal(it));

        // media container (background)
        const media = document.createElement('div');
        media.className = 'card-media';
        card.appendChild(media);

        // text
        const addr = document.createElement('div'); addr.className = 'card-address'; addr.textContent = it.address;
        const price = document.createElement('div'); price.className = 'card-price'; price.textContent = '₹' + Number(it.price).toLocaleString();
        const details = document.createElement('div'); details.className = 'card-details'; details.textContent = `${it.details} • ${it.bhk} BHK`;
        card.appendChild(addr); card.appendChild(price); card.appendChild(details);

        const footer = document.createElement('div'); footer.className = 'card-footer';
        const viewBtn = document.createElement('button'); viewBtn.className = 'btn-primary view-btn'; viewBtn.dataset.id = it.id; viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', (e) => { e.stopPropagation(); openModal(it); });
        footer.appendChild(viewBtn);
        const meta = document.createElement('div'); meta.style.color = 'rgba(255,255,255,0.6)'; meta.style.fontWeight = '600'; meta.textContent = '1 km away';
        footer.appendChild(meta);
        card.appendChild(footer);

        // append card early so layout is stable
        grid.appendChild(card);

        // choose fallback: inline svg for this address (guaranteed)
        const fallbackSvg = makeHouseSvgDataUrl(it.address || 'House');

        // preload image (remote) with fallback = default remote (which itself may not load)
        const workingUrl = await preloadImage(it.img, defaultImageRemote);

        // If remote fails OR remote blocks load, workingUrl may be defaultImageRemote which may also fail later.
        // We set background to workingUrl; but as an extra guarantee if workingUrl fails to render, the user still sees the svg (CSS can't detect background failures),
        // so we will set background-image to workingUrl (remote) and also set a small inline <img> test to detect if workingUrl truly loads; if not, swap to svg.
        media.style.backgroundImage = `url("${workingUrl.replace(/"/g, '\\"')}")`;
        // Add loaded class immediately after a frame to trigger CSS fade-in
        requestAnimationFrame(() => media.classList.add('loaded'));

        // Extra safety: verify remote actually loads by probing it (non-blocking)
        (function verifyBackground(url, mediaEl, svgFallback) {
          const probe = new Image();
          probe.onload = () => { /* ok, remote loaded */ };
          probe.onerror = () => {
            // remote did not load -> switch to svg fallback
            if (mediaEl) {
              mediaEl.style.backgroundImage = `url("${svgFallback}")`;
            }
          };
          probe.src = url;
          // also set a timeout: if not loaded in 6s, swap to svg
          setTimeout(() => {
            if (probe.complete === false) {
              if (mediaEl) mediaEl.style.backgroundImage = `url("${svgFallback}")`;
            }
          }, 6200);
        })(workingUrl, media, fallbackSvg);
      } // end for
    } // end renderResults

    // initial filters from URL
    const paramsObj = new URLSearchParams(location.search);
    const qParam = (paramsObj.get('q') || '').toLowerCase();
    const bhkParam = (paramsObj.get('bhk') || '').toLowerCase();
    const rentParam = (paramsObj.get('rent') || '').toLowerCase();

    function applyInitialFilters() {
      let res = listings.slice();
      if (qParam) res = res.filter(r => (r.address + ' ' + r.details).toLowerCase().includes(qParam));
      if (bhkParam) res = res.filter(r => r.bhk.toString() === bhkParam);
      if (rentParam && (rentParam.toUpperCase() === 'LTH' || rentParam.toUpperCase() === 'HTL')) {
        if (rentParam.toUpperCase() === 'LTH') res.sort((a,b)=>a.price-b.price);
        else res.sort((a,b)=>b.price-a.price);
      }
      renderResults(res);
    }
    applyInitialFilters();

    // wire filter apply button
    const filterBhk = document.getElementById('filterBhk');
    const filterSort = document.getElementById('filterSort');
    const applyBtn = document.getElementById('applyFilters');
    if (filterBhk && bhkParam) filterBhk.value = bhkParam;
    if (filterSort && rentParam) filterSort.value = rentParam;
    applyBtn?.addEventListener('click', () => {
      let res = listings.slice();
      const selB = filterBhk?.value || '';
      const selS = filterSort?.value || '';
      if (qParam) res = res.filter(r => (r.address + ' ' + r.details).toLowerCase().includes(qParam));
      if (selB) res = res.filter(r => r.bhk.toString() === selB);
      if (selS) {
        if (selS === 'LTH') res.sort((a,b)=>a.price-b.price);
        else if (selS === 'HTL') res.sort((a,b)=>b.price-a.price);
      }
      renderResults(res);
    });

  } // end search page block

  console.log('HouseHunt: script initialized (preload + svg fallback).');
});
