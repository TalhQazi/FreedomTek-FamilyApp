import React from 'react';
import { StyleSheet } from 'react-native';
import HomePhotosScreen from '../home/photos';

export default function PhotosGalleryScreen() {
  return (
   <HomePhotosScreen/>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center',  color:'#fff'},
});
