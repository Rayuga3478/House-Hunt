// search.js - Updated Search with Backend Integration

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('searchContent');
  if (!container) return;

  container.innerHTML = '';

  // Parse URL parameters
  const params = new URLSearchParams(location.search);
  const searchQuery = params.get('q') || '';
  const bhkFilter = params.get('bhk') || '';
  const sortFilter = params.get('sort') || '';

  // Create header
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display:flex;align-items:end;gap:2rem;flex-wrap:wrap;margin-bottom:2rem">
      <h2 style="font-size:2.6rem;margin:0;color:#fff">Search Results</h2>
      <div style="color:rgba(255,255,255,0.75);font-size:1.2rem">
        ${searchQuery ? `Showing results for <strong>${searchQuery}</strong>` : 'All Properties'}
      </div>
    </div>
  `;
  container.appendChild(header);

  // Create filter controls
  const filterRow = document.createElement('div');
  filterRow.style.marginTop = '1rem';
  filterRow.innerHTML = `
    <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
      <label style="color:rgba(255,255,255,0.85);font-size:1.3rem">
        BHK:
        <select id="filterBhk" style="margin-left:0.6rem;padding:0.4rem;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:#111;color:#fff">
          <option value="">Any</option>
          <option value="1" ${bhkFilter === '1' ? 'selected' : ''}>1 BHK</option>
          <option value="2" ${bhkFilter === '2' ? 'selected' : ''}>2 BHK</option>
          <option value="3" ${bhkFilter === '3' ? 'selected' : ''}>3+ BHK</option>
        </select>
      </label>
      <label style="color:rgba(255,255,255,0.85);font-size:1.3rem">
        Sort:
        <select id="filterSort" style="margin-left:0.6rem;padding:0.4rem;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:#111;color:#fff">
          <option value="">Relevance</option>
          <option value="price_asc" ${sortFilter === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
          <option value="price_desc" ${sortFilter === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
          <option value="newest" ${sortFilter === 'newest' ? 'selected' : ''}>Newest First</option>
        </select>
      </label>
      <button id="applyFilters" style="margin-left:0.6rem;padding:0.5rem 0.9rem;border-radius:6px;border:none;background:#1abc9c;color:#041412;font-weight:700;cursor:pointer">Apply</button>
    </div>
  `;
  container.appendChild(filterRow);

  // Results grid
  const gridWrapper = document.createElement('div');
  gridWrapper.style.marginTop = '1.6rem';
  const grid = document.createElement('div');
  grid.className = 'results-grid';
  gridWrapper.appendChild(grid);
  container.appendChild(gridWrapper);

  // Loading state
  function showLoading() {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:rgba(255,255,255,0.7)">Loading properties...</div>';
  }

  // Render properties
  function renderProperties(properties) {
    grid.innerHTML = '';

    if (!properties || properties.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;color:rgba(255,255,255,0.7);padding:2rem;border-radius:8px;background:#0e0e0e;text-align:center">No properties found.</div>';
      return;
    }

    properties.forEach(property => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';

      // Get first image or use placeholder
      const imageUrl = property.images && property.images.length > 0 
        ? `https://house-hunt-5sg5.onrender.com${property.images[0]}`
        : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

      card.innerHTML = `
        <div class="card-media" style="background-image:url('${imageUrl}');width:100%;height:18.5rem;border-radius:8px;background-size:cover;background-position:center"></div>
        <div class="card-address">${property.location.address}</div>
        <div class="card-price">₹${Number(property.price).toLocaleString()}/month</div>
        <div class="card-details">${property.bedrooms} BHK • ${property.parking ? 'Parking' : 'No Parking'} • ${property.balcony ? 'Balcony' : 'No Balcony'}</div>
        <div class="card-footer">
          <button class="btn-primary view-btn" data-id="${property._id}">View Details</button>
          <div style="color:rgba(255,255,255,0.6);font-weight:600">${property.location.city}</div>
        </div>
      `;

      // Add click handler
      card.addEventListener('click', () => showPropertyDetails(property));

      grid.appendChild(card);
    });
  }

  // Fetch properties from backend
  async function fetchProperties() {
    showLoading();

    try {
      const filters = {
        q: searchQuery,
        bedrooms: document.getElementById('filterBhk')?.value || bhkFilter,
        sort: document.getElementById('filterSort')?.value || sortFilter,
        page: 1,
        limit: 20
      };

      const response = await ApiService.getProperties(filters);
      console.log('Properties fetched:', response);

      renderProperties(response.data);

    } catch (error) {
      console.error('Failed to fetch properties:', error);
      grid.innerHTML = '<div style="grid-column:1/-1;color:rgba(255,100,100,0.9);padding:2rem;text-align:center">Failed to load properties. Please try again.</div>';
    }
  }

  // Show property details in modal
  function showPropertyDetails(property) {
    const modal = document.getElementById('propertyModal');
    if (!modal) return;

    const imageUrl = property.images && property.images.length > 0 
      ? `https://house-hunt-5sg5.onrender.com${property.images[0]}`
      : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';

    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalAddress').textContent = property.location.address;
    document.getElementById('modalPrice').textContent = '₹' + Number(property.price).toLocaleString() + '/month';
    
    const details = `
      <p><strong>City:</strong> ${property.location.city}</p>
      <p><strong>Bedrooms:</strong> ${property.bedrooms} BHK</p>
      <p><strong>Size:</strong> ${property.size} sq ft</p>
      <p><strong>Parking:</strong> ${property.parking ? 'Available' : 'Not Available'}</p>
      <p><strong>Balcony:</strong> ${property.balcony ? 'Yes' : 'No'}</p>
      ${property.amenities && property.amenities.length > 0 ? `<p><strong>Amenities:</strong> ${property.amenities.join(', ')}</p>` : ''}
      <p><strong>Description:</strong> ${property.description}</p>
    `;
    document.getElementById('modalDetails').innerHTML = details;

    // Contact button
    const contactBtn = document.getElementById('modalContact');
    if (contactBtn) {
      contactBtn.onclick = () => {
        if (property.owner && property.owner.phone) {
          alert(`Contact: ${property.owner.name}\nPhone: ${property.owner.phone}\nEmail: ${property.owner.email}`);
        } else {
          alert('Contact information not available');
        }
      };
    }

    modal.setAttribute('aria-hidden', 'false');
  }

  // Modal close handlers
  const modal = document.getElementById('propertyModal');
  const closeModal = () => modal?.setAttribute('aria-hidden', 'true');
  
  document.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
  document.querySelector('.modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);

  // Apply filters button
  document.getElementById('applyFilters')?.addEventListener('click', fetchProperties);

  // Initial load
  fetchProperties();
});