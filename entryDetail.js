function getEntryId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

function showEntryDetail() {
  const entryId = getEntryId();
  const entries = JSON.parse(localStorage.getItem("travelEntries")) || [];
  const entry = entries.find((e) => e.id.toString() === entryId);

  if (entry) {
    document.getElementById("entry-detail").innerHTML = `
    <h2 class="detail-title">${entry.title}</h2>
    <p class="detail-text">${entry.location}</p>
    <p class="detail-text">${entry.description}</p>
    ${
      entry.photo
        ? `<img src="${entry.photo}" alt="Photo of ${entry.title}" class="detail-image">`
        : ""
    }
    <p class="detail-favorite">Favorite: ${entry.favorite ? "Yes" : "No"}</p>
      `;
  } else {
    document.getElementById("entry-detail").innerText =
      "Entrada no encontrada.";
  }
}

document.addEventListener("DOMContentLoaded", showEntryDetail);
