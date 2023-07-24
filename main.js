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
            createMiniMap(response.data.itinerary);
        })
        .catch(function(error) {
            console.log(error);
        });
});

function displayItinerary(itinerary) {
    let content = 'A brief overview of your travel plan:';
    for (const city in itinerary) {
        const data = itinerary[city][0];
        content += `<h2>${city}</h2>
                    <p>Stay at <strong>${data.accommodations[0]}</strong></p>
                    <p>Activities:</p>
                    <ul>`;
        data.activities.forEach(activity => {
            // content += `<li>${activity[0]} at coordinates ${activity[1]} <img src="${activity[2]}" alt="${activity[0]}"></li>`;
            content += `<li>Go to ${activity[0]}</li>`;
        });
        content += '</ul>';
    }
    document.getElementById('results').innerHTML = content;
}

function createMiniMap(itinerary){
    var apiKey = 'our key';

    for (const city in itinerary){
        const containerId = 'mapContainer' + city;
        const newDiv = document.createElement('div');
        newDiv.id = containerId;

        const data = itinerary[city][0];
        
        const coordsAccomodation = data.accomodations[1];
        const [accommodationLat, accommodationLong] = coordsAccomodation.split(','); // Might have to change brackets

        const accommodationLatFloat = parseFloat(accommodationLat);
        const accommodationLongFloat = parseFloat(accommodationLong);
        const initialCenter = { lat: accommodationLatFloat, lng: accommodationLongFloat};

        const points = [];

        data.activities.forEach(activity => {
            const activityLabel = activity[0];
            const coordsActivity = activity[1];
            const [activityLat, activityLong] = coordsActivity.split(',');

            const activityLatFloat = parseFloat(activityLat);
            const activityLongFloat = parseFloat(activityLong);
            imageUrl = activity[2]
            const contentImgString = `<div><img src="${imageUrl}" alt="Image" style="max-width: 100%;"></div>`;

            const pointsItem = { 'lat': activityLatFloat, 'lng': activityLongFloat, 'label': activityLabel, 'img': contentImgString};
            points.push(pointsItem);


        });

        const map = new google.maps.Map(document.getElementById(containerId), {
            center: initialCenter,
            zoom: 12,
        });

        points.forEach(point => {
            const marker = new google.maps.Marker({
                position: position,
                map: map,
            });

            const infoWindow = new google.maps.InfoWindow({
                ariaLabel: point.label,
                content: point.img,
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
    }
}

// function displayMap(itinerary) {
//     const map = L.map('map').setView([0, 0], 2); // Initiate the map
//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, }).addTo(map); // Set the tile layer

//     for (const city in itinerary) {
//         const data = itinerary[city][0];
//         const coordsAccommodation = data.accommodations[1].split(',').map(x => parseFloat(x));
//         const marker = L.marker(coordsAccommodation).addTo(map);
//         marker.bindPopup(`<b>${city}</b><br>Accommodation: ${data.accommodations[0]}`);
        
//         data.activities.forEach(activity => {
//             const coordsActivity = activity[1].split(',').map(x => parseFloat(x));
//             const markerActivity = L.marker(coordsActivity).addTo(map);
//             markerActivity.bindPopup(`<b>${city}</b><br>Activity: ${activity[0]}`);
//         });
//     }
// }