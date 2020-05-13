import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';

import { Container, H1, Text } from 'native-base';

import Modal from 'react-native-modal';

import * as ImageManipulator from 'expo-image-manipulator';
import * as Permissions from 'expo-permissions';

import Api from './services/Api';

import Head from './components/Head';
import Barcode from './components/Barcode';
import Cam from './components/Cam';
import Result from './components/Result';
import Feedback from './components/Feedback';

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      paired: false,
      isModalVisible: false,

      hasPermission: null,
      hasResult: false,
      resultUri: '',
      currentUid: '',

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

  resetResult(){
    this.setState({ hasResult: false, resultUri: '' })
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

    this.setState({ isPhotoLoading: true, loadingMsg: 'Matching...' });
    
    // take picture
    const picture = await this.camera.takePictureAsync({ quality: 0 })

    // scale down result to a width of 512px
    const manipResult = await ImageManipulator.manipulateAsync(
      picture.uri,
      [{ resize: { width: 512 } }],
    );

    // post picture to the server
    const matchResult = await Api.postImage(manipResult)

    if(!matchResult){
      this.setState({ isPhotoLoading: false, loadingMsg: '' });
      Alert.alert( 'Result', 'Server or Network error', [ { text: 'OK' } ] );
      return
    }
    else if(!matchResult.hasResult){
      this.setState({ currentUid: matchResult.uid, isPhotoLoading: false, loadingMsg: '' });
      this.toggleModal();
      return
    }
    else{

      this.setState({ currentUid: matchResult.uid, loadingMsg: 'Downloading...' });

      // download result image from server
      const downloadedImg = await Api.downloadFile(matchResult.filename)
      
      this.setState({ resultUri: downloadedImg, hasResult: true, isPhotoLoading: false, loadingMsg: '' });
    }
    
  }

 
  toggleModal = () => {
    this.setState({isModalVisible: !this.state.isModalVisible});
  };

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
            hasResult={this.state.hasResult}
            resetResult={this.resetResult.bind(this)}
            isUpdating={this.state.isUpdatingStatus} 
            updateStatus={this.updateStatus.bind(this)} 
            startPairing={this.startPairing.bind(this)} 
            />

          <Modal isVisible={this.state.isModalVisible} onBackButtonPress={this.toggleModal}>
            <View style={{flex: 1, justifyContent: "center", padding: 10, textAlign: "center", backgroundColor: "white"}}>
              <Text style={{textAlign:"center", fontWeight:"bold"}}>No match found!</Text>
              <Feedback uid={this.state.currentUid} hasResult={this.state.hasResult} />
            </View>
          </Modal>

          {
            this.state.isPairing ? (
              <Barcode
                handleBarCodeScanned={this.handleBarCodeScanned.bind(this)} 
                />
            ) : (
              this.state.hasResult ? (
                <Result 
                  hasResult={this.state.hasResult}
                  resultUri={this.state.resultUri}
                  uid={this.state.currentUid}
                  />
              ) : (
                <Cam
                  initCamera={this.initCamera.bind(this)}
                  isPhotoLoading={this.state.isPhotoLoading}
                  loadingMsg={this.state.loadingMsg}
                  handlePictureBtnPress={this.handlePictureBtnPress.bind(this)}
                  />
              )
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
