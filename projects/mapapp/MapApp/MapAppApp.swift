//
//  MapAppApp.swift
//  MapApp
//
//  Created by Omkar Vilas Sapkal on 06/02/25.
//

import SwiftUI


@main
struct MapAppApp: App {
    @StateObject private var vm = LocationsViewModel()
    var body: some Scene {
        WindowGroup {
            LocationView()
                .environmentObject(vm)
        }
    }
}
