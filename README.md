Numbered distance markers in Google Maps
======

The Google Maps API does not include methods for numbered markers or placing evenly spaced markers along a route (such as mile/kilometer markers).

Using the computeDistanceBetween() and interpolate() methods in the google.maps.geometry.spherical library, this script traverses all nodes of a given polyline and returns an array of equally spaced marker postions.

In this version the numbered marker icons are achieved by use of the Google Chart API (which is slow).

See live demo at https://preview.c9.io/bradhenslee/gmaps-mile-markers/map.html
