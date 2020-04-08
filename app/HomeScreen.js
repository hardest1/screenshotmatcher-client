import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Button,
  ActivityIndicator,
  AsyncStorage,
  Alert
} from 'react-native';

import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Permissions from 'expo-permissions';
import * as Sharing from 'expo-sharing';

import api from './services/api';

class HomeScreen extends React.Component {


  constructor(props) {
    super(props);

    this.state = {
      hasPermission: null,
      hasPermissionFiles: null,

      paired: false,

      address: '',

      isPairing: false,
      isUpdatingStatus: false,
      isPhotoLoading: false,
    }

  }

  componentDidMount() {
    (async () => {

      let { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL, Permissions.CAMERA);
      this.setState({ 
        hasPermission: status === 'granted', 
      });

      try {
        const addr = await AsyncStorage.getItem('apiAddress');
        if (addr !== null) { 
          this.setState({ address: addr }); 
          api.setUrl(addr).then(() => { this.updateStatus() })
        }
      } catch (error) {
        console.error(error)
      }

    })();
  }

  handleBarCodeScanned({ type, data }){
    //alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    this.setState({
      isPairing: false,
      address: data,
    });
    api.setUrl(data).then(() => { this.updateStatus() })
  };

  async handleCodeBtnPress(){
    this.setState({ isPairing: true })
  }

  async handlePictureBtnPress(){
    
    if(!this.camera){
      alert('Camera not found')
      return
    }

    const pictureOptions = {
      quality: 0,
      // skipProcessing: true
    }
    
    const picture = await this.camera.takePictureAsync(pictureOptions)

    const manipResult = await ImageManipulator.manipulateAsync(
      picture.uri,
      [{ resize: { width: 512 } }],
    );

    this.setState({ isPhotoLoading: true });

    const resultImg = await api.postImage(manipResult)
    
    if(resultImg == "no result"){
      Alert.alert( 'Result', 'No match found', [ { text: 'OK' } ] );
      this.setState({ isPhotoLoading: false });
    }
    else{

      const downloadedImg = await api.downloadFile(resultImg)
    
      this.setState({ isPhotoLoading: false });
  
      if (!(await Sharing.isAvailableAsync())) {
        alert(`Uh oh, sharing isn't available on your platform`);
        return
      }
  
      Sharing.shareAsync(downloadedImg);
    }

    
  }

  async updateStatus(){
    this.setState({ isUpdatingStatus: true });
    const isConnected = await api.heartbeat();
    this.setState({ isUpdatingStatus: false, paired: isConnected });
  }

  renderStatus(){
    if(this.state.isUpdatingStatus){
      return (
        <ActivityIndicator size="large" color="#00ff00" />
      )
    }
    else if(this.state.paired){
      return (
        <Text style={styles.statusTextPaired}>Connected with {this.state.address}</Text>
      )
    }
    else{
      return (
        <Text style={styles.statusTextUnpaired}>Not connected!</Text>
      )
    }
  }

  render() {
    
    if (this.state.hasPermission === null) {
      return <Text>Requesting for permissions</Text>;
    }
    if (this.state.hasPermission === false) {
      return <Text>No access to files and/or camera</Text>;
    }

    if(this.state.isPairing){
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignContent: "center"
          }}>
    
          <Text
            style={{
              textAlign: "center",
              padding: 10
            }} >Pair your device by scanning the provided QR Code</Text>
    
          <BarCodeScanner
            onBarCodeScanned={({ type, data }) => this.handleBarCodeScanned({ type, data })}
            style={{
              width: "auto",
              height: "80%",
            }}
    
          />
        </View>
      );
    }
    
    return (
      <View style={styles.container}>

        {this.state.paired && (
          <View style={{ flex: 1 }}>
            <Camera 
              style={{ flex: 1 }} 
              type={Camera.Constants.Type.back}
              ref={ref => { 
                this.camera = ref;
              }}
              >
              </Camera>
              {this.state.isPhotoLoading ? (
                <Button disabled={true} onPress={() => this.handlePictureBtnPress()} title="Processing.." />
              ) : (
                <Button onPress={() => this.handlePictureBtnPress()} title="Take Picture" />
              )}
              
          </View>
        )}

        <View style={styles.itemContainer}>
          {this.renderStatus()}
        </View>

        {!this.state.paired && (
          <View style={styles.itemContainer}>
            <Button onPress={() => this.handleCodeBtnPress()} title="Scan QR Code" />
          </View>
        )}

        <View style={styles.itemContainer}>
          <Button onPress={() => this.updateStatus()} title="Check Connection" />
        </View>

      </View>
    );

  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
  },
  itemContainer: {
    marginVertical: 15,
    paddingHorizontal: 15,
  },
  statusTextMeta: {
    textAlign: "center",
  },
  statusTextUnpaired: {
    textAlign: "center",
    color: "red"
  },
  statusTextPaired: {
    textAlign: "center",
    color: "green"
  }
});

export default HomeScreen;
