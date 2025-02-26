const socket = io();

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            if (!isNaN(latitude) && !isNaN(longitude)) {
            	console.log(latitude,longitude)

                socket.emit("send-location", { latitude, longitude });
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
}

const map = L.map("map").setView([0, 0],2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "APUN KA MAP>>",
    maxZoom: 19,
}).addTo(map);

const markers = {}
socket.on("recieve-location",(data)=>{
	const {id,latitude,longitude} = data;
	map.setView([latitude,longitude],16)
	if (markers[id]){
		markers[id].setLatLng([latitude,longitude])
	}
	else
	{
		markers[id] = L.marker([latitude,longitude]).addTo(map)
	}

})