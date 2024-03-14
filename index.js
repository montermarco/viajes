const searchInput = document.getElementById("search-input");
const searchForm = document.getElementById("search-form");
const entryForm = document.getElementById("entryForm");
const toggleSearch = document.getElementById("toggle-search");
const modalForm = document.getElementById("modal");
const entryTitle = document.getElementById("entryTitle");
const entryLocation = document.getElementById("entryLocation");
const entryDescription = document.getElementById("entryDescription");
const entryPhoto = document.getElementById("entryPhoto");
const favorite = document.getElementById("favorite");
const visitStatus = document.getElementById("visitStatus");
const closeModal = document.querySelector(".close-modal");
const cancelButton = document.querySelector(".cancel");

let map, mapEvent;
let markers = {};

function initMap() {
  navigator.geolocation.getCurrentPosition(successPosition, failPosition);
}
function successPosition(position) {
  const { latitude, longitude } = position.coords;
  map = L.map("map", {
    center: [latitude, longitude],
    zoom: 13,
    zoomControl: false,
  });
  L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
    attribution: "Positron",
  }).addTo(map);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  map.on("click", mapClickHandler);
  loadMarkers();
  loader.style.display = "none";
}
function failPosition() {
  alert("No pudimos obtener tu posición");
}
function mapClickHandler(eventMap) {
  mapEvent = eventMap;
  toggleModal();
}
function toggleModal() {
  modalForm.classList.toggle("hidden");
}
function handleEscapeClose(event) {
  if (event.key === "Escape" && !modalForm.classList.contains("hidden")) {
    toggleModal();
  }
}
function setupFormListeners() {
  entryForm.addEventListener("submit", handleSubmit);
  closeModal.addEventListener("click", toggleModal);
  cancelButton.addEventListener("click", toggleModal);
  document.addEventListener("keydown", handleEscapeClose);
}
function setupUIListeners() {
  toggleSearch.addEventListener("click", () =>
    searchInput.classList.toggle("hidden")
  );
  searchInput.addEventListener("blur", () =>
    searchInput.classList.toggle("hidden")
  );
  searchForm.addEventListener("submit", buscarLugar);
  visitStatus.addEventListener("change", toggleFieldsBasedOnStatus);
}
function attachClickEventToEntries() {
  const entries = document.querySelectorAll(".entry-card");
  entries.forEach((entry) => {
    entry.addEventListener("click", function (e) {
      const entryId =
        this.querySelector(".delete-entry").getAttribute("data-id");
      moveToPopup(entryId);
    });
  });
}

function updateEntriesView() {
  const entriesContainer = document.querySelector(".sidebar");
  entriesContainer.innerHTML = "";

  const entries = JSON.parse(localStorage.getItem("travelEntries")) || [];
  entries.forEach((entry) => {
    const entryDiv = document.createElement("div");
    entryDiv.classList.add("entry-card");
    entryDiv.classList.add(entry.visitStatus);

    let viewMoreLink = "";
    if (entry.visitStatus === "visitado") {
      viewMoreLink = `<a href="entryDetail.html?id=${entry.id}" target="_blank" class="view-more">Ver más</a>`;
    }

    entryDiv.innerHTML = `
    <div class="entry-content">  
    <button class="delete-entry" data-id="${entry.id}">
          <img class="delete-entry--icon" src="imgs/delete.svg" alt="delete-icon">
          </button>
          
      <div class="text-content">
        <h3 class="entry-card-title">${entry.title}</h3>
        <p>${entry.location}</p>
        <p>${entry.description}</p>
        
        <div class="entry-footer">
          ${entry.favorite ? `<span class="favorite">🌟 Favorito</span>` : ""}
          ${viewMoreLink}
        </div>
      </div>
      ${
        entry.photo
          ? `<img class="entry-photo" src="${entry.photo}" alt="Foto de ${entry.title}">`
          : ""
      }
    </div>
  `;
    entriesContainer.appendChild(entryDiv);
  });

  document.querySelectorAll(".delete-entry").forEach((button) => {
    button.addEventListener("click", function () {
      deleteEntry(this.getAttribute("data-id"));
    });
  });
}

function saveEntryInLocalStorage(entry) {
  const entries = JSON.parse(localStorage.getItem("travelEntries")) || [];
  entries.push(entry);
  localStorage.setItem("travelEntries", JSON.stringify(entries));
}

function deleteEntry(entryId) {
  let entries = JSON.parse(localStorage.getItem("travelEntries")) || [];
  entries = entries.filter((entry) => entry.id.toString() !== entryId);
  localStorage.setItem("travelEntries", JSON.stringify(entries));
  if (markers[entryId]) {
    map.removeLayer(markers[entryId]);
    delete markers[entryId];
  }
  updateEntriesView();
}

function moveToPopup(entryId) {
  const entry = JSON.parse(localStorage.getItem("travelEntries")).find(
    (entry) => entry.id.toString() === entryId
  );
  if (!entry || !map) return;

  const coords = [entry.lat, entry.lng];
  map.setView(coords, 13, {
    animate: true,
    pan: {
      duration: 1,
    },
  });
}

function handleSubmit(e) {
  e.preventDefault();
  const entryData = getFormData();
  saveEntryInLocalStorage(entryData);
  addMarkerToMap(entryData);
  resetForm();
  toggleModal();
  updateEntriesView();
}

function getFormData() {
  return {
    title: entryTitle.value,
    location: entryLocation.value,
    description: entryDescription.value,
    photo: entryPhoto.value,
    favorite: favorite.checked,
    visitStatus: visitStatus.value,
    id: Date.now(),
    lat: mapEvent.latlng.lat,
    lng: mapEvent.latlng.lng,
  };
}

function resetForm() {
  entryForm.reset();
}

function buscarLugar(event) {
  event.preventDefault();
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    searchInput.value
  )}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const firstResult = data[0];        
        map.setView([firstResult.lat, firstResult.lon], 13);
        L.marker([firstResult.lat, firstResult.lon]).addTo(map);
        searchInput.value = ''
      } else {
        alert("Lugar no encontrado");
      }
    })
    .catch((error) => console.error("Error al buscar el lugar:", error));
}

function toggleFieldsBasedOnStatus() {
  const isVisited = this.value === "visitado";
  document
    .querySelector('div.form-row input[type="url"]')
    .parentNode.classList.toggle("form__row--hidden", !isVisited);
  document
    .querySelector('div.form-row input[type="checkbox"]')
    .parentNode.classList.toggle("form__row--hidden", !isVisited);
}

function loadMarkers() {
  const entries = JSON.parse(localStorage.getItem("travelEntries")) || [];
  entries.forEach((entry) => addMarkerToMap(entry));
}

function addMarkerToMap(entryData) {
  const customIcon = getCustomIcon();
  const marker = L.marker([entryData.lat, entryData.lng], {
    icon: customIcon,
  }).addTo(map);
  marker.bindPopup(getPopupContent(entryData)).openPopup();
  markers[entryData.id] = marker;
}

function getCustomIcon() {
  return L.icon({
    iconUrl: "imgs/flag.svg",
    iconSize: [38, 95],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
  });
}

function getPopupContent(entryData) {
  return L.popup({
    maxWidth: 250,
    minWidth: 100,
    autoClose: false,
    closeOnClick: false,
    className: `${entryData.visitStatus}-popup`,
  }).setContent(`${entryData.title}<br>${entryData.location}`);
}

function initialize() {
  initMap();
  setupFormListeners();
  setupUIListeners();
  document.addEventListener("DOMContentLoaded", () => {
    updateEntriesView();
    attachClickEventToEntries();
  });
}

initialize();
