const socket = io();
const map = L.map("map").setView([20.5937, 78.9629], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "APUN KA MAP>>",
    maxZoom: 19,
}).addTo(map);

let routeControl;
let userMarker;


function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(latitude, longitude);
                    resolve([latitude, longitude]); 
                },
                (error) => {
                    reject(error); 
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, 
                    maximumAge: 0,
                }
            );
        } else {
            reject(new Error("idk pal"))
        }
    });
}




function initializeloc(latitude, longitude) {
    if (routeControl) {
        map.removeControl(routeControl);
    }
    if (!userMarker) {
        userMarker = L.marker([latitude, longitude]).addTo(map);
        map.setView([latitude, longitude], 16);
    } else {
        userMarker.setLatLng([latitude, longitude]);
    }

    socket.emit("send-location", { latitude, longitude });
}




getUserLocation()
    .then((con) => {
        initializeloc(con[0], con[1]);
    })
    .catch((error) => {
        console.error("Error fetching location:", error);
    });






document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const startLocation = document.getElementById("start").value;
    const endLocation = document.getElementById("destination").value;

    if (!startLocation || !endLocation) {
        if (startLocation === "Your Location") {
            try {
                getUserLocation()
                        .then((con) => {
                            initializeloc(con[0], con[1]);
                        })
                        .catch((error) => {
                            console.error("Error fetching location:", error);
                        });
                return;
            } catch (error) {
                console.error("Error getting live location:", error);
                alert("Could not get your live location. Please enter a valid start location.");
                return;
            }
        }
    }

    try {
        const startCoords = await getCoordinates(startLocation);
        const endCoords = await getCoordinates(endLocation);

        if (!startCoords ) {
            alert("Enter a start location at least");
            return;
        }

        drawRoute(startCoords, endCoords);
    } catch (error) {
        console.error("Error fetching location data:", error);
        alert("An error occurred while fetching location data.");
    }
});



async function getCoordinates(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}




function drawRoute(startCoords, endCoords) {
    if (routeControl) {
        map.removeControl(routeControl);
    }
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker= false
    }

    routeControl = L.Routing.control({
        waypoints: [L.latLng(startCoords), L.latLng(endCoords)],
        routeWhileDragging: true,
        show: true,
    }).addTo(map);
}

const markers = {};
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});
