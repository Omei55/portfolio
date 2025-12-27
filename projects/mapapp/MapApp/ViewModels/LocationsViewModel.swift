//
//  LocationsViewModel.swift
//  MapApp
//
//  Created by Omkar Vilas Sapkal on 06/02/25.
//

import Foundation
import MapKit
import SwiftUI


class LocationsViewModel: ObservableObject {
    @Published var locations: [Location]
    
    @Published var mapLocation: Location{
        didSet{
            updateMapRegion(location: mapLocation)
        }
    }
    
    @Published var mapRegion: MKCoordinateRegion =  MKCoordinateRegion()
    let mapSpan = MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    @Published var showLoactionsList: Bool = false
    
    @Published var sheetLocation: Location? = nil
    
    init(){
        let locations = LocationsDataService.locations
        self.locations = locations
        self.mapLocation = locations.first!
        self.updateMapRegion(location: locations.first!)
    }
    
    private func updateMapRegion(location: Location){
        withAnimation(.easeInOut){
            mapRegion = MKCoordinateRegion(
                center: location.coordinates,
                                           span: mapSpan)
        }
        
    
    }
     func toggleLocationsList(){
            withAnimation(.easeInOut){
            showLoactionsList.toggle()
        }
        }
    
    func showNextLocation(location: Location){
        withAnimation(.easeInOut){
            mapLocation = location
            showLoactionsList = false
                
        }
        
    }
    
    func nextButtonPressed(){
        guard let  currentIndex = locations.firstIndex(where: {$0 == mapLocation}) else{
            print("No current index")
            return
        }
        let nextIndex = currentIndex + 1
        guard locations.indices.contains(nextIndex) else{
            guard let firstLocation = locations.first else {
                return}
                showNextLocation(location: locations.first!)
                return
            }
        
        let nextLocation = locations[nextIndex]
        showNextLocation(location: nextLocation)
        }
    }

