import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import Marker, {
  ImageFormat,
  Position,
  TextBackgroundType,
  TextMarkOptions,
} from 'react-native-image-marker';
import {
  Asset,
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import ImageView from 'react-native-image-viewing';
import {PERMISSIONS, request} from 'react-native-permissions';
import Toast from 'react-native-toast-message';

const wSize = Dimensions.get('window');
const folderPath = RNFS.DownloadDirectoryPath + '/' + Date.now() + '.png';
const cameraConfig: CameraOptions = {mediaType: 'photo', cameraType: 'back'};
const App = () => {
  const [image, setImage] = useState('');
  const [loading, setIsLoading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [cameraPermGranted, setCameraPermGranted] = useState(false);
  const [storagePermGranted, setStoragePermGranted] = useState(false);

  useEffect(() => {
    const fetchNecessaryPermisisons = async () => {
      try {
        const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
        if (cameraPermission === 'granted') {
          setCameraPermGranted(true);
        }

        const apiLevel = DeviceInfo.getSystemVersion();
        if (Number(apiLevel) >= 13) {
          setStoragePermGranted(true);
          return;
        }
        const storagePermission = await request(
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        );
        if (storagePermission === 'granted') {
          setStoragePermGranted(true);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchNecessaryPermisisons();
  }, []);

  const getMarkerConfig = useCallback((img: Asset): TextMarkOptions => {
    const fontSize = img.width ? Math.round(img.width / 40) : 56;

    return {
      backgroundImage: {
        src: img.uri,
      },
      watermarkTexts: [
        {
          text: 'Created with Watermarkize',
          positionOptions: {
            position: Position.bottomLeft,
          },
          style: {
            fontSize,
            color: '#fff',
            textBackgroundStyle: {
              paddingX: 15,
              paddingY: 15,
              color: '#000',
              type: TextBackgroundType.none,
            },
          },
        },
      ],
      filename: 'watermarkize',
      saveFormat: ImageFormat.base64,
    };
  }, []);

  const openCamera = async () => {
    try {
      const result = await launchCamera(cameraConfig);
      if (result.assets) {
        setIsLoading(true);
        const photo = result.assets[0];
        const modImage = await Marker.markText(getMarkerConfig(photo));
        setImage(modImage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openGallery = async () => {
    try {
      const result = await launchImageLibrary(cameraConfig);
      if (result.assets) {
        setIsLoading(true);
        const photo = result.assets[0];
        const modImage = await Marker.markText(getMarkerConfig(photo));
        setImage(modImage);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFileToDevice = useCallback(async () => {
    try {
      setIsLoading(true);
      const resources = image.split('data:image/png;base64,');
      await RNFS.writeFile(folderPath, resources[1], 'base64');
      Toast.show({
        type: 'success',
        text1: 'Hurray!!',
        text2: 'Photo saved to your device',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Oops!',
        text2:
          'Unable to save photo at the moment. Please check your storage permissions and retry.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [image]);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Pressable
          style={styles.pressable}
          disabled={!image || loading}
          onPress={() => setShowFullImage(true)}>
          <Image
            style={styles.image}
            source={
              image
                ? {uri: image}
                : require('./assets/images/default_image.jpg')
            }
          />
          <ActivityIndicator
            animating={loading}
            size={60}
            style={styles.loadingIndicator}
          />
        </Pressable>
        {image ? (
          <Button
            disabled={!storagePermGranted}
            title="Save to Device"
            onPress={saveFileToDevice}
          />
        ) : null}
      </View>
      <View style={styles.buttonsContainer}>
        <Button
          disabled={!cameraPermGranted}
          title="Open Camera"
          onPress={openCamera}
        />
        <Button title="Open Gallery" onPress={openGallery} />
      </View>
      <Toast position="bottom" />
      {image ? (
        <ImageView
          imageIndex={0}
          swipeToCloseEnabled
          images={[{uri: image}]}
          visible={showFullImage}
          onRequestClose={() => setShowFullImage(false)}
        />
      ) : null}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: '30%',
  },
  imageContainer: {
    alignItems: 'center',
    rowGap: 20,
  },
  image: {
    height: wSize.width * 0.7,
    width: wSize.width * 0.7,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  buttonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
  },
});
