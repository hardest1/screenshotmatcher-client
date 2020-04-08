import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';

import { Container, H1 } from 'native-base';

import * as ImageManipulator from 'expo-image-manipulator';
import * as Permissions from 'expo-permissions';
import * as Sharing from 'expo-sharing';

import Api from './services/Api';

import Head from './components/Head';
import Barcode from './components/Barcode';
import Cam from './components/Cam';

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      paired: false,

      hasPermission: null,

      isPairing: false,
      isUpdatingStatus: false,
      isPhotoLoading: false,
    }

  }

  componentDidMount() {
    (async () => {

      // ask for permissions
      let { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL, Permissions.CAMERA);
      this.setState({ hasPermission: status === 'granted' });

      // init api (retrieve url from storage, update status if successful)
      if( await Api.init() ) { await this.updateStatus() }

    })();
  }

  // init camera ref from within the cam component
  initCamera(cam){
    this.camera = cam
  }

  // start pairing process (showing barcode reader)
  startPairing(){
    this.setState({ isPairing: true })
  }

  // barcode scanner callback, setting api base url
  handleBarCodeScanned({ type, data }){
    //alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    this.setState({ isPairing: false });
    Api.setUrl(data).then(() => { this.updateStatus() })
  };

  // check & update connection status
  async updateStatus(){
    this.setState({ isUpdatingStatus: true });
    const isConnected = await Api.heartbeat();
    this.setState({ isUpdatingStatus: false, paired: isConnected });
  }

  // handle picture taking
  async handlePictureBtnPress(){
    
    // exit if no camera
    if(!this.camera){
      alert('Camera not found')
      return
    }

    this.setState({ isPhotoLoading: true });
    
    // take picture
    const picture = await this.camera.takePictureAsync({ quality: 0 })

    // scale down result to a width of 512px
    const manipResult = await ImageManipulator.manipulateAsync(
      picture.uri,
      [{ resize: { width: 512 } }],
    );

    // post picture to the server
    const resultImg = await Api.postImage(manipResult)
    
    if(resultImg == "no result"){
      this.setState({ isPhotoLoading: false });
      Alert.alert( 'Result', 'No match found', [ { text: 'OK' } ] );
      return
    }
    else{
      // download result image from server
      const downloadedImg = await Api.downloadFile(resultImg)
    
      this.setState({ isPhotoLoading: false });
      
      // check if sharing is available
      if (!(await Sharing.isAvailableAsync())) {
        alert(`Uh oh, sharing isn't available on your platform`);
        return
      }
      
      // share picture
      Sharing.shareAsync(downloadedImg);
    }

    
  }

  render() {

    if (this.state.hasPermission === null) {
      return (
        <View style={styles.flexContainer}>
          <H1>Requesting permissions</H1>
        </View>
      )
    }
    if (this.state.hasPermission === false) {
      return (
        <View style={styles.flexContainer}>
          <H1>No access to files and/or camera</H1>
        </View>
      )
    }
    
    return (
      <>
        <Container>

          <Head 
            paired={this.state.paired} 
            isUpdating={this.state.isUpdatingStatus} 
            updateStatus={this.updateStatus.bind(this)} 
            startPairing={this.startPairing.bind(this)} 
            />
          
          { 
            this.state.isPairing ? (
              <Barcode
                handleBarCodeScanned={this.handleBarCodeScanned.bind(this)} 
                />
            ) : (
              <Cam
                initCamera={this.initCamera.bind(this)}
                isPhotoLoading={this.state.isPhotoLoading}
                handlePictureBtnPress={this.handlePictureBtnPress.bind(this)}
                />
            ) 
          }

        </Container>
      </>
    );

  }
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
  },
});

export default Main;
