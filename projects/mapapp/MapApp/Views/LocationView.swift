//
//  LocationView.swift
//  MapApp
//
//  Created by Omkar Vilas Sapkal on 06/02/25.
//

import SwiftUI
import MapKit



struct LocationView: View {
    
    @EnvironmentObject private var vm: LocationsViewModel
    
    @State private var mapRegion: MKCoordinateRegion = MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: 41.8902, longitude: 12.4922), span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1))
    
    var body: some View {
        locationPreviewStack
    }
        
}

#Preview {
    LocationView()
        .environmentObject(LocationsViewModel())
}


extension LocationView{
    private var header: some View {
        VStack {
            Button(action: vm.toggleLocationsList) {
                Text(vm.mapLocation.name + ", " + vm.mapLocation.cityName)
                    .font(.title2)
                    .fontWeight(.black)
                    .foregroundColor(.primary)
                    .frame(height: 55)
                    .frame(maxWidth: .infinity)
                    .overlay(alignment: .leading){
                        Image(systemName: "arrow.down")
                            .font(.headline)
                            .foregroundColor(.primary)
                            .padding()
                            .rotationEffect(Angle(degrees: vm.showLoactionsList ? 180 : 0))
                        
                        
                    }
            }
            if vm.showLoactionsList{
                LocationsListView()
            }
        }
        
        .background(.thickMaterial)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.3), radius: 20, x: 0, y: 15)
    }
    
    private var mapLayer: some View {
        Map(coordinateRegion: $vm.mapRegion,
            annotationItems: vm.locations,
            annotationContent: {location in
            MapAnnotation(coordinate: location.coordinates){
                LocationViewAnnotationView()
                    .scaleEffect(vm.mapLocation == location ? 1 : 0.7)
                    .shadow(radius: 10)
                    .onTapGesture {
                        vm.showNextLocation(location: location)
                    }
            }
            
        })
    }
    private var locationPreviewStack: some View {
        ZStack{
            mapLayer
            .ignoresSafeArea()
            
            VStack(spacing: 0){
                header
                .padding()
                
                    
                
                
                
                Spacer()
                
                ZStack{
                    ForEach(vm.locations) { location in
                        if vm.mapLocation == location{
                            LocationPreviewView(location: location)
                                .shadow(color: .black.opacity(0.3), radius: 20)
                                .padding()
                                .transition(.asymmetric(insertion: .move(edge: .trailing), removal: .move(edge: .leading)))
                        }
                        
                    }
                }
            }
            .sheet(item: $vm.sheetLocation) { location in
                LocationDetailView(location: location)
            }

                
            }
                
        }
    }
    




