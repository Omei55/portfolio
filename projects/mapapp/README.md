# 🗺️ MapApp - Interactive Location Explorer

A beautiful iOS application built with SwiftUI and MapKit that allows users to explore famous landmarks and locations around the world. The app features an interactive map with location pins, detailed information views, and smooth navigation between locations.

## 📱 Features

- **Interactive Map View**: Explore locations on a beautiful MapKit interface
- **Location Pins**: Tap on map annotations to zoom into specific locations
- **Detailed Information**: View comprehensive details about each location including:
  - Location name and city
  - Detailed descriptions
  - Image galleries with multiple photos
  - Wikipedia links for additional information
  - Precise coordinates
- **Smooth Navigation**: Use the "Next" button to seamlessly move between locations
- **Location List**: Toggle a list view to see all available locations
- **Animated Transitions**: Smooth animations when switching between locations
- **Custom Annotation Views**: Beautiful custom pin designs on the map

## 🏛️ Included Locations

The app currently features famous landmarks from:

### Rome, Italy
- **Colosseum** - The largest ancient amphitheatre in the world
- **Pantheon** - A former Roman temple and Catholic church
- **Trevi Fountain** - The largest Baroque fountain in Rome

### Paris, France
- **Eiffel Tower** - Iconic wrought-iron lattice tower
- **Louvre Museum** - World's most-visited museum

## 🛠️ Technologies

- **SwiftUI** - Modern declarative UI framework
- **MapKit** - Apple's mapping framework for interactive maps
- **MVVM Architecture** - Clean architecture pattern
- **ObservableObject** - Reactive state management
- **Combine Framework** - Reactive programming

## 📁 Project Structure

```
MapApp/
├── MapApp/
│   ├── Models/
│   │   └── Location.swift              # Location data model
│   ├── ViewModels/
│   │   └── LocationsViewModel.swift   # Business logic and state management
│   ├── Views/
│   │   ├── LocationView.swift         # Main map view
│   │   ├── LocationDetailView.swift    # Detailed location information
│   │   ├── LocationPreviewView.swift  # Preview card at bottom
│   │   ├── LocationsListView.swift     # List of all locations
│   │   └── LocationViewAnnotationView.swift  # Custom map pin
│   ├── DataServices/
│   │   └── LocationsDataService.swift  # Location data source
│   ├── Assets.xcassets/                # Images and assets
│   └── MapAppApp.swift                 # App entry point
├── MapAppTests/                        # Unit tests
└── MapAppUITests/                      # UI tests
```

## 🏗️ Architecture

The app follows the **MVVM (Model-View-ViewModel)** architecture pattern:

- **Model**: `Location` struct containing location data
- **View**: SwiftUI views for UI presentation
- **ViewModel**: `LocationsViewModel` managing app state and business logic

### Key Components

#### Location Model
```swift
struct Location: Identifiable, Equatable {
    let name: String
    let cityName: String
    let coordinates: CLLocationCoordinate2D
    let description: String
    let imageNames: [String]
    let link: String
}
```

#### LocationsViewModel
- Manages map region and current location
- Handles location navigation (next/previous)
- Controls UI state (list visibility, sheet presentation)
- Provides smooth animations for map transitions

## 🚀 Getting Started

### Prerequisites

- **Xcode 14.0+** (recommended: latest version)
- **iOS 15.0+** deployment target
- **macOS** for development
- **Apple Developer Account** (for device testing)

### Installation

1. **Clone or download the project**
   ```bash
   cd /path/to/MapApp
   ```

2. **Open in Xcode**
   ```bash
   open MapApp.xcodeproj
   ```

3. **Select a simulator or device**
   - Choose an iOS simulator from the device menu
   - Or connect a physical iOS device

4. **Build and Run**
   - Press `Cmd + R` or click the Play button
   - The app will launch on your selected device/simulator

### Running the App

1. Launch the app to see the map with location pins
2. Tap on any pin to zoom into that location
3. Use the "Next" button in the preview card to navigate to the next location
4. Tap the location name at the top to toggle the locations list
5. Tap on a location in the preview card to see detailed information

## 🎨 User Interface

### Main Screen
- **Top Header**: Location name with dropdown arrow to show/hide location list
- **Map View**: Interactive map with custom annotation pins
- **Bottom Preview Card**: Shows current location with:
  - Location image
  - Name and city
  - "Next" button for navigation
  - Tap to view details

### Detail View
- **Image Gallery**: Swipeable image carousel
- **Title Section**: Location name and city
- **Description**: Detailed information about the location
- **Wikipedia Link**: External link for more information
- **Mini Map**: Shows location on a smaller map view

## 🔧 Customization

### Adding New Locations

To add a new location, edit `LocationsDataService.swift`:

```swift
Location(
    name: "Your Location Name",
    cityName: "City Name",
    coordinates: CLLocationCoordinate2D(latitude: XX.XXXX, longitude: XX.XXXX),
    description: "Your description here",
    imageNames: ["image-1", "image-2", "image-3"],
    link: "https://wikipedia.org/wiki/Your_Location"
)
```

### Adding Images

1. Add images to `Assets.xcassets/Locations/[CityName]/`
2. Reference them in the `imageNames` array

### Customizing Map Region

Adjust the map span in `LocationsViewModel.swift`:

```swift
let mapSpan = MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
```

## 📸 Screenshots

The app features:
- Beautiful map interface with custom pins
- Smooth animations between locations
- Rich detail views with image galleries
- Intuitive navigation controls

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
Cmd + U in Xcode
```

### UI Tests
The project includes UI test targets for automated testing.

## 📝 Code Highlights

### Smooth Map Transitions
```swift
func showNextLocation(location: Location) {
    withAnimation(.easeInOut) {
        mapLocation = location
        showLoactionsList = false
    }
}
```

### Custom Map Annotations
```swift
MapAnnotation(coordinate: location.coordinates) {
    LocationViewAnnotationView()
        .scaleEffect(vm.mapLocation == location ? 1 : 0.7)
        .shadow(radius: 10)
        .onTapGesture {
            vm.showNextLocation(location: location)
        }
}
```

## 🎯 Future Enhancements

Potential improvements:
- [ ] Add more locations and cities
- [ ] Search functionality
- [ ] Favorites/bookmarks
- [ ] Offline map support
- [ ] Directions integration
- [ ] User location tracking
- [ ] Share location feature
- [ ] Dark mode optimizations

## 📄 License

This project is for educational and portfolio purposes.

## 👤 Author

**Omkar Vilas Sapkal**
- Created: February 6, 2025

## 🙏 Acknowledgments

- Apple's MapKit framework documentation
- SwiftUI community resources
- Location data and images from various sources

---

**Built with ❤️ using SwiftUI and MapKit**

