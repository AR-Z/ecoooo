document.addEventListener('DOMContentLoaded', () => {
  let itemsData = [];
  let offerItems = [];
  let requestItems = [];

  const availableItemsContainer = document.getElementById('availableItems');
  const offerList = document.getElementById('offerList');
  const requestList = document.getElementById('requestList');
  const robuxBox = document.getElementById('robuxBox');
  const clearSelectionBtn = document.getElementById('clearSelection');
  const offerRobuxInput = document.getElementById('offerRobux');
  const requestRobuxInput = document.getElementById('requestRobux');

  // Helper: Remove commas and parse value as float
  function parseValue(val) {
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
  }

  // Fetch available items from the API
  async function loadItems() {
    try {
      const res = await fetch('/api/items');
      itemsData = await res.json();
      displayAvailableItems(itemsData);
    } catch (err) {
      console.error("Error loading items:", err);
    }
  }

  // Display available items with "Add to Offer" and "Add to Request" buttons
  function displayAvailableItems(data) {
    availableItemsContainer.innerHTML = data.map((item, index) => {
      return `
        <div class="available-item glass-card p-4" data-index="${index}">
          <img src="${item.image}" alt="${item.name}" class="w-full h-40 object-contain rounded mb-2" />
          <h3 class="text-lg font-bold">${item.name}</h3>
          <p class="mt-1">Value: ${item.value}</p>
          <div class="mt-2 flex gap-2">
            <button class="add-offer px-2 py-1 bg-green-500 rounded">Add to Offer</button>
            <button class="add-request px-2 py-1 bg-blue-500 rounded">Add to Request</button>
          </div>
        </div>
      `;
    }).join('');
    attachAvailableItemEvents();
  }

  // Attach click events for available items
  function attachAvailableItemEvents() {
    availableItemsContainer.querySelectorAll('.available-item').forEach(card => {
      const index = card.getAttribute('data-index');
      const item = itemsData[index];

      card.querySelector('.add-offer').addEventListener('click', (e) => {
        e.stopPropagation();
        addToOffer(item);
      });

      card.querySelector('.add-request').addEventListener('click', (e) => {
        e.stopPropagation();
        addToRequest(item);
      });
    });
  }

  // Add item to Offer list (limit 4 items per side)
  function addToOffer(item) {
    if (offerItems.length >= 4) {
      alert("Offer list is limited to 4 items.");
      return;
    }
    offerItems.push(item);
    updateLists();
  }

  // Add item to Request list (limit 4 items per side)
  function addToRequest(item) {
    if (requestItems.length >= 4) {
      alert("Request list is limited to 4 items.");
      return;
    }
    requestItems.push(item);
    updateLists();
  }

  // Remove item from Offer list by index
  function removeFromOffer(index) {
    offerItems.splice(index, 1);
    updateLists();
  }

  // Remove item from Request list by index
  function removeFromRequest(index) {
    requestItems.splice(index, 1);
    updateLists();
  }

  // Update the Offer and Request displays and recalculate totals
  function updateLists() {
    offerList.innerHTML = offerItems.map((item, idx) => {
      const value = parseValue(item.value);
      return `
        <div class="selected-item">
          <img src="${item.image}" alt="${item.name}">
          <span>${item.name} - ${value}</span>
          <button class="remove-offer" data-index="${idx}">&times;</button>
        </div>
      `;
    }).join("");

    requestList.innerHTML = requestItems.map((item, idx) => {
      const value = parseValue(item.value);
      return `
        <div class="selected-item">
          <img src="${item.image}" alt="${item.name}">
          <span>${item.name} - ${value}</span>
          <button class="remove-request" data-index="${idx}">&times;</button>
        </div>
      `;
    }).join("");

    // Attach remove button events
    offerList.querySelectorAll('.remove-offer').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        removeFromOffer(idx);
      });
    });
    requestList.querySelectorAll('.remove-request').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        removeFromRequest(idx);
      });
    });

    calculateTotals();
    clearSelectionBtn.style.display = (offerItems.length > 0 || requestItems.length > 0) ? "block" : "none";
  }

  // Calculate totals and update the Robux Box
  function calculateTotals() {
    const offerTotal = offerItems.reduce((sum, item) => sum + parseValue(item.value), 0) + Number(offerRobuxInput.value || 0);
    const requestTotal = requestItems.reduce((sum, item) => sum + parseValue(item.value), 0) + Number(requestRobuxInput.value || 0);
    const net = offerTotal - requestTotal;
    robuxBox.textContent = `Offer Total: ${offerTotal} | Request Total: ${requestTotal} | Net: ${net}`;
  }

  // Clear all selections
  clearSelectionBtn.addEventListener('click', () => {
    offerItems = [];
    requestItems = [];
    updateLists();
  });

  // Update totals when Robux inputs change
  offerRobuxInput.addEventListener('input', calculateTotals);
  requestRobuxInput.addEventListener('input', calculateTotals);

  loadItems();
});
