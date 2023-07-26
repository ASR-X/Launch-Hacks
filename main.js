// Action items: fix font color under "results", fix longitude error

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
  for (const city in itinerary) {
    const data = itinerary[city][0];

    // Create new div for this city's results
    const resultsDiv = document.createElement('div');
    resultsDiv.id = city + 'Results';
    resultsDiv.classList.add('city-results');
    document.getElementById('results').appendChild(resultsDiv);

    // Add itinerary to this city's results div
    let content = `<h2 style = "color: white">${city}</h2>
                   <p style = "color: white">Stay at <strong>${data.accommodations[0]}</strong> for <strong>${data['number of days']}</strong></p>
                   <p style = "color: white">Activities:</p>
                   <ul style = "color: white">`;
    data.activities.forEach(activity => {
      content += `<li>Go to the ${activity[0]}</li>`;
    });
    content += '</ul>';
    resultsDiv.innerHTML = content;

    // Now add map container to this city's results div
    const mapContainer = document.createElement('div');
    mapContainer.id = 'mapContainer' + city;
    mapContainer.style.height = '400px';
    mapContainer.style.width = '600px';
    mapContainer.style.margin = '20px';
    resultsDiv.appendChild(mapContainer);
  }
}

function createMiniMap(itinerary){
    for (const city in itinerary){
        const containerId = 'mapContainer' + city;
        const newDiv = document.createElement('div');
        newDiv.id = containerId;
        newDiv.style.height = '400px';
        newDiv.style.width = '600px';
        newDiv.style.margin = '20px';

        const existingDiv = document.getElementById("mainBody");
        existingDiv.appendChild(newDiv);

        const data = itinerary[city][0];
        
        const coordsAccommodation = data['accommodations'][1];
        const [accommodationLat, accommodationLong] = coordsAccommodation.split(','); // Might have to change brackets

        const accommodationLatFloat = parseFloat(accommodationLat);
        const accommodationLongFloat = parseFloat(accommodationLong);
        
        const initialCenter = { lat: accommodationLatFloat, lng: accommodationLongFloat};
        const accommodationLabel = data.accommodations[0];
        const accommodationImageUrl = data.accommodations[2];
        const accommodationImgString = `<h1 id="firstHeading" class="firstHeading" style="font-weight:bold; font-size: 14px;">${accommodationLabel}</h1><div><img src="${accommodationImageUrl}" alt="Image" style="max-width: 100%;"></div>`;
        const accommodationPointsItem = { lat: accommodationLatFloat, lng: accommodationLongFloat, img: accommodationImgString };

        const points = [];
        points.push(accommodationPointsItem)

        data.activities.forEach(activity => {
            const activityLabel = activity[0];
            const coordsActivity = activity[1];
            const [activityLat, activityLong] = coordsActivity.split(',');

            const activityLatFloat = parseFloat(activityLat);
            const activityLongFloat = parseFloat(activityLong);

            const activityImgUrl = activity[2]
            const activityImgString = `<h1 id="firstHeading" class="firstHeading" style="font-weight:bold; font-size: 14px;">${activityLabel}</h1><div><img src="${activityImgUrl}" alt="Image" style="max-width: 100%;"></div>`;

            const activityPointsItem = { lat: activityLatFloat, lng: activityLongFloat, img: activityImgString };
            points.push(activityPointsItem);

        });

        const map = new google.maps.Map(document.getElementById('mapContainer' + city), {
        center: initialCenter,
        zoom: 12,
    });

        points.forEach(point => {
            const marker = new google.maps.Marker({
                position: {lat: point.lat, lng: point.lng},
                map: map,
            });

            const infoWindow = new google.maps.InfoWindow({
                content: point.img,
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
    }
}
