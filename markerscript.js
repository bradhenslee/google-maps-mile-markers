 



$(document).ready(function() { 

  var myOptions = {
    zoom: 5,
    center: new google.maps.LatLng(35.22256, -97.439470),
    scaleControl: false,
    panControl: false,
    // mapTypeControlOptions: { mapTypeIds: ['Styled'] },
    mapTypeId: 'Styled',
    mapTypeControl:false
  };

 var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  var styles = [
    // {"featureType": "administrative", "stylers": [{ "visibility": "off" }]},
    // {"featureType": "road", "stylers": [{ "visibility": "off" }]},
    {"featureType": "poi", "stylers": [{ "visibility": "off" }]},
    {"featureType": "water", "stylers": [{ "visibility": "simplified" }]},
    // {"featureType": "landscape.man_made", "stylers": [{ "visibility": "off" }]},
    {"featureType": "transit", "stylers": [{ "visibility": "off" }]}
    // {"featureType": "landscape.natural", "stylers": [{ "visibility": "off" }]
    
  ];

  var styledMapType = new google.maps.StyledMapType(styles);

  map.mapTypes.set('Styled', styledMapType);

   // if the browser supports the Geolocation API
  if (typeof navigator.geolocation == "undefined") { $("#error").text("Your browser doesn't support the Geolocation API");
      return;
    }

  $("#from-link, #to-link").click(function(event) {
    event.preventDefault();
    var addressId = this.id.substring(0, this.id.indexOf("-"));
    navigator.geolocation.getCurrentPosition(function(position) {
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({ 
        "location": new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
      },
      function(results, status) {
        if (status == google.maps.GeocoderStatus.OK)
          $("#" + addressId).val(results[0].formatted_address);
        else
          $("#error").append("Unable to retrieve your address<br>");
      });
    },
    function(positionError){
      $("#error").append("Error: " + positionError.message + "<br>");
    },
    {
      enableHighAccuracy: true,
      timeout: 10 * 1000 // 10 seconds
    });
  });

  $("#calculate-route").submit(function(event) {
    event.preventDefault();
    calculateRoute($("#from").val(), $("#to").val());
  });

      
  function calculateRoute(from, to) {
    var unitsWanted = ($("#unitsWanted").val());
    var directionsService = new google.maps.DirectionsService();
    var directionsRequest = {
        origin: from,
        destination: to,
        travelMode: google.maps.DirectionsTravelMode.DRIVING
      };
    
    directionsService.route( directionsRequest, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {   
            parseRoute(response.routes[0].overview_polyline.points, $("#segmentsWanted").val(), $("#unitsWanted").val());
        } else {
            $("#error").append("Unable to retrieve your route.");
        }
      });
  }



// determine marker positions along route requested by user

    function roundNumber(number, decimals) {
      return parseFloat(number.toFixed(parseInt(decimals))); 
    }
    
    function parseRoute(directionsRoute, segmentsWanted, unitsWanted) {
      
      var decodedRoute = google.maps.geometry.encoding.decodePath(directionsRoute);
      
      var lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        strokeColor: "#000000",
        strokeOpacity: 1,
        strokeWeight: 1,
        scale: .5
      };  
      
      var arrow = {
        icon: lineSymbol,
        repeat: "0.1%"
      };
    
      var polyline = new google.maps.Polyline({
        strokeColor: 'blue',
        strokeWeight: 10,
        path: decodedRoute,
        strokeOpacity: .5,
        geodesic: true
        // ,icons: [arrow]
      });
          
      setMarkers(polyline, unitsWanted, 0);
    
      function getBounds(poly) {
        
        var bounds = new google.maps.LatLngBounds;
        poly.getPath().forEach(function(latLng) { bounds.extend(latLng); });
          return bounds;  
      
      }
    
      var myBounds = getBounds(polyline);
    
      polyline.setMap(map);
    
      map.fitBounds(myBounds); 
    
      function attachInfo(marker, content){
    
        var infowindow = new google.maps.InfoWindow({content: content});
    
        google.maps.event.addListener(marker, 'click', function() {infowindow.open(map,marker);});
        google.maps.event.addListener(map, 'click', function() {infowindow.close();});
    
      }
    
      for (var i=0; i < polyline.markers.length; i++) {
    
        var marker = new google.maps.Marker({
    
          position: polyline.markers[i].latlong,        
            
          // icon: new google.maps.MarkerImage( ('http://chart.apis.google.com/chart?chst=d_bubble_text_small&chld=bb|' + (i) + '@' + roundNumber( (polyline.markers[i].traveled), 0) + '|008933|FFFFFF'), null, null, new google.maps.Point(0, 42) ), //COUNTERS
          icon: new google.maps.MarkerImage(('http://chart.apis.google.com/chart?chst=d_bubble_text_small&chld=bb|' + i + '|008933|FFFFFF'), null, null, new google.maps.Point(0, 42)), //MILES
          title: ("latlong:" + polyline.markers[i].latlong + " mk#:" + i + " traveled:" + polyline.markers[i].traveled.toFixed(0) ),
    
          map: map
          });
    
        attachInfo(marker, marker.title);
    
      }
    
    
      function setMarkers(line, segs, trav, pointA, pointB, i){
        
        if (trav <= 0){ // initialize
    
          line.markers = [];
          line.points = line.getPath(); 
          line.length = google.maps.geometry.spherical.computeLength(line.getPath()); // total length of polyline
          
          if (segs === "Imperial") {    
            segs = line.length * 0.000621371;
            } else if (segs === "Metric") {
            segs = line.length * 0.001;
            } 
    
          line.segl = line.length / segs;
    
          var i = 1; // counter for point b;
          var pointA = line.points.getAt(i-1); // point a latlong
          var pointB = line.points.getAt(i); // point b latlong
          var trav = 0; // total distance traversed 
    
          pushMarker(pointA);
    
        }
        
        var between = google.maps.geometry.spherical.computeDistanceBetween(pointA,pointB); // distance between pointA and pointB
        var markerNext = 1 + ~~(trav / line.segl); // count of next marker to traverse, with first = 1
        var dnext = (markerNext * line.segl) - trav; // distance to next marker   
        
        if (markerNext >= (segs) ){ //terminal case: all markers pushed
        
          trav = line.length;
          pushMarker(polyline.points.getAt(polyline.points.length-1));
          return line;
    
        } else if (dnext > between) { //no marker detected, move to next point in polyline
          
          trav = trav + between; 
          i = i + 1;
          setMarkers(line, segs, trav, pointB, line.points.getAt(i), i); 
    
        } else if (dnext === 0) { //kludge: bump forward when differences in rounding(?) causes zero change in trav between two points. fix this...
          
          trav = trav + .000001 
          setMarkers(line, segs, trav, pointA, pointB, i);      
    
        } else {
    
          var wayPoint = google.maps.geometry.spherical.interpolate(pointA, pointB, (dnext / between) );
          trav = trav + dnext; 
          pushMarker(wayPoint);
          setMarkers(line, segs, trav, wayPoint, pointB, i);
    
        }
            // function pushDistance(){ line.points.distance( {traveled: trav } ); }
    
        function pushMarker(point){
            line.markers.push( {latlong: point, traveled: trav} );
            // console.log("PUSHED " + (line.markers.length - 1) + " AT " + point);
            // console.log(trav + "\n");
          }
    
        function diagnostics(msg){
          var output = {msg: msg, dnext: dnext.toFixed(2), between: between.toFixed(2), markerNext: markerNext, i: i, pointA: pointA, pointB: pointB, trav: trav.toFixed(2) };
          console.log(output);
        }
      
      }
    }
});
