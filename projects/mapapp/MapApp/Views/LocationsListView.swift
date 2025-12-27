//
//  LocationsListView.swift
//  MapApp
//
//  Created by Omkar Vilas Sapkal on 10/02/25.
//

import SwiftUI
import MapKit

struct LocationsListView: View {
    
    @EnvironmentObject private var vm: LocationsViewModel  // Fixed missing variable name

    var body: some View {
        List{
            ForEach(vm.locations) { location in
                
                Button{
                    vm.showNextLocation(location: location)
                }label: {
                    listrowView(location: location)
                }
                .padding(.vertical, 4)
                    .listRowBackground(Color.clear)
                    .foregroundColor(.black)
               
                    
                    
            }
            .listStyle(PlainListStyle())
        }
    }
}

#Preview {
    LocationsListView()
        .environmentObject(LocationsViewModel())
}


extension LocationsListView{
    private func listrowView( location: Location) -> some View {
        HStack{
            if let imagename = location.imageNames.first {
                Image(imagename)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 45, height: 45)
                    .cornerRadius(10)
                
                
                
            }
            VStack(alignment: .leading){
                Text(location.name)
                    .font(.headline)
                    
                
                Text(location.cityName)
                    .font(.subheadline)
                
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
        }
    }
    
}
