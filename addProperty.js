// addProperty.js - Property Form Handler with Backend Integration

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated and is an owner
  if (!ApiService.isAuthenticated()) {
    alert('Please login to list a property');
    window.location.href = 'login.html';
    return;
  }

  if (!ApiService.isOwner()) {
    alert('Only property owners can list properties');
    window.location.href = 'search.html';
    return;
  }

  const form = document.getElementById('propertyForm');
  const imageInput = document.getElementById('propertyImages');
  const previewArea = document.getElementById('previewArea');

  // Image preview functionality
  imageInput?.addEventListener('change', (e) => {
    previewArea.innerHTML = '';
    const files = e.target.files;
    
    if (files.length > 10) {
      alert('Maximum 10 images allowed');
      imageInput.value = '';
      return;
    }

    Array.from(files).forEach((file, index) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum 5MB per image.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgPreview = document.createElement('div');
        imgPreview.style.cssText = 'display:inline-block;margin:0.5rem;position:relative';
        imgPreview.innerHTML = `
          <img src="${event.target.result}" 
               style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:2px solid rgba(255,255,255,0.1)">
          <span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:white;border-radius:4px;padding:2px 6px;font-size:11px">${index + 1}</span>
        `;
        previewArea.appendChild(imgPreview);
      };
      reader.readAsDataURL(file);
    });
  });

  // Form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Get form values
    const title = document.getElementById('propertyTitle').value.trim();
    const price = document.getElementById('propertyPrice').value;
    const bedrooms = document.getElementById('propertyBHK').value;
    const address = document.getElementById('propertyAddress').value.trim();
    const images = imageInput.files;

    // Basic validation
    if (!title || !price || !address) {
      alert('Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      const proceed = confirm('No images uploaded. Do you want to continue without images?');
      if (!proceed) return;
    }

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // Prepare property data
      const propertyData = {
        title: title,
        description: `${bedrooms} BHK property in ${address}`, // Basic description
        address: address,
        city: address.split(',').pop().trim(), // Extract city from address
        price: parseFloat(price),
        size: 1000, // Default size - you can add a field for this
        bedrooms: parseInt(bedrooms),
        parking: false, // You can add checkboxes for these
        balcony: false,
        amenities: [], // You can add a field for amenities
        isPublished: true
      };

      // Call backend API
      const response = await ApiService.createProperty(propertyData, images);

      console.log('Property created:', response);
      alert('Property listed successfully!');

      // Reset form
      form.reset();
      previewArea.innerHTML = '';

      // Redirect to properties page or show success message
      const viewProperty = confirm('Property created! Would you like to view it?');
      if (viewProperty) {
        window.location.href = `search.html`;
      }

    } catch (error) {
      console.error('Failed to create property:', error);
      alert(error.message || 'Failed to list property. Please try again.');
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});