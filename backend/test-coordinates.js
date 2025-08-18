// Test script for coordinate extraction

// Sample KML content for testing
const sampleKML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Test KML</name>
    <Placemark>
      <name>Test Point 1</name>
      <Point>
        <coordinates>-122.0856545755255,37.42243077405461,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Test Point 2</name>
      <Point>
        <coordinates>-122.0844,37.4220,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>Test Polygon</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -122.366,37.816,0
              -122.365,37.816,0
              -122.365,37.815,0
              -122.366,37.815,0
              -122.366,37.816,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

// Function to extract first two coordinates from KML content
function extractFirstTwoCoordinates(kmlContent) {
  const coordinates = [];
  
  try {
    // Look for coordinates in different KML geometry types
    const coordinatePatterns = [
      /<coordinates>\s*([^<]+)\s*<\/coordinates>/g,
      /<coord>\s*([^<]+)\s*<\/coord>/g
    ];
    
    for (const pattern of coordinatePatterns) {
      let match;
      while ((match = pattern.exec(kmlContent)) !== null && coordinates.length < 2) {
        const coordText = match[1].trim();
        
        // Parse coordinate string - KML format is "longitude,latitude,altitude"
        const coordLines = coordText.split(/[\s\n\r]+/).filter(line => line.trim());
        
        for (const line of coordLines) {
          if (coordinates.length >= 2) break;
          
          const parts = line.trim().split(',');
          if (parts.length >= 2) {
            const longitude = parseFloat(parts[0]);
            const latitude = parseFloat(parts[1]);
            const altitude = parts.length > 2 ? parseFloat(parts[2]) || 0 : 0;
            
            if (!isNaN(longitude) && !isNaN(latitude)) {
              coordinates.push({
                longitude: longitude,
                latitude: latitude,
                altitude: altitude
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting coordinates from KML:', error);
  }
  
  return coordinates;
}

// Test the function
console.log('Testing coordinate extraction...');
const result = extractFirstTwoCoordinates(sampleKML);
console.log('Extracted coordinates:', JSON.stringify(result, null, 2));
console.log(`Number of coordinates extracted: ${result.length}`);

if (result.length >= 1) {
  console.log(`First coordinate: Longitude ${result[0].longitude}, Latitude ${result[0].latitude}, Altitude ${result[0].altitude}`);
}
if (result.length >= 2) {
  console.log(`Second coordinate: Longitude ${result[1].longitude}, Latitude ${result[1].latitude}, Altitude ${result[1].altitude}`);
}
