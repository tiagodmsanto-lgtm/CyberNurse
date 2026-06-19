import React from 'react';
import { View, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// The Ad Unit ID provided for CyberNurse Banner
const adUnitId = __DEV__ 
  ? TestIds.BANNER 
  : (Platform.OS === 'android' ? 'ca-app-pub-6355833710660579/6379727589' : TestIds.BANNER);

export function AdBanner() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 10, width: '100%' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}
