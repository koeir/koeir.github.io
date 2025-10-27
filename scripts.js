// script.js — assumes flood_prone_areas.js defines `FLOOD_PRONE_AREAS` array
const location_coordinates = [{ name: "Bacolod", x: 10.640739, y: 122.968956 }];

const bacolod = location_coordinates.find((loc) => loc.name === "Bacolod");
const map = L.map("map", { preferCanvas: true, zoomControl: false }).setView(
	[bacolod.x, bacolod.y],
	13,
);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
}).addTo(map);

// Marker cluster group
const markersCluster = L.markerClusterGroup();
const markers = []; // keep references for search

const sidebarEl = document.getElementById("sidebar");
const infoEl = document.getElementById("info");
const closeBtn = document.getElementById("closeBtn");

function openSidebar(html) {
	infoEl.innerHTML = html;
	sidebarEl.classList.add("active");
	sidebarEl.setAttribute("aria-hidden", "false");
}

function closeSidebar() {
	sidebarEl.classList.remove("active");
	sidebarEl.setAttribute("aria-hidden", "true");
}

closeBtn.addEventListener("click", closeSidebar);
map.on("click", () => closeSidebar());

// Create markers from FLOOD_PRONE_AREAS
FLOOD_PRONE_AREAS.forEach((fp_area) => {
	const marker = L.marker(fp_area.coords);
	const popupHtml = `
        <b>${fp_area.name}</b>
        <br><i>${fp_area.project}</i><br>
        <small>${fp_area.status} • ${fp_area.start} - ${fp_area.end}</small>`;
	marker.bindPopup(popupHtml);

	marker.on("click", () => {
		openSidebar(`
      <h3 style="text-align: center;">${fp_area.name}</h3>
      <p><strong>Flood-Control Project:</strong> ${fp_area.project}</p>
      <p><strong>Budget:</strong> ${fp_area.budget}</p>
      <p><strong>Started:</strong> ${fp_area.start}</p>
      <p><strong>Completion:</strong> ${fp_area.end}</p>
      <p><strong>Status:</strong> ${fp_area.status}</p>
      <p>${fp_area.desc}</p>
      <div class="image-gallery">
        ${fp_area.images.map((image) => `<img src="${image}" alt="Area image">`).join("")}
      </div>
      <p style="font-size:0.85em;color:#bbb;">Source: ${fp_area.source || "DPWH/news"}</p>
    `);

		map.panTo(new L.LatLng(fp_area.coords[0], fp_area.coords[1]));
	});

	markersCluster.addLayer(marker);
	markers.push({ marker: marker, data: fp_area });
});

map.addLayer(markersCluster);

// Search logic
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

function findProjectByQuery(query) {
	const q = query.trim().toLowerCase();
	if (!q) return null;

	return markers.find(
		(m) =>
			m.data.name.toLowerCase().includes(q) ||
			(m.data.area && m.data.area.toLowerCase().includes(q)),
	);
}

function handleSearch() {
	const query = searchInput.value;
	const found = findProjectByQuery(query);

	if (!found) {
		alert("No project found matching that query.");
		return;
	}

	closeSidebar();
	found.marker.closePopup();

	// Focus map on marker
	const latlng = found.marker.getLatLng();
	map.setView(latlng, 14, { animate: true });

	// Open popup
	found.marker.openPopup();

	// Sidebar info
	openSidebar(`
    <h3>${found.data.name}</h3>
    <p><strong>Location:</strong> ${found.data.area}</p>
    <p><strong>Budget:</strong> ${found.data.budget}</p>
    <p><strong>Started:</strong> ${found.data.start}</p>
    <p><strong>Estimated Completion:</strong> ${found.data.end}</p>
    <p><strong>Status:</strong> ${found.data.status}</p>
    <p>${found.data.desc}</p>
    <p style="font-size:0.85em;color:#bbb;">Source: ${found.data.source || "DPWH/news"}</p>
  `);
}

searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") handleSearch();
});

infoEl.addEventListener("click", (event) => {
	if (event.target.tagName === "IMG") {
		const modal = document.getElementById("imageModal");
		const modalImg = document.getElementById("fullscreenImage");
		modal.style.display = "block";
		modalImg.src = event.target.src;
	}
});

// Close modal
const modal = document.getElementById("imageModal");
modal.addEventListener("click", () => {
	modal.style.display = "none";
});

infoEl.addEventListener("scroll", () => {
	const { scrollTop, scrollHeight, clientHeight } = infoEl;
	const atTop = scrollTop === 0;

	// Adjust opacity based on scroll position
	closeBtn.style.opacity = atTop ? 1 : 0.5;
});
