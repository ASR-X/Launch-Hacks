document.getElementById('planningForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        country: document.getElementById('country').value,
        duration: document.getElementById('duration').value,
        max_destinations: document.getElementById('max_destinations').value,
        budget: document.getElementById('budget').value,
        interests: document.getElementById('interests').value
    };
    axios.get('http://localhost:8000/trip', { params: data })
        .then(function(response) {
            document.getElementById('results').classList.remove('d-none');
            displayItinerary(response.data.itinerary);
            displayMap(response.data.itinerary);
        })
        .catch(function(error) {
            console.log(error);
        });
});

function displayItinerary(itinerary) {
    let content = '';
    for (const city in itinerary) {
        const data = itinerary[city][0];
        content += `<h2>${city}</h2>
                    <p>Stay at <strong>${data.accommodations[0]}</strong> at coordinates ${data.accommodations[1]}</p>
                    <img src="${data.accommodations[2]}" alt="${data.accommodations[0]}">
                    <p>Activities:</p>
                    <ul>`;
        data.activities.forEach(activity => {
            content += `<li>${activity[0]} at coordinates ${activity[1]} <img src="${activity[2]}" alt="${activity[0]}"></li>`;
        });
        content += '</ul>';
    }
    document.getElementById('results').innerHTML = content;
}

function displayMap(itinerary) {
    const map = L.map('map').setView([0, 0], 2); // Initiate the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, }).addTo(map); // Set the tile layer

    for (const city in itinerary) {
        const data = itinerary[city][0];
        const coordsAccommodation = data.accommodations[1].split(',').map(x => parseFloat(x));
        const marker = L.marker(coordsAccommodation).addTo(map);
        marker.bindPopup(`<b>${city}</b><br>Accommodation: ${data.accommodations[0]}`);
        
        data.activities.forEach(activity => {
            const coordsActivity = activity[1].split(',').map(x => parseFloat(x));
            const markerActivity = L.marker(coordsActivity).addTo(map);
            markerActivity.bindPopup(`<b>${city}</b><br>Activity: ${activity[0]}`);
        });
    }
}