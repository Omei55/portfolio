//
//  LocationViewAnnotationView.swift
//  MapApp
//
//  Created by Omkar Vilas Sapkal on 14/02/25.
//

import SwiftUI

struct LocationViewAnnotationView: View {
    let accentColor =  Color("AccentColor")
    
    var body: some View {
        VStack(spacing: 0){
            Image(systemName: "map.circle.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 30, height: 30)
                .foregroundColor(.white)
                .padding(6)
                .background(accentColor)
                .cornerRadius(36)
            
            
            Image(systemName: "triangle.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 10, height: 10)
                .foregroundColor(accentColor)
                .rotationEffect(.degrees(180))
                .offset(y: -3)
                .padding(.bottom, 40)
            
        }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        LocationViewAnnotationView()
    }
}
